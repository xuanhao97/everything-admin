// Purpose: Base API authentication functions
// - Authenticates with Base API using Google OAuth tokens
// - Refreshes Base API tokens when expired
// - Checks token expiration

import { getBaseCookie } from "@/lib/base-auth/base-cookie";
import { logger } from "@/lib/loggers";
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
  logger.debug("authenticateWithBase: Starting Base API authentication", {
    email,
    hasGoogleToken: !!googleAccessToken,
  });

  try {
    const result = await ssoGoogle({
      email,
      accessToken: googleAccessToken,
    });

    if (result.success && result.data) {
      const accessToken = result.data.access_token;
      const refreshTokenValue = result.data.refresh_token;
      const expiresAt = accessToken ? getJwtExpiration(accessToken) : undefined;

      logger.info("authenticateWithBase: Authentication successful", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshTokenValue,
        expiresAt,
      });

      return {
        success: true,
        accessToken,
        refreshToken: refreshTokenValue,
        expiresAt: expiresAt || undefined,
      };
    }

    logger.error("authenticateWithBase: Authentication failed", {
      error: result.error,
      success: result.success,
    });

    return {
      success: false,
      error: result.error || "Base API authentication failed",
    };
  } catch (error) {
    logger.error("authenticateWithBase: Exception during authentication", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

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
  logger.debug("refreshBaseToken: Starting token refresh", {
    hasRefreshToken: !!currentRefreshToken,
  });

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

      logger.info("refreshBaseToken: Token refresh successful", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshTokenValue,
        expiresAt,
      });

      return {
        success: true,
        accessToken,
        refreshToken: refreshTokenValue,
        expiresAt: expiresAt || undefined,
      };
    }

    logger.error("refreshBaseToken: Token refresh failed", {
      error: result.error,
      success: result.success,
    });

    return {
      success: false,
      error: result.error || "Failed to refresh Base API token",
    };
  } catch (error) {
    logger.error("refreshBaseToken: Exception during token refresh", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

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
  if (!accessToken) {
    logger.debug("shouldRefreshBaseToken: No access token provided");
    return false;
  }

  const isTokenExp = isTokenExpired(accessToken);
  const isExpExp = expiresAt !== undefined && isExpirationExpired(expiresAt);
  const needsRefresh = isTokenExp || isExpExp;

  logger.debug("shouldRefreshBaseToken: Token expiration check", {
    isTokenExpired: isTokenExp,
    isExpirationExpired: isExpExp,
    needsRefresh,
    expiresAt,
    currentTime: Date.now(),
  });

  return needsRefresh;
}
