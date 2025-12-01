// Purpose: NextAuth.js (Auth.js) configuration
// - Configures Google OAuth provider
// - Uses JWT strategy (no database required)
// - Stores Google OAuth tokens in JWT
// - Base API authentication is handled separately when accessing /admin routes
// - Exports auth instance and handlers

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/env";

/**
 * Refreshes Google OAuth access token using refresh token
 * @param token - Current JWT token containing refresh token
 * @returns Updated token with new access token and expiry
 */
async function refreshGoogleAccessToken(token: {
  googleRefreshToken?: string;
  googleAccessToken?: string;
  googleExpiresAt?: number;
  [key: string]: unknown;
}) {
  if (!token.googleRefreshToken) {
    throw new Error("Missing Google refresh token");
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.googleRefreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      googleAccessToken: refreshedTokens.access_token,
      googleExpiresAt: Math.floor(
        Date.now() / 1000 + (refreshedTokens.expires_in ?? 3600)
      ),
      // Google may issue a new refresh token, preserve it if provided
      googleRefreshToken:
        refreshedTokens.refresh_token ?? token.googleRefreshToken,
    };
  } catch (error) {
    console.error("Error refreshing Google access token:", error);
    return {
      ...token,
      error: "RefreshTokenError" as const,
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - store Google OAuth tokens
      // Base API authentication is handled separately when accessing /admin routes
      if (account && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleExpiresAt =
          account.expires_at ?? Math.floor(Date.now() / 1000 + 3600); // Default to 1 hour if not provided
        // Clear Base API tokens on new sign in
        delete token.baseAccessToken;
        delete token.baseRefreshToken;
        delete token.baseExpiresAt;
        return token;
      }

      // Check if Google access token has expired and refresh if needed
      if (
        token.googleRefreshToken &&
        typeof token.googleExpiresAt === "number" &&
        Date.now() >= token.googleExpiresAt * 1000
      ) {
        try {
          const refreshedToken = await refreshGoogleAccessToken(token);
          return refreshedToken;
        } catch (error) {
          console.error("Error refreshing Google access token:", error);
          token.error = "RefreshTokenError";
          return token;
        }
      }

      // Allow updating Base API tokens via session update
      // This is used by ensureBaseAuth() to store tokens
      if (trigger === "update" && session) {
        // Update Base API tokens from session update
        if (session.baseAccessToken) {
          token.baseAccessToken = session.baseAccessToken as string;
        }
        if (session.baseRefreshToken) {
          token.baseRefreshToken = session.baseRefreshToken as string;
        }
        if (session.baseExpiresAt !== undefined) {
          token.baseExpiresAt = session.baseExpiresAt as number;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Expose user data and Google OAuth tokens to client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }

      // Add Google OAuth tokens to session (needed for Base API authentication)
      if (
        token.googleAccessToken &&
        typeof token.googleAccessToken === "string"
      ) {
        session.googleAccessToken = token.googleAccessToken;
      }
      if (
        token.googleRefreshToken &&
        typeof token.googleRefreshToken === "string"
      ) {
        session.googleRefreshToken = token.googleRefreshToken;
      }
      if (token.googleExpiresAt && typeof token.googleExpiresAt === "number") {
        session.googleExpiresAt = token.googleExpiresAt;
      }

      // Add Base API tokens to session (stored in JWT, not exposed to client by default)
      // These are used server-side only
      if (token.baseAccessToken && typeof token.baseAccessToken === "string") {
        session.baseAccessToken = token.baseAccessToken;
      }
      if (
        token.baseRefreshToken &&
        typeof token.baseRefreshToken === "string"
      ) {
        session.baseRefreshToken = token.baseRefreshToken;
      }
      if (token.baseExpiresAt && typeof token.baseExpiresAt === "number") {
        session.baseExpiresAt = token.baseExpiresAt;
      }

      // Propagate refresh token errors to session
      if (token.error === "RefreshTokenError") {
        session.error = token.error;
      }

      return session;
    },
  },
});

// Extend NextAuth types to include Google OAuth tokens and Base API tokens
declare module "next-auth" {
  interface Session {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    baseAccessToken?: string;
    baseRefreshToken?: string;
    baseExpiresAt?: number;
    error?: "RefreshTokenError";
  }
  interface JWT {
    googleExpiresAt?: number;
    baseAccessToken?: string;
    baseRefreshToken?: string;
    baseExpiresAt?: number;
    error?: "RefreshTokenError";
  }
}

// JWT type extension is handled via the JWT callback parameter type
// In NextAuth v5, JWT properties are typed through the callback
