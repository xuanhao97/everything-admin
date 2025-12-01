/**
 * Fetch Client Types
 *
 * Purpose: Type definitions for fetch client
 * - Error types and classes
 * - Configuration interfaces
 * - Request/response types
 */

/**
 * Fetch Error Types
 */
export enum FetchErrorType {
  /**
   * Network error (connection failed, timeout, etc.)
   */
  NETWORK = "NETWORK",
  /**
   * HTTP error (4xx, 5xx status codes)
   */
  HTTP = "HTTP",
  /**
   * Timeout error
   */
  TIMEOUT = "TIMEOUT",
  /**
   * Parser error (JSON parsing failed, etc.)
   */
  PARSER = "PARSER",
  /**
   * Unknown error
   */
  UNKNOWN = "UNKNOWN",
}

/**
 * Fetch Error
 *
 * Purpose: Custom error class for fetch client errors
 * - Provides error type classification
 * - Includes request context
 * - Supports error metadata
 */
export class FetchError extends Error {
  /**
   * Error type
   */
  public readonly type: FetchErrorType;

  /**
   * Request URL
   */
  public readonly url: string;

  /**
   * Request method
   */
  public readonly method: string;

  /**
   * HTTP status code (if applicable)
   */
  public readonly status?: number;

  /**
   * Error metadata
   */
  public readonly metadata?: Record<string, unknown>;

  /**
   * Create FetchError instance
   *
   * @param type - Error type
   * @param message - Error message
   * @param options - Error options
   */
  constructor(
    type: FetchErrorType,
    message: string,
    options: {
      url: string;
      method: string;
      status?: number;
      metadata?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = "FetchError";
    this.type = type;
    this.url = options.url;
    this.method = options.method;
    this.status = options.status;
    this.metadata = options.metadata;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
  }
}

/**
 * Parser error options
 */
export interface ParserErrorOptions {
  /**
   * Whether to throw error on parser failure
   * @default true
   */
  throwOnError?: boolean;
  /**
   * Whether to log parser errors
   * @default true
   */
  logErrors?: boolean;
  /**
   * Fallback value when parser fails and throwOnError is false
   */
  fallbackValue?: unknown;
}
