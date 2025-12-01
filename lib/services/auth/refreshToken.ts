// Purpose: Service for refreshing authentication tokens with Base API
// - Makes POST request to Base refresh endpoint
// - Uses form data with refresh_token and __code parameters
// - Returns new token data or error information
// - Validates input and output using Zod schemas

import { env } from "@/env";
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

  const url = `${domain}${REFRESH_TOKEN_ENDPOINT}`;

  try {
    const formData = new URLSearchParams();
    formData.append("refresh_token", refreshTokenValue);
    formData.append("__code", MOBILE_CODE);

    const headers: HeadersInit = {
      "User-Agent": USER_AGENT,
      "Cache-Control": "no-cache",
    };

    const cookieValue = validatedOptions?.cookie || cookie;
    if (cookieValue) {
      headers.Cookie = cookieValue;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        message: errorText,
      };
    }

    const data = await response.json();

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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
