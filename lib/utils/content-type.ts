/**
 * Content Type Utilities
 *
 * Purpose: Handles content type detection and response parsing
 * - Detects content type from headers
 * - Parses JSON responses
 * - Parses text responses
 * - Handles streaming content types
 */

import { createLogger } from "@/lib/loggers";

const logger = createLogger({ service: "content-type-utils" });

/**
 * Content type constants
 */
export const CONTENT_TYPES = {
  JSON: "application/json",
  TEXT: "text/plain",
  HTML: "text/html",
  XML: "application/xml",
  STREAM: "text/event-stream",
  OCTET_STREAM: "application/octet-stream",
} as const;

/**
 * Options for detecting content type
 */
interface DetectContentTypeOptions {
  /**
   * Content-Type header value
   */
  contentType?: string | null;
  /**
   * Response headers
   */
  headers?: Headers;
}

/**
 * Detect content type from response headers
 *
 * Purpose: Extracts and normalizes content type from headers
 * - Checks Content-Type header
 * - Handles charset and other parameters
 * - Returns normalized content type string
 *
 * @param options - Content type detection options
 * @returns Content type string or empty string
 *
 * @example
 * ```ts
 * const contentType = detectContentType({
 *   headers: response.headers
 * });
 * ```
 */
export function detectContentType(options: DetectContentTypeOptions): string {
  const { contentType, headers } = options;

  let type = contentType;

  if (!type && headers) {
    type = headers.get("content-type");
  }

  if (!type) {
    return "";
  }

  // Remove charset and other parameters (e.g., "application/json; charset=utf-8" -> "application/json")
  return type.split(";")[0]?.trim().toLowerCase() || "";
}

/**
 * Check if content type is JSON
 *
 * Purpose: Determines if response should be parsed as JSON
 * - Checks for application/json
 * - Checks for JSON-like content types
 *
 * @param contentType - Content type string
 * @returns True if content type is JSON
 */
export function isJsonContentType(contentType: string): boolean {
  return (
    contentType.includes(CONTENT_TYPES.JSON) || contentType.endsWith("+json")
  );
}

/**
 * Check if content type is text
 *
 * Purpose: Determines if response should be parsed as text
 * - Checks for text/* content types
 * - Excludes streaming types
 *
 * @param contentType - Content type string
 * @returns True if content type is text
 */
export function isTextContentType(contentType: string): boolean {
  return (
    contentType.startsWith("text/") && !isStreamingContentType(contentType)
  );
}

/**
 * Check if content type is streaming
 *
 * Purpose: Determines if response is a streaming type
 * - Checks for text/event-stream
 * - Checks for streaming indicators
 *
 * @param contentType - Content type string
 * @returns True if content type is streaming
 */
export function isStreamingContentType(contentType: string): boolean {
  return (
    contentType.includes(CONTENT_TYPES.STREAM) ||
    contentType.includes("stream") ||
    contentType.includes("chunked")
  );
}

/**
 * Options for parsing JSON response
 */
interface ParseJsonResponseOptions {
  /**
   * Fetch response object
   */
  response: Response;
  /**
   * Whether to log errors
   * @default true
   */
  logErrors?: boolean;
}

/**
 * Parse response as JSON
 *
 * Purpose: Safely parses JSON response with error handling
 * - Attempts JSON parsing
 * - Falls back to text if parsing fails
 * - Logs errors for debugging
 *
 * @param options - Parse JSON options
 * @returns Parsed JSON data or text fallback
 *
 * @example
 * ```ts
 * const data = await parseJsonResponse({
 *   response: fetchResponse
 * });
 * ```
 */
