// Purpose: NextAuth.js (Auth.js) configuration
// - Configures Google OAuth provider
// - Uses JWT strategy (no database required)
// - Integrates with Base API SSO Google after successful OAuth
// - Stores Base API tokens (access_token, refresh_token) in JWT
// - Automatically refreshes Base API tokens when expired
// - Exports auth instance and handlers

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/env";
import { refreshToken, ssoGoogle } from "@/lib/services/auth";
import { getBaseCookie } from "@/lib/utils/base-api";
import {
  getJwtExpiration,
  isExpirationExpired,
  isTokenExpired,
} from "@/lib/utils/jwt";

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
              if (baseAuthResult.data.access_token) {
                token.baseAccessToken = baseAuthResult.data.access_token;
              }
              if (baseAuthResult.data.refresh_token) {
                token.baseRefreshToken = baseAuthResult.data.refresh_token;
              }
              // Store expiration time from JWT
              if (baseAuthResult.data.access_token) {
                const expiration = getJwtExpiration(
                  baseAuthResult.data.access_token
                );
                if (expiration) {
                  token.baseExpiresAt = expiration;
                }
              }
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

      // Refresh Base API token if expired or about to expire
      if (
        token.baseAccessToken &&
        token.baseRefreshToken &&
        typeof token.baseAccessToken === "string" &&
        typeof token.baseRefreshToken === "string"
      ) {
        const shouldRefresh =
          isTokenExpired(token.baseAccessToken) ||
          (token.baseExpiresAt &&
            typeof token.baseExpiresAt === "number" &&
            isExpirationExpired(token.baseExpiresAt));

        if (shouldRefresh) {
          try {
            const cookie = getBaseCookie();
            const refreshResult = await refreshToken({
              refreshToken: token.baseRefreshToken,
              cookie,
            });

            if (refreshResult.success && refreshResult.data) {
              // Update Base API tokens
              if (refreshResult.data.access_token) {
                token.baseAccessToken = refreshResult.data.access_token;
                // Update expiration time
                const expiration = getJwtExpiration(
                  refreshResult.data.access_token
                );
                if (expiration) {
                  token.baseExpiresAt = expiration;
                }
              }
              if (refreshResult.data.refresh_token) {
                token.baseRefreshToken = refreshResult.data.refresh_token;
              }
            } else {
              console.error("Failed to refresh Base API token:", refreshResult.error);
              // If refresh fails, clear tokens to force re-authentication
              delete token.baseAccessToken;
              delete token.baseRefreshToken;
              delete token.baseExpiresAt;
            }
          } catch (error) {
            console.error("Error refreshing Base API token:", error);
            // If refresh fails, clear tokens to force re-authentication
            delete token.baseAccessToken;
            delete token.baseRefreshToken;
            delete token.baseExpiresAt;
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
