// Purpose: Utility functions for Base API token management
// - Gets Base API tokens from NextAuth session
// - Provides helper to check token expiration
// - Can be used in server components and API routes

import { auth } from "@/auth";
import { env } from "@/env";

/**
 * Gets Base API access token from session
 * Falls back to environment variable if not in session
 *
 * @returns Base API access token or undefined
 */
export async function getBaseAccessToken(): Promise<string | undefined> {
  const session = await auth();
  return session?.baseAccessToken;
}

/**
 * Gets Base API refresh token from session
 * Falls back to environment variable if not in session
 *
 * @returns Base API refresh token or undefined
 */
export async function getBaseRefreshToken(): Promise<string | undefined> {
  const session = await auth();
  return session?.baseRefreshToken;
}

/**
 * Gets Base API cookie from environment variable
 *
 * @returns Base API cookie or undefined
 */
export function getBaseCookie(): string | undefined {
  if (!env.BASE_ID) return undefined;
  return `baseid=${env.BASE_ID}`;
}

/**
 * Checks if Base API access token is expired
 *
 * @param expiresAt - Expiration timestamp in milliseconds
 * @returns true if token is expired or will expire in next 5 minutes
 */
export function isBaseTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= expiresAt - fiveMinutes;
}

/**
 * Gets all Base API tokens and cookie from session
 * Useful for making Base API requests
 *
 * @returns Object with accessToken, refreshToken, and cookie
 */
export async function getBaseApiCredentials(): Promise<{
  accessToken?: string;
  refreshToken?: string;
  cookie?: string;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    getBaseAccessToken(),
    getBaseRefreshToken(),
  ]);

  return {
    accessToken,
    refreshToken,
    cookie: getBaseCookie(),
  };
}
