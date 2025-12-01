// Purpose: Service for refreshing authentication tokens with Base API
// - Makes POST request to Base refresh endpoint
// - Uses form data with refresh_token and __code parameters
// - Returns new token data or error information
// - Validates input and output using Zod schemas

import { env } from "@/env";
import { createFetchClient } from "@/lib/fetch-client";
import {
  refreshTokenDataSchema,
  refreshTokenOptionsSchema,
  type RefreshTokenOptions,
  type RefreshTokenResponse,
} from "@/lib/schemas/auth";
import { getBaseCookie } from "@/lib/utils/base-api";

// API endpoint path for token refresh
const REFRESH_TOKEN_ENDPOINT = "/ajax/mobile/auth/refresh";

// Form code value for mobile API
const MOBILE_CODE = "mobile";

// HTTP headers constants
const USER_AGENT = "hrm/2 CFNetwork/3860.200.71 Darwin/25.1.0";

// Error messages
const ERROR_MISSING_TOKEN = "Refresh token is not provided";
const ERROR_INVALID_RESPONSE = "Response data validation failed";

/**
 * Refreshes authentication token using Base API
 *
 * @param options - Optional refresh token and cookie override
 * @returns Promise with refresh token response
 *
 * @example
 * const result = await refreshToken();
 * if (result.success) {
 *   console.log(result.data?.access_token);
 * }
 */
export async function refreshToken(
  options?: RefreshTokenOptions
): Promise<RefreshTokenResponse> {
  // Validate input options
  let validatedOptions: RefreshTokenOptions | undefined;
  if (options) {
    const validationResult = refreshTokenOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid options: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
      };
    }
    validatedOptions = validationResult.data;
  }

  const domain = env.BASE_DOMAIN;
  const cookie = getBaseCookie();

  const refreshTokenValue = validatedOptions?.refreshToken;
  if (!refreshTokenValue) {
    return {
      success: false,
      error: ERROR_MISSING_TOKEN,
    };
  }

  // Create fetch client with base URL
  // fetch-client handles logging and error handling internally when enableLogger is true
  const client = createFetchClient({
    baseUrl: domain,
    enableLogger: true,
  });

  // Prepare form data (URLSearchParams for form-urlencoded)
  const formData = new URLSearchParams();
  formData.append("refresh_token", refreshTokenValue);
  formData.append("__code", MOBILE_CODE);

  // Prepare headers
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Cache-Control": "no-cache",
  };

  const cookieValue = validatedOptions?.cookie || cookie;
  if (cookieValue) {
    headers.Cookie = cookieValue;
  }

  // Make request using fetch-client
  // URLSearchParams is supported directly, Content-Type will be set automatically
  // parseJson defaults to true, so no need to specify
  // fetch-client handles all errors internally
  const result = await client.request<{
    code?: number;
    message?: string;
    access_token?: string;
    refresh_token?: string;
  }>({
    url: REFRESH_TOKEN_ENDPOINT,
    method: "POST",
    headers,
    body: formData,
  });

  const data = result.data;

  // Validate response data structure
  const validatedData = refreshTokenDataSchema.safeParse(data);
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
