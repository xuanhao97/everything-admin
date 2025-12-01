// Purpose: Ensure Base API authentication for admin routes
// - Checks if Base API tokens exist
// - Authenticates with Base API if tokens are missing
// - Refreshes tokens if expired

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { logger } from "@/lib/loggers";

import {
  authenticateWithBase,
  refreshBaseToken,
  shouldRefreshBaseToken,
} from "./auth";
import { getBaseTokens, setBaseTokens } from "./context";

/**
 * Ensure Base API authentication is valid for current request
 * - Authenticates with Base API if tokens are missing
 * - Refreshes tokens if expired
 * - Stores tokens in request context
 * - Redirects to sign-in if authentication fails
 *
 * @returns Base API access token or redirects to sign-in
 */
export async function ensureBaseAuth(): Promise<string> {
  logger.debug("ensureBaseAuth: Starting Base API authentication check");

  const session = await auth();

  if (!session?.user?.email) {
    logger.warn(
      "ensureBaseAuth: No session or user email, redirecting to sign-in"
    );
    redirect("/sign-in");
  }

  // Check if we have Google OAuth tokens
  if (!session.googleAccessToken) {
    logger.warn(
      "ensureBaseAuth: Missing Google OAuth token, redirecting to sign-in"
    );
    redirect("/sign-in?error=missing_google_token");
  }

  logger.debug("ensureBaseAuth: Session validated", {
    email: session.user.email,
    hasGoogleToken: !!session.googleAccessToken,
  });

  // Check if we already have Base API tokens in request context
  const existingTokens = getBaseTokens();

  logger.debug("ensureBaseAuth: Checking existing tokens in context", {
    hasAccessToken: !!existingTokens?.accessToken,
    hasRefreshToken: !!existingTokens?.refreshToken,
    expiresAt: existingTokens?.expiresAt,
  });

  if (existingTokens?.accessToken && existingTokens?.refreshToken) {
    // Check if tokens need refresh
    const needsRefresh = shouldRefreshBaseToken(
      existingTokens.accessToken,
      existingTokens.expiresAt
    );

    logger.debug("ensureBaseAuth: Token refresh check", {
      needsRefresh,
      expiresAt: existingTokens.expiresAt,
      currentTime: Date.now(),
    });

    if (needsRefresh) {
      logger.info("ensureBaseAuth: Token expired, refreshing...");
      // Refresh the token
      const refreshResult = await refreshBaseToken(existingTokens.refreshToken);

      if (refreshResult.success && refreshResult.accessToken) {
        logger.info("ensureBaseAuth: Token refreshed successfully", {
          newExpiresAt: refreshResult.expiresAt,
        });
        // Update tokens in request context
        setBaseTokens({
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          expiresAt: refreshResult.expiresAt,
        });
        return refreshResult.accessToken;
      }

      logger.warn(
        "ensureBaseAuth: Token refresh failed, will authenticate fresh",
        {
          error: refreshResult.error,
        }
      );
      // If refresh fails, try to authenticate fresh
    } else {
      logger.debug("ensureBaseAuth: Using existing valid token");
      // Tokens are still valid
      return existingTokens.accessToken;
    }
  } else {
    logger.info(
      "ensureBaseAuth: No existing tokens found, authenticating fresh",
      {
        hasAccessToken: !!existingTokens?.accessToken,
        hasRefreshToken: !!existingTokens?.refreshToken,
      }
    );
  }

  // Authenticate with Base API using Google OAuth tokens
  logger.info("ensureBaseAuth: Authenticating with Base API", {
    email: session.user.email,
  });
  const authResult = await authenticateWithBase(
    session.user.email,
    session.googleAccessToken
  );

  // If Base API authentication fails, redirect to sign-in
  if (!authResult.success || !authResult.accessToken) {
    logger.error("ensureBaseAuth: Base API authentication failed", {
      error: authResult.error,
      success: authResult.success,
    });
    redirect("/sign-in?error=base_access_denied");
  }

  logger.info("ensureBaseAuth: Base API authentication successful", {
    expiresAt: authResult.expiresAt,
  });

  // Store Base API tokens in request context
  setBaseTokens({
    accessToken: authResult.accessToken,
    refreshToken: authResult.refreshToken,
    expiresAt: authResult.expiresAt,
  });

  logger.debug("ensureBaseAuth: Tokens stored in request context");

  return authResult.accessToken;
}

/**
 * Get Base API access token from request context
 * Automatically calls ensureBaseAuth() if token is not available
 * This ensures token is always available even if context is lost
 *
 * @returns Base API access token or undefined (if auth fails or outside admin routes)
 */
export async function getBaseAccessTokenFromContext(): Promise<
  string | undefined
> {
  try {
    const tokens = getBaseTokens();
    const hasToken = !!tokens?.accessToken;

    if (!hasToken) {
      // Automatically ensure auth if token is missing
      // This handles cases where AsyncLocalStorage context is lost
      try {
        const accessToken = await ensureBaseAuth();
        return accessToken;
      } catch (error) {
        // ensureBaseAuth() may redirect, which throws NEXT_REDIRECT error
        // This is expected behavior, so we should let it propagate
        if (error && typeof error === "object" && "digest" in error) {
          // This is a Next.js redirect, re-throw it
          throw error;
        }
        logger.error("getBaseAccessTokenFromContext: ensureBaseAuth() failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return undefined;
      }
    } else {
      return tokens.accessToken;
    }
  } catch (error) {
    // Handle Next.js redirect errors (they should propagate)
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    logger.error(
      "getBaseAccessTokenFromContext: Error getting token from context",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    );
    // Ignore if not available (e.g., during build or outside request context)
    return undefined;
  }
}
