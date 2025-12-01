// Purpose: Request-scoped context for Base API tokens
// - Stores Base API tokens for current request
// - Uses in-memory store keyed by request ID
// - Tokens are set by admin layout and accessed by services

// Simple in-memory store keyed by request ID
// In production, consider using AsyncLocalStorage or similar
const tokenStore = new Map<
  string,
  { accessToken?: string; refreshToken?: string; expiresAt?: number }
>();

/**
 * Store Base API tokens for current request
 *
 * @param requestId - Unique request identifier
 * @param tokens - Base API tokens
 */
export function setBaseTokens(
  requestId: string,
  tokens: { accessToken?: string; refreshToken?: string; expiresAt?: number }
): void {
  tokenStore.set(requestId, tokens);
}

/**
 * Get Base API tokens for current request
 *
 * @param requestId - Unique request identifier
 * @returns Base API tokens or undefined
 */
export function getBaseTokens(requestId: string):
  | {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    }
  | undefined {
  return tokenStore.get(requestId);
}

/**
 * Clear Base API tokens for request (cleanup)
 *
 * @param requestId - Unique request identifier
 */
export function clearBaseTokens(requestId: string): void {
  tokenStore.delete(requestId);
}
