/**
 * Error Handler Utilities
 *
 * Purpose: Handles fetch request errors
 * - Classifies error types
 * - Throws FetchError with appropriate type
 * - Supports parser error configuration
 */

import { createLogger } from "@/lib/loggers";

import { FetchError, FetchErrorType, type ParserErrorOptions } from "./index";

type Logger = ReturnType<typeof createLogger>;

/**
 * Options for handling request error
 */
export interface HandleRequestErrorOptions {
  /**
   * Error object
   */
  error: unknown;
  /**
   * Request URL
   */
  url: string;
  /**
   * Request method
   */
  method: string;
  /**
   * Request timeout
   */
  timeout: number;
  /**
   * Logger instance (optional)
   */
  logger?: Logger | null;
  /**
   * Parser error options (optional)
   */
  parserError?: ParserErrorOptions;
}

/**
 * Handle request error
 *
 * Purpose: Processes and formats request errors
 * - Classifies error types
 * - Throws FetchError with appropriate type
 * - Supports parser error configuration
 *
 * @param options - Error handling options
 * @throws FetchError with appropriate type
 *
 * @example
 * ```ts
 * try {
 *   await fetch(url);
 * } catch (error) {
 *   handleRequestError({
 *     error,
 *     url,
 *     method: "GET",
 *     timeout: 30000,
 *     logger: myLogger
 *   });
 * }
 * ```
 */
export function handleRequestError(options: HandleRequestErrorOptions): never {
  const { error, url, method, timeout, logger, parserError } = options;

  // Helper function to log errors
  const logError = (message: string, data?: Record<string, unknown>): void => {
    if (logger) {
      logger.error(message, data);
    }
  };

  // If already a FetchError, re-throw
  if (error instanceof FetchError) {
    throw error;
  }

  // Handle timeout errors
  if (
    error instanceof Error &&
    (error.message.includes("timeout") ||
      error.message.includes("Request timeout"))
  ) {
    logError("Fetch request timeout", {
      url,
      method,
      timeout,
    });
    throw new FetchError(
      FetchErrorType.TIMEOUT,
      `Request timeout after ${timeout}ms`,
      {
        url,
        method,
        metadata: { timeout },
      }
    );
  }

  // Handle network errors
  if (
    error instanceof Error &&
    (error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch"))
  ) {
    logError("Network error in fetch request", {
      url,
      method,
      error: error.message,
    });
    throw new FetchError(
      FetchErrorType.NETWORK,
      `Network error: ${error.message}`,
      {
        url,
        method,
        metadata: { originalError: error.message },
      }
    );
  }

  // Handle parser errors
  if (
    error instanceof Error &&
    (error.message.includes("parse") ||
      error.message.includes("JSON") ||
      error.message.includes("Invalid response format"))
  ) {
    const parserConfig = parserError;
    const shouldThrow = parserConfig?.throwOnError ?? true;

    if (parserConfig?.logErrors !== false) {
      logError("Parser error in fetch request", {
        url,
        method,
        error: error.message,
      });
    }

    if (shouldThrow) {
      throw new FetchError(
        FetchErrorType.PARSER,
        `Parser error: ${error.message}`,
        {
          url,
          method,
          metadata: { originalError: error.message },
        }
      );
    }

    // Return fallback value if configured
    if (parserConfig?.fallbackValue !== undefined) {
      return parserConfig.fallbackValue as never;
    }

    // Default: throw error even if throwOnError is false
    throw new FetchError(
      FetchErrorType.PARSER,
      `Parser error: ${error.message}`,
      {
        url,
        method,
        metadata: { originalError: error.message },
      }
    );
  }

  // Handle unknown errors
  logError("Unexpected error in fetch request", {
    url,
    method,
    error: error instanceof Error ? error.message : String(error),
  });

  throw new FetchError(
    FetchErrorType.UNKNOWN,
    `Failed to execute request: ${
      error instanceof Error ? error.message : String(error)
    }`,
    {
      url,
      method,
      metadata: {
        originalError: error instanceof Error ? error.message : String(error),
      },
    }
  );
}
