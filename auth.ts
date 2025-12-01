// Purpose: NextAuth.js (Auth.js) configuration
// - Configures Google OAuth provider
// - Uses JWT strategy (no database required)
// - Stores Google OAuth tokens in JWT
// - Base API authentication is handled separately when accessing /admin routes
// - Exports auth instance and handlers

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/env";

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
      // Initial sign in - store Google OAuth tokens
      // Base API authentication is handled separately when accessing /admin routes
      if (account && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        // Clear Base API tokens on new sign in
        delete token.baseAccessToken;
        delete token.baseRefreshToken;
        delete token.baseExpiresAt;
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

      return session;
    },
  },
});

// Extend NextAuth types to include Google OAuth tokens
declare module "next-auth" {
  interface Session {
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }
}

// JWT type extension is handled via the JWT callback parameter type
// In NextAuth v5, JWT properties are typed through the callback
