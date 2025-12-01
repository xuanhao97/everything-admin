/**
 * Fetch Client
 *
 * Purpose: Provides reusable fetch instance for API requests
 * - Handles request/response transformation
 * - Manages error handling and logging
 * - Supports custom headers and configuration
 * - Provides type-safe request/response handling
 * - Supports baseUrl for API endpoints
 */

import { handleRequestError as handleRequestErrorUtil } from "./error-handler";
import { FetchError, FetchErrorType, type ParserErrorOptions } from "./types";
import {
  detectContentType,
  getStreamingResponse,
  parseResponseByContentType,
} from "./utils";

/**
 * Options for fetch request
 */
export interface FetchRequestOptions<TBody = unknown> {
  /**
   * Request URL
   */
  url: string;
  /**
   * HTTP method
   * @default "GET"
   */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * Request body
   * - FormData: Pass through as-is (browser handles Content-Type with boundary)
   * - URLSearchParams: Pass through as-is (can be used directly with fetch)
   * - String: Pass through as-is
   * - Object: Will be JSON stringified
   */
  body?: TBody;
  /**
   * Custom headers to include
   */
  headers?: Record<string, string>;
  /**
   * Timeout in milliseconds
   * @default 60000
   */
  timeout?: number;
  /**
   * Whether to parse response as JSON
   * @default true
   */
  parseJson?: boolean;
  /**
   * Whether to return streaming response
   * @default false
   */
  stream?: boolean;
}

/**
 * Result of fetch request
 */
export interface FetchResult<TResponse = unknown> {
  /**
   * Response data (parsed if parseJson is true)
   */
  data: TResponse;
  /**
   * HTTP status code
   */
  status: number;
  /**
   * Response headers
   */
  headers: Headers;
  /**
   * Raw response object
   */
  response: Response;
}

/**
 * Result of streaming fetch request
 */
export interface FetchStreamResult {
  /**
   * Readable stream from response
   */
  stream: ReadableStream<Uint8Array>;
  /**
   * HTTP status code
   */
  status: number;
  /**
   * Response headers
   */
  headers: Headers;
  /**
   * Raw response object
   */
  response: Response;
}

// Re-export types from types.ts
export { FetchError, FetchErrorType, type ParserErrorOptions } from "./types";

/**
 * Configuration options for FetchClient
 */
export interface FetchClientConfig {
  /**
   * Base URL for all requests
   * - If provided, relative URLs will be resolved against this base
   * - Absolute URLs will be used as-is
   */
  baseUrl?: string;
  /**
   * Default headers for all requests
   */
  defaultHeaders?: Record<string, string>;
  /**
   * Default timeout in milliseconds
   * @default 60000
   */
  defaultTimeout?: number;
  /**
   * Whether to enable logging
   * @default false
   */
  enableLogger?: boolean;
  /**
   * Parser error options
   */
  parserError?: ParserErrorOptions;
}

/**
 * Options for creating default headers
 */
interface CreateDefaultHeadersOptions {
  /**
   * Custom headers to merge
   */
  customHeaders?: Record<string, string>;
  /**
   * Whether to include Content-Type header
   * @default true
   */
  includeContentType?: boolean;
  /**
   * Body type for Content-Type header
   * - "form": application/x-www-form-urlencoded (for URLSearchParams)
   * - "json": application/json (default, for objects/strings)
   * @default "json"
   */
  bodyType?: "json" | "form";
}

/**
 * Options for preparing request
 */
interface PrepareRequestOptions {
  /**
   * Request method
   */
  method: string;
  /**
   * Request body
   */
  body?: unknown;
  /**
   * Custom headers
   */
  customHeaders?: Record<string, string>;
}

/**
 * Options for handling error response
 */
