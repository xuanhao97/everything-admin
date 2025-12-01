// Purpose: Request-scoped context for Base API tokens
// - Stores Base API tokens for current request
// - Uses AsyncLocalStorage for request-scoped storage
// - Tokens are set by admin layout and accessed by services

import { AsyncLocalStorage } from "async_hooks";

import { logger } from "@/lib/loggers";

// Request-scoped storage for Base API tokens
const tokenStore = new AsyncLocalStorage<{
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}>();

/**
 * Store Base API tokens for current request
 * Uses enterWith to set tokens in current async context
 *
 * @param tokens - Base API tokens
 */
export function setBaseTokens(tokens: {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}): void {
  logger.debug("setBaseTokens: Storing tokens in AsyncLocalStorage", {
    hasAccessToken: !!tokens.accessToken,
    hasRefreshToken: !!tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  });
  tokenStore.enterWith(tokens);
}

/**
 * Run a function within an async context with Base API tokens
 * This ensures all async operations in the callback can access the tokens
 *
 * @param tokens - Base API tokens
 * @param callback - Function to run within the async context
 * @returns Result of the callback function
 */
export function runWithBaseTokens<T>(
  tokens: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  },
  callback: () => T
): T {
  return tokenStore.run(tokens, callback);
}

/**
 * Get Base API tokens for current request
 *
 * @returns Base API tokens or undefined
 */
export function getBaseTokens():
  | {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    }
  | undefined {
  const tokens = tokenStore.getStore();
  logger.debug("getBaseTokens: Retrieved tokens from AsyncLocalStorage", {
    hasTokens: !!tokens,
    hasAccessToken: !!tokens?.accessToken,
    hasRefreshToken: !!tokens?.refreshToken,
    expiresAt: tokens?.expiresAt,
  });
  return tokens;
}

/**
 * Clear Base API tokens for request (cleanup)
 * Note: AsyncLocalStorage automatically clears when request ends
 */
export function clearBaseTokens(): void {
  // AsyncLocalStorage automatically clears when request context ends
  // This function is kept for API compatibility
}
