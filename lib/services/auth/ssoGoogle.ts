// Purpose: Service for authenticating with Base API using Google SSO
// - Makes POST request to Base SSO Google endpoint
// - Uses form data with email, Google access token, and __code parameters
// - Returns Base API tokens (access_token, refresh_token) or error information
// - Validates input and output using Zod schemas

import { createLogger } from "@/lib/logger";
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
const ERROR_MISSING_DOMAIN = "BASE_DOMAIN environment variable is not set";
const ERROR_INVALID_RESPONSE = "Response data validation failed";

// Create logger with context
const logger = createLogger("SSO_GOOGLE");

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
    logger.error("Invalid options", {
      errors: validationResult.error.errors,
    });
    return {
      success: false,
      error: `Invalid options: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
    };
  }

  const validatedOptions = validationResult.data;
  const domain = process.env.BASE_DOMAIN;
  const cookie = process.env.BASE_COOKIE;

  if (!domain) {
    logger.error("Missing domain configuration");
    return {
      success: false,
      error: ERROR_MISSING_DOMAIN,
    };
  }

  const url = `${domain}${SSO_GOOGLE_ENDPOINT}`;

  try {
    const formData = new URLSearchParams();
    formData.append("__code", MOBILE_CODE);
    formData.append("sso_email", validatedOptions.email);
    formData.append("sso_access_token", validatedOptions.accessToken);

    const headers: HeadersInit = {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    const cookieValue = validatedOptions.cookie || cookie;
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
      logger.error("SSO Google request failed", {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        message: errorText,
      };
    }

    const data = await response.json();

    // Check if response indicates success (code === 1)
    if (data.code !== 1) {
      logger.error("Base API returned error code", {
        code: data.code,
        message: data.message,
      });
      return {
        success: false,
        error: data.message || `Base API error: code ${data.code}`,
        message: data.message,
      };
    }

    // Validate response data structure
    const validatedData = ssoGoogleDataSchema.safeParse(data);
    if (!validatedData.success) {
      logger.error("Invalid response data", {
        errors: validatedData.error.errors,
      });
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
      logger.error("Missing tokens in response");
      return {
        success: false,
        error: "Missing access_token or refresh_token in response",
        message: ERROR_INVALID_RESPONSE,
      };
    }

    logger.success("SSO Google authentication successful", {
      email: validatedOptions.email,
    });

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
  } catch (error) {
    logger.error("Unexpected error during SSO Google", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
