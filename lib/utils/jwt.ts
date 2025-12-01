// Purpose: JWT token utility functions
// - Decodes JWT tokens to extract expiration time
// - Checks if tokens are expired or about to expire
// - Used for automatic token refresh logic

/**
 * Decodes JWT token and extracts expiration time
 * - Decodes JWT token without verification (we only need expiration)
 * - Returns expiration timestamp in milliseconds or null
 *
 * @param token - JWT token string
 * @returns Expiration timestamp in milliseconds or null if invalid/not found
 *
 * @example
 * const expiration = getJwtExpiration(token);
 * if (expiration) {
 *   console.log(`Token expires at: ${new Date(expiration)}`);
 * }
 */
export function getJwtExpiration(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    const decoded = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(decoded);
    if (payload.exp && typeof payload.exp === "number") {
      return payload.exp * 1000; // Convert to milliseconds
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if JWT token is expired or will expire soon
 * - Returns true if token is expired or will expire in next 5 minutes
 * - Assumes token is expired if it cannot be decoded
 *
 * @param token - JWT token string
 * @returns true if token is expired or will expire soon
 *
 * @example
 * if (isTokenExpired(token)) {
 *   // Refresh token
 * }
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getJwtExpiration(token);
  if (!expiration) return true; // If we can't decode, assume expired
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= expiration - fiveMinutes;
}

/**
 * Checks if token expiration timestamp is expired or will expire soon
 * - Returns true if expiration timestamp is expired or will expire in next 5 minutes
 * - Useful when you already have the expiration timestamp
 *
 * @param expiresAt - Expiration timestamp in milliseconds
 * @returns true if token is expired or will expire soon
 *
 * @example
 * if (isExpirationExpired(token.baseExpiresAt)) {
 *   // Refresh token
 * }
 */
export function isExpirationExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= expiresAt - fiveMinutes;
}