interface HandleErrorResponseOptions {
  /**
   * Fetch response object
   */
  response: Response;
  /**
   * Request URL
   */
  url: string;
  /**
   * Request method
   */
  method: string;
  /**
   * Whether request is streaming
   */
  isStreaming: boolean;
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
   * Request URL
   */
  url: string;
  /**
   * Request method
   */
  method: string;
  /**
   * Whether stream is required
   */
  streamRequired: boolean;
}

/**
 * Options for handling regular response
 */
interface HandleRegularResponseOptions {
  /**
   * Fetch response object
   */
  response: Response;
  /**
   * Request URL
   */
  url: string;
  /**
   * Request method
   */
  method: string;
  /**
   * Whether to parse as JSON
   */
  parseJson: boolean;
}

/**
 * Fetch Client
 *
 * Purpose: Provides fetch client instance for API requests
 * - Manages instance-specific configuration
 * - Handles request/response transformation
 * - Supports logging control
 * - Supports baseUrl for API endpoints
 */
export class FetchClient {
  private config: FetchClientConfig;

  /**
   * Create new FetchClient instance
   *
   * Purpose: Creates a new fetch client with configuration
   * - Each service can create its own instance
   * - Supports baseUrl, headers, timeout, and logging
   *
   * @param config - Client configuration
   *
   * @example
   * ```ts
   * const client = new FetchClient({
   *   baseUrl: "https://api.example.com",
   *   defaultHeaders: { Authorization: "Bearer token" },
   *   enableLogger: true
   * });
   * ```
   */
  constructor(config: FetchClientConfig = {}) {
    this.config = {
      defaultTimeout: 60000,
      enableLogger: false,
      parserError: {
        throwOnError: true,
        logErrors: true,
        ...(config.parserError || {}),
      },
      ...config,
    };

    // Logger removed to avoid circular dependency
  }

