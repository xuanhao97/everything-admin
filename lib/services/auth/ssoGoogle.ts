// Purpose: Service for authenticating with Base API using Google SSO
// - Makes POST request to Base SSO Google endpoint
// - Uses form data with email, Google access token, and __code parameters
// - Returns Base API tokens (access_token, refresh_token) or error information
// - Validates input and output using Zod schemas

import { env } from "@/env";
import { getBaseCookie } from "@/lib/base-auth/base-cookie";
import { createFetchClient } from "@/lib/fetch-client";
import {
  ssoGoogleDataSchema,
  ssoGoogleOptionsSchema,
  type SsoGoogleOptions,
  type SsoGoogleResponse,
} from "@/lib/schemas/auth";

// API endpoint path for SSO Google
const SSO_GOOGLE_ENDPOINT = "/ajax/mobile/auth/sso/google";

// Form code value for mobile API
const MOBILE_CODE = "mobile";

// HTTP headers constants
const USER_AGENT = "Base/1 CFNetwork/3860.300.21 Darwin/25.2.0";

// Error messages
const ERROR_INVALID_RESPONSE = "Response data validation failed";

/**
 * Authenticates with Base API using Google SSO
 *
 * @param options - Email, Google access token, and optional cookie
 * @returns Promise with SSO Google response containing Base API tokens
 *
 * @example
 * const result = await ssoGoogle({
 *   email: "user@example.com",
 *   accessToken: "ya29.A0ATi6K2uNrEocE...",
 * });
 * if (result.success) {
 *   console.log(result.data?.access_token);
 *   console.log(result.data?.refresh_token);
 * }
 */
export async function ssoGoogle(
  options: SsoGoogleOptions
): Promise<SsoGoogleResponse> {
  // Validate input options
  const validationResult = ssoGoogleOptionsSchema.safeParse(options);
  if (!validationResult.success) {
    return {
      success: false,
      error: `Invalid options: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
    };
  }

  const validatedOptions = validationResult.data;
  const domain = env.BASE_DOMAIN;
  const cookie = getBaseCookie();

  // Create fetch client with base URL
  // fetch-client handles logging and error handling internally when enableLogger is true
  const client = createFetchClient({
    baseUrl: domain,
    enableLogger: true,
  });

  // Prepare form data (URLSearchParams for form-urlencoded)
  const formData = new URLSearchParams();
  formData.append("__code", MOBILE_CODE);
  formData.append("sso_email", validatedOptions.email);
  formData.append("sso_access_token", validatedOptions.accessToken);

  // Prepare headers
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
  };

  const cookieValue = validatedOptions.cookie || cookie;
  if (cookieValue) {
    headers.Cookie = cookieValue;
  }

  // Make request using fetch-client
  // URLSearchParams is supported directly, Content-Type will be set automatically
  // parseJson defaults to true, so no need to specify
  // fetch-client handles all errors internally
  const result = await client.request<{
    code: number;
    message?: string;
    access_token?: string;
    refresh_token?: string;
  }>({
    url: SSO_GOOGLE_ENDPOINT,
    method: "POST",
    headers,
    body: formData,
  });

  const data = result.data;

  // Validate response data structure
  const validatedData = ssoGoogleDataSchema.safeParse(data);
  if (!validatedData.success) {
    return {
      success: false,
      error: `Invalid response data: ${validatedData.error.errors.map((e) => e.message).join(", ")}`,
      message: ERROR_INVALID_RESPONSE,
    };
  }

  // Extract tokens from response (they're at top level, not in data)
  const accessToken = validatedData.data.access_token;
  const refreshToken = validatedData.data.refresh_token;

  if (!accessToken || !refreshToken) {
    return {
      success: false,
      error: "Missing access_token or refresh_token in response",
      message: ERROR_INVALID_RESPONSE,
    };
  }

  // Return normalized data structure
  return {
    success: true,
    data: {
      access_token: accessToken,
      refresh_token: refreshToken,
      // Note: Base API doesn't return expires_in, tokens are JWT tokens
      // We can decode JWT to get expiration if needed
    },
  };
}
