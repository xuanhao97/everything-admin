// Purpose: Ensure Base API authentication for admin routes
// - Checks if Base API tokens exist
// - Authenticates with Base API if tokens are missing
// - Refreshes tokens if expired
// - Stores tokens in request context

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

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
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  // Check if we have Google OAuth tokens
  if (!session.googleAccessToken) {
    redirect("/sign-in?error=missing_google_token");
  }

  // Get or create request ID for token storage
  const headersList = await headers();
  const cookieStore = await cookies();
  let requestId = headersList.get("x-request-id");
  if (!requestId) {
    requestId = cookieStore.get("x-request-id")?.value || crypto.randomUUID();
  }

  // Check if we already have Base API tokens in request context
  const existingTokens = getBaseTokens(requestId);

  if (existingTokens?.accessToken && existingTokens?.refreshToken) {
    // Check if tokens need refresh
    const needsRefresh = shouldRefreshBaseToken(
      existingTokens.accessToken,
      existingTokens.expiresAt
    );

    if (needsRefresh) {
      // Refresh the token
      const refreshResult = await refreshBaseToken(existingTokens.refreshToken);

      if (refreshResult.success && refreshResult.accessToken) {
        // Update tokens in request context
        setBaseTokens(requestId, {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          expiresAt: refreshResult.expiresAt,
        });
        return refreshResult.accessToken;
      }

      // If refresh fails, try to authenticate fresh
    } else {
      // Tokens are still valid
      return existingTokens.accessToken;
    }
  }

  // Authenticate with Base API using Google OAuth tokens
  const authResult = await authenticateWithBase(
    session.user.email,
    session.googleAccessToken
  );

  // If Base API authentication fails, redirect to sign-in
  if (!authResult.success || !authResult.accessToken) {
    redirect("/sign-in?error=base_access_denied");
  }

  // Store Base API tokens in request context
  setBaseTokens(requestId, {
    accessToken: authResult.accessToken,
    refreshToken: authResult.refreshToken,
    expiresAt: authResult.expiresAt,
  });

  return authResult.accessToken;
}

/**
 * Get Base API access token from request context
 * Returns undefined if not available (e.g., outside admin routes)
 *
 * @returns Base API access token or undefined
 */
export async function getBaseAccessTokenFromContext(): Promise<
  string | undefined
> {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();
    const requestId =
      headersList.get("x-request-id") || cookieStore.get("x-request-id")?.value;

    if (requestId) {
      const tokens = getBaseTokens(requestId);
      return tokens?.accessToken;
    }
  } catch {
    // Ignore if not available (e.g., during build or outside request context)
  }

  return undefined;
}
