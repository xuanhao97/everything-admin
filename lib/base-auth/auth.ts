// Purpose: Base API authentication functions
// - Authenticates with Base API using Google OAuth tokens
// - Refreshes Base API tokens when expired
// - Checks token expiration

import { getBaseCookie } from "@/lib/base-auth/base-cookie";
import { refreshToken, ssoGoogle } from "@/lib/services/auth";
import {
  getJwtExpiration,
  isExpirationExpired,
  isTokenExpired,
} from "@/lib/utils/jwt";

/**
 * Authenticate with Base API using Google OAuth tokens
 *
 * @param email - User email
 * @param googleAccessToken - Google OAuth access token
 * @returns Base API tokens or error
 */
export async function authenticateWithBase(
  email: string,
  googleAccessToken: string
): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
}> {
  try {
    const result = await ssoGoogle({
      email,
      accessToken: googleAccessToken,
    });

    if (result.success && result.data) {
      const accessToken = result.data.access_token;
      const refreshTokenValue = result.data.refresh_token;
      const expiresAt = accessToken ? getJwtExpiration(accessToken) : undefined;

      return {
        success: true,
        accessToken,
        refreshToken: refreshTokenValue,
        expiresAt: expiresAt || undefined,
      };
    }

    return {
      success: false,
      error: result.error || "Base API authentication failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Refresh Base API token if expired
 *
 * @param currentRefreshToken - Current Base API refresh token
 * @returns New Base API tokens or error
 */
export async function refreshBaseToken(currentRefreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
}> {
  try {
    const cookie = getBaseCookie();
    const result = await refreshToken({
      refreshToken: currentRefreshToken,
      cookie,
    });

    if (result.success && result.data) {
      const accessToken = result.data.access_token;
      const refreshTokenValue = result.data.refresh_token;
      const expiresAt = accessToken ? getJwtExpiration(accessToken) : undefined;

      return {
        success: true,
        accessToken,
        refreshToken: refreshTokenValue,
        expiresAt: expiresAt || undefined,
      };
    }

    return {
      success: false,
      error: result.error || "Failed to refresh Base API token",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Check if Base API token needs refresh
 *
 * @param accessToken - Current Base API access token
 * @param expiresAt - Token expiration timestamp
 * @returns true if token needs refresh
 */
export function shouldRefreshBaseToken(
  accessToken?: string,
  expiresAt?: number
): boolean {
  if (!accessToken) return false;

  return (
    isTokenExpired(accessToken) ||
    (expiresAt !== undefined && isExpirationExpired(expiresAt))
  );
}
