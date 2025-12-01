// Purpose: Service for fetching timeoff list from Base API
// - Makes GET request to Base timeoff list endpoint
// - Uses Authorization Bearer token from session or environment
// - Returns timeoff list data or error information
// - Validates input and output using Zod schemas

import { createLogger } from "@/lib/logger";
import {
  getTimeoffListOptionsSchema,
  timeoffListDataSchema,
  type GetTimeoffListOptions,
  type TimeoffListResponse,
} from "@/lib/schemas/timeoff";
import {
  getBaseAccessToken,
  getBaseCookie,
} from "@/lib/utils/base-api";

// API endpoint path for timeoff list
const TIMEOFF_LIST_ENDPOINT = "/ajax/api/mobile/timeoff/list";

// HTTP headers constants
const USER_AGENT = "Base/3 CFNetwork/3860.200.71 Darwin/25.1.0";
const ACCEPT_HEADER = "application/json, text/plain, */*";
const ACCEPT_LANGUAGE = "en-GB,en-US;q=0.9,en;q=0.8";

// Error messages
const ERROR_MISSING_DOMAIN = "BASE_DOMAIN environment variable is not set";
const ERROR_MISSING_TOKEN = "Access token is not provided";
const ERROR_INVALID_RESPONSE = "Response data validation failed";

// Create logger with context
const logger = createLogger("TIMEOFF");

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
      logger.error("Invalid options", {
        errors: validationResult.error.errors,
      });
      return {
        success: false,
        error: `Invalid options: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
      };
    }
    validatedOptions = validationResult.data;
  }

  // Get domain from env, replace account.base.vn with timeoff.base.vn if needed
  const baseDomain = process.env.BASE_DOMAIN;
  if (!baseDomain) {
    logger.error("Missing domain configuration");
    return {
      success: false,
      error: ERROR_MISSING_DOMAIN,
    };
  }

  // Convert account.base.vn to timeoff.base.vn
  const domain = baseDomain.replace("account.base.vn", "timeoff.base.vn");

  // Get access token from options, session, or environment variable (in that order)
  const sessionAccessToken = await getBaseAccessToken();
  const accessTokenValue = validatedOptions?.accessToken || sessionAccessToken;

  if (!accessTokenValue) {
    logger.error("Missing access token", {
      hasOptionsToken: !!validatedOptions?.accessToken,
      hasSessionToken: !!sessionAccessToken,
      hasEnvToken: !!process.env.BASE_ACCESS_TOKEN,
    });
    return {
      success: false,
      error: ERROR_MISSING_TOKEN,
    };
  }

  // Get cookie from options, session, or environment variable (in that order)
  const sessionCookie = getBaseCookie();
  const cookie = validatedOptions?.cookie || sessionCookie;

  const url = `${domain}${TIMEOFF_LIST_ENDPOINT}`;

  try {
    const headers: HeadersInit = {
      Accept: ACCEPT_HEADER,
      "User-Agent": USER_AGENT,
      "Accept-Language": ACCEPT_LANGUAGE,
      Authorization: `Bearer ${accessTokenValue}`,
      "Cache-Control": "no-cache",
    };

    if (cookie) {
      headers.Cookie = cookie;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Request failed", {
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
    const validatedData = timeoffListDataSchema.safeParse(data);
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

    logger.success("Timeoff list fetched successfully", {
      itemCount: validatedData.data.timeoffs?.length || 0,
    });

    return {
      success: true,
      data: validatedData.data,
    };
  } catch (error) {
    logger.error("Unexpected error", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