export async function parseJsonResponse(
  options: ParseJsonResponseOptions
): Promise<unknown> {
  const { response, logErrors = true } = options;

  try {
    const text = await response.text();
    if (!text.trim()) {
      if (logErrors) {
        logger.debug("Empty JSON response body", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        });
      }
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    if (logErrors) {
      logger.warn("Failed to parse JSON response", {
        error: error instanceof Error ? error.message : String(error),
        contentType: response.headers.get("content-type"),
        status: response.status,
      });
    }
    throw new Error(
      `Failed to parse JSON response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Options for parsing text response
 */
interface ParseTextResponseOptions {
  /**
   * Fetch response object
   */
  response: Response;
  /**
   * Whether to log errors
   * @default true
   */
  logErrors?: boolean;
}

/**
 * Parse response as text
 *
 * Purpose: Safely parses text response
 * - Reads response as text
 * - Handles encoding automatically
 * - Logs errors for debugging
 *
 * @param options - Parse text options
 * @returns Text content
 *
 * @example
 * ```ts
 * const text = await parseTextResponse({
 *   response: fetchResponse
 * });
 * ```
 */
export async function parseTextResponse(
  options: ParseTextResponseOptions
): Promise<string> {
  const { response, logErrors = true } = options;

  try {
    return await response.text();
  } catch (error) {
    if (logErrors) {
      logger.error("Failed to parse text response", {
        error: error instanceof Error ? error.message : String(error),
        contentType: response.headers.get("content-type"),
      });
    }
    throw new Error(
      `Failed to parse text response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Options for parsing response based on content type
 */
interface ParseResponseByContentTypeOptions {
  /**
   * Fetch response object
   */
  response: Response;
  /**
   * Whether to force JSON parsing
   * @default false
   */
  forceJson?: boolean;
  /**
   * Whether to force text parsing
   * @default false
   */
  forceText?: boolean;
  /**
   * Whether to log errors
   * @default true
   */
  logErrors?: boolean;
}

/**
 * Parse response based on content type
 *
 * Purpose: Automatically parses response based on content type
 * - Detects content type from headers
 * - Parses JSON for JSON content types
 * - Parses text for text content types
 * - Falls back to text if content type is unknown
 *
 * @param options - Parse response options
 * @returns Parsed response data
 *
 * @example
 * ```ts
 * const data = await parseResponseByContentType({
 *   response: fetchResponse
 * });
 * ```
 */
export async function parseResponseByContentType(
  options: ParseResponseByContentTypeOptions
): Promise<unknown> {
  const {
    response,
    forceJson = false,
    forceText = false,
    logErrors = true,
  } = options;

  const contentType = detectContentType({
    headers: response.headers,
  });

  // Force JSON parsing
  if (forceJson) {
    return parseJsonResponse({ response, logErrors });
  }

  // Force text parsing
  if (forceText) {
    return parseTextResponse({ response, logErrors });
  }

  // Auto-detect based on content type
  if (isJsonContentType(contentType)) {
    try {
      return await parseJsonResponse({ response, logErrors });
    } catch (error) {
      // Fallback to text if JSON parsing fails
      if (logErrors) {
        logger.warn("JSON parsing failed, falling back to text", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return parseTextResponse({ response, logErrors: false });
    }
  }

  if (isTextContentType(contentType)) {
    return parseTextResponse({ response, logErrors });
  }

  // Default to text for unknown content types
  return parseTextResponse({ response, logErrors: false });
}

/**
 * Options for handling streaming response
 */
interface HandleStreamingResponseOptions {
  /**
   * Fetch response object
   */
  response: Response;
  /**
   * Whether to validate stream exists
   * @default true
   */
  validateStream?: boolean;
}

/**
 * Get streaming response body
 *
 * Purpose: Safely extracts streaming body from response
 * - Validates response body exists
 * - Returns ReadableStream for streaming
 * - Handles errors gracefully
 *
 * @param options - Streaming response options
 * @returns ReadableStream or null
 * @throws Error if stream validation fails
 *
 * @example
 * ```ts
 * const stream = getStreamingResponse({
 *   response: fetchResponse
 * });
 * if (stream) {
 *   const reader = stream.getReader();
 * }
 * ```
 */
export function getStreamingResponse(
  options: HandleStreamingResponseOptions
): ReadableStream<Uint8Array> | null {
  const { response, validateStream = true } = options;

  if (!response.body) {
    if (validateStream) {
      throw new Error("Response body is null, cannot create stream");
    }
    return null;
  }

  return response.body;
}

/**
 * Check if response should be handled as stream
 *
 * Purpose: Determines if response should be streamed
 * - Checks content type for streaming indicators
 * - Checks Transfer-Encoding header
 *
 * @param response - Fetch response object
 * @returns True if response should be streamed
 */
export function shouldStreamResponse(response: Response): boolean {
  const contentType = detectContentType({
    headers: response.headers,
  });

  const transferEncoding = response.headers.get("transfer-encoding");

  return (
    isStreamingContentType(contentType) ||
    transferEncoding?.toLowerCase().includes("chunked") === true
  );
}