  /**
   * Update configuration
   *
   * Purpose: Updates client configuration
   * - Merges with existing config
   *
   * @param config - Configuration to update
   */
  updateConfig(config: Partial<FetchClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log debug message
   * Uses console.log to avoid circular dependency with loggers
   *
   * @param message - Log message
   * @param data - Log data
   */
  private logDebug(message: string, data?: Record<string, unknown>): void {
    if (this.config.enableLogger) {
      console.debug(`[fetch-client] ${message}`, data || {});
    }
  }

  /**
   * Log error message
   * Uses console.error to avoid circular dependency with loggers
   *
   * @param message - Log message
   * @param data - Log data
   */
  private logError(message: string, data?: Record<string, unknown>): void {
    if (this.config.enableLogger) {
      console.error(`[fetch-client] ${message}`, data || {});
    }
  }

  /**
   * Log warning message
   * Uses console.warn to avoid circular dependency with loggers
   *
   * @param message - Log message
   * @param data - Log data
   */
  private logWarn(message: string, data?: Record<string, unknown>): void {
    if (this.config.enableLogger) {
      console.warn(`[fetch-client] ${message}`, data || {});
    }
  }

  /**
   * Create default headers for fetch request
   *
   * Purpose: Provides standard headers for API requests
   * - Sets Content-Type based on body type if needed
   * - Merges custom headers and default headers
   *
   * @param options - Header creation options
   * @returns Headers object
   */
  private createDefaultHeaders(
    options: CreateDefaultHeadersOptions = {}
  ): Record<string, string> {
    const {
      customHeaders = {},
      includeContentType = true,
      bodyType = "json",
    } = options;

    const headers: Record<string, string> = {};

    // Only set Content-Type if not already provided in customHeaders
    if (includeContentType && !customHeaders["Content-Type"]) {
      if (bodyType === "form") {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        headers["Content-Type"] = "application/json";
      }
    }

    return {
      ...headers,
      ...(this.config.defaultHeaders || {}),
      ...customHeaders,
    };
  }

  /**
   * Prepare request headers
   *
   * Purpose: Combines default and custom headers
   * - Skips Content-Type for FormData (browser sets it with boundary)
   * - Sets Content-Type: application/x-www-form-urlencoded for URLSearchParams
   * - Sets Content-Type: application/json for other body types
   *
   * @param options - Request preparation options
   * @returns Prepared headers
   */
  private prepareRequestHeaders(
    options: PrepareRequestOptions
  ): Record<string, string> {
    const { method, body, customHeaders = {} } = options;

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (body instanceof FormData) {
      return this.createDefaultHeaders({
        customHeaders,
        includeContentType: false,
      });
    }

    // Determine body type for Content-Type
    const shouldIncludeContentType = method !== "GET" && body !== undefined;
    const bodyType = body instanceof URLSearchParams ? "form" : "json";

    return this.createDefaultHeaders({
      customHeaders,
      includeContentType: shouldIncludeContentType,
      bodyType,
    });
  }

  /**
   * Prepare request body
   *
   * Purpose: Converts body to appropriate format
   * - FormData: Pass through as-is (browser handles Content-Type with boundary)
   * - URLSearchParams: Pass through as-is or convert to string
   * - String: Pass through as-is
   * - Object: JSON stringify
   *
   * @param body - Request body
   * @returns Prepared body (string, FormData, URLSearchParams, or undefined)
   */
  private prepareRequestBody(
    body?: unknown
  ): string | FormData | URLSearchParams | undefined {
    if (body === undefined) {
      return undefined;
    }

    // FormData: pass through as-is (browser will set Content-Type with boundary)
    if (body instanceof FormData) {
      return body;
    }

    // URLSearchParams: pass through as-is (can be used directly with fetch)
    if (body instanceof URLSearchParams) {
      return body;
    }

    // String: pass through as-is
    if (typeof body === "string") {
      return body;
    }

    // Object: JSON stringify
    return JSON.stringify(body);
  }

  /**
   * Resolve URL with baseUrl
   *
   * Purpose: Resolves relative URLs against baseUrl
   * - If URL is absolute, returns as-is
   * - If URL is relative and baseUrl exists, combines them
   * - Handles trailing slashes correctly
   *
   * @param url - Request URL (relative or absolute)
   * @returns Resolved absolute URL
   */
  private resolveUrl(url: string): string {
    // If URL is absolute (starts with http:// or https://), return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // If no baseUrl, return URL as-is
    if (!this.config.baseUrl) {
      return url;
    }

    // Remove trailing slash from baseUrl
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");

    // Remove leading slash from url
    const path = url.startsWith("/") ? url.slice(1) : url;

    // Combine baseUrl and path
    return `${baseUrl}/${path}`;
  }

  /**
   * Create timeout promise
   *
   * Purpose: Creates a timeout promise that rejects after specified time
   *
   * @param timeout - Timeout in milliseconds
   * @returns Promise that rejects after timeout
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Execute fetch with timeout
   *
   * Purpose: Executes fetch request with timeout handling
   *
   * @param url - Request URL
   * @param options - Fetch options
   * @param timeout - Timeout in milliseconds
   * @returns Promise resolving to Response
   */
  private async executeFetch(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const fetchPromise = fetch(url, options);

    return Promise.race([
      fetchPromise,
      this.createTimeoutPromise(timeout),
    ]) as Promise<Response>;
  }

  /**
   * Extract error text from response
   *
   * Purpose: Safely extracts error message from response
   *
   * @param response - Fetch response object
   * @param isStreaming - Whether response is streaming
   * @returns Error text
   */
  private async extractErrorText(
    response: Response,
    isStreaming: boolean
  ): Promise<string> {
    try {
      if (isStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let errorChunk = "";

        try {
          const { value } = await reader.read();
          if (value) {
            errorChunk = decoder.decode(value, { stream: true });
          }
          reader.releaseLock();
        } catch {
          // Ignore stream read errors
        }

        return errorChunk || "Unknown error";
      }

      return await response.text();
    } catch {
      return "Unknown error";
    }
  }

  /**
   * Handle error response
   *
   * Purpose: Processes and throws error for failed responses
   *
   * @param options - Error handling options
   * @throws FetchError with formatted message
   */
  private async handleErrorResponse(
    options: HandleErrorResponseOptions
  ): Promise<never> {
    const { response, url, method, isStreaming } = options;

    const errorText = await this.extractErrorText(response, isStreaming);

    this.logError("Fetch request failed", {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      error: errorText.substring(0, 200),
    });

    throw new FetchError(
      FetchErrorType.HTTP,
      `Request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 100)}` : ""}`,
      {
        url,
        method,
        status: response.status,
        metadata: {
          statusText: response.statusText,
          errorText: errorText.substring(0, 200),
        },
      }
    );
  }

  /**
   * Handle streaming response
   *
   * Purpose: Processes streaming response and returns stream result
   *
   * @param options - Streaming response options
   * @returns FetchStreamResult
   * @throws Error if stream is invalid
   */
  private handleStreamingResponse(
    options: HandleStreamingResponseOptions
  ): FetchStreamResult {
    const { response, url, method, streamRequired } = options;

    const streamBody = getStreamingResponse({
      response,
      validateStream: streamRequired,
    });

    if (!streamBody) {
      throw new Error("Response body is null, cannot create stream");
    }

    this.logDebug("Fetch request successful (streaming)", {
      url,
      method,
      status: response.status,
      contentType: detectContentType({ headers: response.headers }),
    });

    return {
      stream: streamBody,
      status: response.status,
      headers: response.headers,
      response,
    };
  }

  /**
   * Handle regular response
   *
   * Purpose: Processes regular response and returns parsed data
   * - Handles parser errors based on parserError config
   *
   * @param options - Regular response options
   * @returns Promise resolving to FetchResult
   * @throws FetchError if parser error occurs and throwOnError is true
   */
  private async handleRegularResponse<TResponse = unknown>(
    options: HandleRegularResponseOptions
  ): Promise<FetchResult<TResponse>> {
    const { response, url, method, parseJson } = options;

    try {
      const data = (await parseResponseByContentType({
        response,
        forceJson: parseJson === true,
        forceText: parseJson === false,
      })) as TResponse;

      this.logDebug("Fetch request successful", {
        url,
        method,
        status: response.status,
        contentType: detectContentType({ headers: response.headers }),
      });

      return {
        data,
        status: response.status,
        headers: response.headers,
        response,
      };
    } catch (error) {
      // Handle parser errors
      const parserConfig = this.config.parserError;
      const shouldThrow = parserConfig?.throwOnError ?? true;

      if (parserConfig?.logErrors !== false) {
        this.logError("Parser error in response", {
          url,
          method,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (shouldThrow) {
        throw new FetchError(
          FetchErrorType.PARSER,
          `Failed to parse response: ${
            error instanceof Error ? error.message : String(error)
          }`,
          {
            url,
            method,
            status: response.status,
            metadata: {
              originalError:
                error instanceof Error ? error.message : String(error),
              contentType: detectContentType({ headers: response.headers }),
            },
          }
        );
      }

      // Return fallback value if configured
      const fallbackData =
        parserConfig?.fallbackValue !== undefined
          ? (parserConfig.fallbackValue as TResponse)
          : (null as TResponse);

      this.logWarn("Using fallback value due to parser error", {
        url,
        method,
      });

      return {
        data: fallbackData,
        status: response.status,
        headers: response.headers,
        response,
      };
    }
  }

  /**
   * Execute fetch request with error handling
   *
   * Purpose: Main method for executing fetch requests
   * - Handles request transformation
   * - Manages response parsing
   * - Includes timeout support
   * - Supports streaming responses
   * - Provides comprehensive error handling
   *
   * @param options - Fetch request options
   * @returns Promise resolving to fetch result or stream result
   * @throws Error if request fails or response is invalid
   *
   * @example
   * ```ts
   * const client = FetchClient.getInstance();
   * const result = await client.request({
   *   url: "/data",
   *   method: "POST",
   *   body: { key: "value" }
   * });
   * ```
   */
  // Overload for streaming requests
  async request<TResponse = unknown>(
    options: FetchRequestOptions<TResponse> & { stream: true }
  ): Promise<FetchStreamResult>;
  // Overload for non-streaming requests with FormData body
  async request<TResponse = unknown>(
    options: Omit<FetchRequestOptions<never>, "body"> & {
      body: FormData;
      stream?: false;
    } & { responseType?: TResponse }
  ): Promise<FetchResult<TResponse>>;
  // Overload for non-streaming requests with URLSearchParams body
  async request<TResponse = unknown>(
    options: Omit<FetchRequestOptions<never>, "body"> & {
      body: URLSearchParams;
      stream?: false;
    } & { responseType?: TResponse }
  ): Promise<FetchResult<TResponse>>;
  // Overload for non-streaming requests
  async request<TResponse = unknown>(
    options: FetchRequestOptions<TResponse> & { stream?: false }
  ): Promise<FetchResult<TResponse>>;
  // Overload for requests without stream option (defaults to false)
  async request<TResponse = unknown>(
    options: Omit<FetchRequestOptions<TResponse>, "stream">
  ): Promise<FetchResult<TResponse>>;
  // Implementation
  async request<TResponse = unknown>(
    options: FetchRequestOptions<TResponse> & { responseType?: TResponse }
  ): Promise<FetchResult<TResponse> | FetchStreamResult> {
    const {
      url,
      method = "GET",
      body,
      headers: customHeaders = {},
      timeout = this.config.defaultTimeout || 60000,
      parseJson = true,
      stream = false,
    } = options;

    const resolvedUrl = this.resolveUrl(url);

    const headers = this.prepareRequestHeaders({
      method,
      body,
      customHeaders,
    });

    const requestBody = this.prepareRequestBody(body);

    try {
      this.logDebug("Sending fetch request", {
        url: resolvedUrl,
        method,
        hasBody: body !== undefined,
      });

      const response = await this.executeFetch(
        resolvedUrl,
        {
          method,
          headers,
          ...(requestBody ? { body: requestBody } : {}),
        },
        timeout
      );

      if (!response.ok) {
        await this.handleErrorResponse({
          response,
          url,
          method,
          isStreaming: stream,
        });
      }

      // Handle streaming response
      // Only stream if explicitly requested via stream: true option
      // Don't auto-detect streaming for regular API responses
      if (stream) {
        return this.handleStreamingResponse({
          response,
          url,
          method,
          streamRequired: true,
        });
      }

      // Handle regular response
      return await this.handleRegularResponse({
        response,
        url,
        method,
        parseJson,
      });
    } catch (error) {
      handleRequestErrorUtil({
        error,
        url,
        method,
        timeout,
        logger: this.config.enableLogger
          ? ({
              error: (msg: string, data?: Record<string, unknown>) => {
                console.error(`[fetch-client] ${msg}`, data || {});
              },
            } as {
              error: (msg: string, data?: Record<string, unknown>) => void;
            })
          : null,
        parserError: this.config.parserError,
      });
    }
  }
}

/**
 * Create a fetch client instance with default configuration
 *
 * Purpose: Provides a configured fetch client with default settings
 * - Creates new instance with default options
 * - Useful for creating API-specific clients
 *
 * @param config - Client configuration
 * @returns New FetchClient instance
 *
 * @example
 * ```ts
 * const client = createFetchClient({
 *   baseUrl: "https://api.example.com",
 *   headers: { Authorization: "Bearer token" },
 *   timeout: 10000
 * });
 *
 * const result = await client.request({
 *   url: "/data",
 *   method: "POST",
 *   body: { key: "value" }
 * });
 * ```
 */
export function createFetchClient(config: FetchClientConfig = {}): FetchClient {
  return new FetchClient(config);
}
