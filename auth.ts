// Purpose: NextAuth.js (Auth.js) configuration
// - Configures Google OAuth provider
// - Uses JWT strategy (no database required)
// - Integrates with Base API SSO Google after successful OAuth
// - Stores Base API tokens (access_token, refresh_token) in JWT
// - Exports auth instance and handlers

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { ssoGoogle } from "@/lib/services/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - get Google OAuth tokens and authenticate with Base API
      if (account && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;

        // Authenticate with Base API using Google SSO
        if (user.email && account.access_token) {
          try {
            const baseAuthResult = await ssoGoogle({
              email: user.email,
              accessToken: account.access_token,
            });

            if (baseAuthResult.success && baseAuthResult.data) {
              // Store Base API tokens in JWT
              // Note: Base API returns JWT tokens, not expires_in
              // We can decode JWT to get expiration if needed in the future
              if (baseAuthResult.data.access_token) {
                token.baseAccessToken = baseAuthResult.data.access_token;
              }
              if (baseAuthResult.data.refresh_token) {
                token.baseRefreshToken = baseAuthResult.data.refresh_token;
              }
              // Base API tokens are JWT tokens, expiration is encoded in the token itself
              // We'll handle token refresh when needed
            } else {
              // If Base API SSO fails, don't create a valid session
              // This ensures users without Base API access cannot authenticate
              console.error(
                "Base API SSO Google failed:",
                baseAuthResult.error
              );
              // Throw error to prevent session creation
              throw new Error(
                `Base API authentication failed: ${baseAuthResult.error || "Unknown error"}`
              );
            }
          } catch (error) {
            console.error("Error calling Base API SSO Google:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Expose user data and Base API tokens to client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }

      // Add Base API tokens to session
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

      return session;
    },
  },
});

// Extend NextAuth types to include Base API tokens
declare module "next-auth" {
  interface Session {
    baseAccessToken?: string;
    baseRefreshToken?: string;
    baseExpiresAt?: number;
  }
}

// JWT type extension is handled via the JWT callback parameter type
// In NextAuth v5, JWT properties are typed through the callback
