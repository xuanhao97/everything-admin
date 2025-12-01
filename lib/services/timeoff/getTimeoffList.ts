// Purpose: Service for fetching timeoff list from Base API
// - Makes GET request to Base timeoff list endpoint
// - Uses Authorization Bearer token from session or environment
// - Returns timeoff list data or error information
// - Validates input and output using Zod schemas

import { env } from "@/env";
import { getBaseAccessTokenFromContext } from "@/lib/base-auth";
import { getBaseCookie } from "@/lib/base-auth/base-cookie";
import { createFetchClient } from "@/lib/fetch-client";
import {
  getTimeoffListOptionsSchema,
  timeoffListDataSchema,
  type GetTimeoffListOptions,
  type TimeoffListResponse,
} from "@/lib/schemas/timeoff";

// API endpoint path for timeoff list
const TIMEOFF_LIST_ENDPOINT = "/ajax/api/mobile/timeoff/list";

// HTTP headers constants
const USER_AGENT = "Base/3 CFNetwork/3860.200.71 Darwin/25.1.0";

// Error messages
const ERROR_MISSING_TOKEN = "Access token is not provided";
const ERROR_INVALID_RESPONSE = "Response data validation failed";

/**
 * Fetches timeoff list from Base API
 *
 * @param options - Optional access token and cookie override
 * @returns Promise with timeoff list response
 *
 * @example
 * const result = await getTimeoffList();
 * if (result.success) {
 *   console.log(result.data?.data);
 * }
 */
export async function getTimeoffList(
  options?: GetTimeoffListOptions
): Promise<TimeoffListResponse> {
  // Validate input options
  let validatedOptions: GetTimeoffListOptions | undefined;
  if (options) {
    const validationResult = getTimeoffListOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid options: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
      };
    }
    validatedOptions = validationResult.data;
  }

  // Get domain - use dynamic access to avoid build-time evaluation issues
  const domain = env.BASE_TIMEOFF_DOMAIN;

  // Get access token from options or request context
  // Base API tokens are stored in request context by admin layout
  let sessionAccessToken: string | undefined;
  try {
    sessionAccessToken = await getBaseAccessTokenFromContext();
  } catch {
    // Ignore if not available (e.g., during build)
    sessionAccessToken = undefined;
  }
  const accessTokenValue = validatedOptions?.accessToken || sessionAccessToken;

  if (!accessTokenValue) {
    return {
      success: false,
      error: ERROR_MISSING_TOKEN,
    };
  }

  // Get cookie from options, session, or environment variable (in that order)
  const sessionCookie = getBaseCookie();
  const cookie = validatedOptions?.cookie || sessionCookie;

  // Create fetch client with base URL
  // fetch-client handles logging and error handling internally when enableLogger is true
  const client = createFetchClient({
    baseUrl: domain,
    enableLogger: true,
  });

  // Prepare headers
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Authorization: `Bearer ${accessTokenValue}`,
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  // Make request using fetch-client
  // parseJson defaults to true, so no need to specify
  // fetch-client handles all errors internally
  const result = await client.request<{
    code?: number;
    message?: string;
    timeoffs?: unknown[];
  }>({
    url: TIMEOFF_LIST_ENDPOINT,
    method: "GET",
    headers,
  });

  const data = result.data;

  // Validate response data structure
  const validatedData = timeoffListDataSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      success: false,
      error: `Invalid response data: ${validatedData.error.errors.map((e) => e.message).join(", ")}`,
      message: ERROR_INVALID_RESPONSE,
    };
  }

  return {
    success: true,
    data: validatedData.data,
  };
}
