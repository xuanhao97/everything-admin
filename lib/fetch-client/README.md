# Fetch Client Library

A reusable, type-safe fetch client for API requests with comprehensive error handling, streaming support, automatic content-type detection, and configurable options.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [File Structure](#file-structure)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Request Body Types](#request-body-types)
- [Response Handling](#response-handling)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Examples](#examples)
- [Type Definitions](#type-definitions)

## Overview

The Fetch Client library provides a robust, configurable HTTP client built on top of the native `fetch` API. It supports:

- Base URL configuration for API endpoints
- Automatic request/response transformation
- Automatic Content-Type header handling
- Streaming response support
- Comprehensive error handling with typed errors
- Configurable parser error handling with fallback values
- Optional logging
- Timeout support
- Content-type detection and automatic parsing

## Features

- **Type-safe**: Full TypeScript support with generics
- **Base URL Support**: Configure base URL for relative endpoint paths
- **Automatic Content-Type**: Automatically sets Content-Type headers based on body type
- **Content-Type Detection**: Automatically detects and parses responses based on Content-Type headers
- **Streaming**: Support for streaming responses
- **Error Classification**: Typed errors with classification (Network, HTTP, Timeout, Parser, Unknown)
- **Parser Error Handling**: Configurable parser error handling with fallback values
- **Logging Control**: Optional logging with enable/disable
- **Timeout Support**: Configurable request timeouts (default: 60s)
- **Multiple Body Types**: Supports JSON objects, FormData, URLSearchParams, and strings

## File Structure

```
fetch-client/
├── index.ts           # Main FetchClient class and exports
├── error-handler.ts   # Error handling utilities
├── types.ts           # Type definitions (FetchError, FetchErrorType, etc.)
├── utils.ts           # Content-type detection and response parsing utilities
└── README.md          # This file
```

## Installation

This is an internal library. Import from `@/lib/fetch-client`:

```ts
import {
  createFetchClient,
  FetchError,
  FetchErrorType,
} from "@/lib/fetch-client";
```

## Basic Usage

### Create Client Instance

```ts
import { createFetchClient } from "@/lib/fetch-client";

// Create client with base URL
const client = createFetchClient({
  baseUrl: "https://api.example.com",
  defaultHeaders: {
    Authorization: "Bearer token",
  },
  defaultTimeout: 30000,
  enableLogger: true,
});
```

### Make Requests

```ts
// GET request
const result = await client.request({
  url: "/users",
  method: "GET",
});

console.log(result.data); // Response data (automatically parsed)
console.log(result.status); // HTTP status code
console.log(result.headers); // Response headers
console.log(result.response); // Raw Response object
```

```ts
// POST request with JSON body
// Content-Type: application/json is set automatically
const result = await client.request<{ id: string; name: string }>({
  url: "/users",
  method: "POST",
  body: { name: "John" },
});

console.log(result.data.id); // Type-safe access
```

```ts
// POST request with form data (URLSearchParams)
// Content-Type: application/x-www-form-urlencoded is set automatically
const formData = new URLSearchParams();
formData.append("email", "user@example.com");
formData.append("token", "abc123");

const result = await client.request({
  url: "/auth/login",
  method: "POST",
  body: formData, // URLSearchParams is supported
  // No need to set Content-Type header manually
});
```

```ts
// POST request with FormData (multipart/form-data)
// Content-Type is NOT set automatically - browser sets it with boundary
const formData = new FormData();
formData.append("file", fileBlob);
formData.append("name", "document.pdf");

const result = await client.request({
  url: "/upload",
  method: "POST",
  body: formData, // FormData is supported
  // Browser automatically sets Content-Type: multipart/form-data; boundary=...
});
```

```ts
// POST request with string body
const result = await client.request({
  url: "/endpoint",
  method: "POST",
  body: "raw string data",
  headers: {
    "Content-Type": "text/plain", // You may want to set this manually
  },
});
```

```ts
// Streaming request
const streamResult = await client.request({
  url: "/stream",
  stream: true,
});

const reader = streamResult.stream.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  console.log(chunk);
}
```

### Using Relative URLs with Base URL

```ts
const client = createFetchClient({
  baseUrl: "https://api.example.com/v1",
});

// URL will be resolved to: https://api.example.com/v1/users
const result = await client.request({
  url: "/users", // Relative URL
  method: "GET",
});

// Absolute URLs are used as-is
const result2 = await client.request({
  url: "https://other-api.com/data", // Absolute URL
  method: "GET",
});
```

## Request Body Types

The fetch client automatically handles different body types:

| Body Type         | Content-Type Header                     | Behavior                       |
| ----------------- | --------------------------------------- | ------------------------------ |
| `Object`          | `application/json`                      | Automatically JSON stringified |
| `URLSearchParams` | `application/x-www-form-urlencoded`     | Passed through as-is           |
| `FormData`        | Not set (browser handles with boundary) | Passed through as-is           |
| `string`          | Not set automatically                   | Passed through as-is           |
| `undefined`       | Not set                                 | No body sent                   |

**Note**: You can override Content-Type by providing it in the `headers` option.

## Response Handling

### Automatic Content-Type Detection

The client automatically detects the response Content-Type and parses accordingly:

- `application/json` or `*/*+json` → Parsed as JSON
- `text/*` (non-streaming) → Parsed as text
- Unknown types → Parsed as text (fallback)

```ts
// Response is automatically parsed based on Content-Type
const result = await client.request({
  url: "/api/data",
  method: "GET",
  // parseJson defaults to true
});

// If response is JSON, result.data is the parsed object
// If response is text, result.data is the string
```

### Manual Parsing Control

```ts
// Force JSON parsing
const result = await client.request({
  url: "/api/data",
  method: "GET",
  parseJson: true, // Explicitly parse as JSON
});

// Force text parsing
const result = await client.request({
  url: "/api/data",
  method: "GET",
  parseJson: false, // Parse as text instead
});
```

### Response Structure

All non-streaming responses return a `FetchResult<TResponse>`:

```ts
interface FetchResult<TResponse> {
  data: TResponse; // Parsed response data
  status: number; // HTTP status code
  headers: Headers; // Response headers
  response: Response; // Raw Response object
}
```

Streaming responses return a `FetchStreamResult`:

```ts
interface FetchStreamResult {
  stream: ReadableStream<Uint8Array>; // Readable stream
  status: number; // HTTP status code
  headers: Headers; // Response headers
  response: Response; // Raw Response object
}
```

## API Reference

### `createFetchClient(config?: FetchClientConfig): FetchClient`

Creates a new FetchClient instance with configuration.

**Parameters:**

- `config.baseUrl` (optional): Base URL for all requests
- `config.defaultHeaders` (optional): Default headers for all requests
- `config.defaultTimeout` (optional): Default timeout in milliseconds (default: 60000)
- `config.enableLogger` (optional): Enable logging (default: false)
- `config.parserError` (optional): Parser error configuration

**Returns:** `FetchClient` instance

### `FetchClient.request<TResponse>(options): Promise<FetchResult<TResponse> | FetchStreamResult>`

Executes a fetch request with automatic content-type handling and error management.

**Parameters:**

- `options.url` (required): Request URL (relative or absolute)
  - Relative URLs are resolved against `baseUrl` if configured
  - Absolute URLs (starting with `http://` or `https://`) are used as-is
- `options.method` (optional): HTTP method - `"GET" | "POST" | "PUT" | "PATCH" | "DELETE"` (default: `"GET"`)
- `options.body` (optional): Request body
  - `Object`: Automatically JSON stringified with `Content-Type: application/json`
  - `FormData`: Passed through as-is (browser sets `Content-Type` with boundary)
  - `URLSearchParams`: Passed through as-is with `Content-Type: application/x-www-form-urlencoded`
  - `string`: Passed through as-is (no automatic Content-Type)
  - `undefined`: No body sent
- `options.headers` (optional): Custom headers to merge with default headers
  - Custom headers override default headers
  - Content-Type can be overridden if needed
- `options.timeout` (optional): Request timeout in milliseconds (default: uses `defaultTimeout` from config, or 60000)
- `options.parseJson` (optional): Parse response as JSON (default: `true`)
  - `true`: Parse as JSON (or based on Content-Type)
  - `false`: Parse as text
- `options.stream` (optional): Return streaming response (default: `false`)
  - `true`: Returns `FetchStreamResult` with readable stream
  - `false`: Returns `FetchResult` with parsed data

**Returns:**

- `Promise<FetchResult<TResponse>>` for non-streaming requests
- `Promise<FetchStreamResult>` for streaming requests (`stream: true`)

**Throws:** `FetchError` if request fails or response is invalid

### `FetchClient.updateConfig(config: Partial<FetchClientConfig>): void`

Updates the client configuration by merging with existing config.

**Parameters:**

- `config`: Partial configuration to update
  - Only provided properties are updated
  - Existing properties are preserved

**Example:**

```ts
const client = createFetchClient({ baseUrl: "https://api.example.com" });

// Update timeout and enable logging
client.updateConfig({
  defaultTimeout: 10000,
  enableLogger: true,
});
```

### `FetchError`

Custom error class for fetch client errors.

**Properties:**

- `type`: `FetchErrorType` - Error type classification
- `url`: string - Request URL
- `method`: string - Request method
- `status`: number (optional) - HTTP status code
- `metadata`: Record<string, unknown> (optional) - Error metadata

### `FetchErrorType`

Enum of error types:

- `NETWORK`: Network errors (connection failed, etc.)
- `HTTP`: HTTP errors (4xx, 5xx status codes)
- `TIMEOUT`: Timeout errors
- `PARSER`: Parser errors (JSON parsing failed, etc.)
- `UNKNOWN`: Unknown errors

## Error Handling

### Catching Errors

```ts
try {
  const result = await client.request({ url: "/api/data" });
} catch (error) {
  if (error instanceof FetchError) {
    switch (error.type) {
      case FetchErrorType.NETWORK:
        // Handle network error
        console.error("Network error:", error.message);
        break;
      case FetchErrorType.HTTP:
        // Handle HTTP error
        console.error("HTTP error:", error.status, error.message);
        break;
      case FetchErrorType.TIMEOUT:
        // Handle timeout
        console.error("Request timeout");
        break;
      case FetchErrorType.PARSER:
        // Handle parser error
        console.error("Parser error:", error.message);
        break;
    }
  }
}
```

### Parser Error Configuration

```ts
const client = createFetchClient({
  parserError: {
    throwOnError: false, // Don't throw on parser errors
    logErrors: true, // Log parser errors
    fallbackValue: null, // Return null if parser fails
  },
});

// If JSON parsing fails, returns { data: null, ... } instead of throwing
const result = await client.request({ url: "/api/data" });
```

### Error Metadata

All `FetchError` instances include metadata for debugging:

```ts
try {
  const result = await client.request({ url: "/api/data" });
} catch (error) {
  if (error instanceof FetchError) {
    console.error("Error type:", error.type);
    console.error("Request URL:", error.url);
    console.error("Request method:", error.method);
    console.error("HTTP status:", error.status); // Only for HTTP errors
    console.error("Metadata:", error.metadata); // Additional error details

    // Example metadata structure:
    // {
    //   statusText: "Not Found",
    //   errorText: "Resource not found",
    //   originalError: "...",
    //   contentType: "application/json",
    //   timeout: 30000
    // }
  }
}
```

### HTTP Error Details

HTTP errors include response details in metadata:

```ts
try {
  const result = await client.request({ url: "/api/data" });
} catch (error) {
  if (error instanceof FetchError && error.type === FetchErrorType.HTTP) {
    console.error("Status:", error.status);
    console.error("Status text:", error.metadata?.statusText);
    console.error("Error response:", error.metadata?.errorText);

    // Handle specific status codes
    if (error.status === 401) {
      // Handle unauthorized
    } else if (error.status === 404) {
      // Handle not found
    } else if (error.status >= 500) {
      // Handle server error
    }
  }
}
```

## Configuration

### Full Configuration Example

```ts
const client = createFetchClient({
  baseUrl: "https://api.example.com/v1",
  defaultHeaders: {
    "Content-Type": "application/json",
    Authorization: "Bearer token",
  },
  defaultTimeout: 30000,
  enableLogger: true,
  parserError: {
    throwOnError: true,
    logErrors: true,
  },
});
```

### Update Configuration

```ts
const client = createFetchClient();

// Update config after creation
client.updateConfig({
  enableLogger: true,
  defaultTimeout: 10000,
});
```

## Examples

### Basic Usage

```ts
import { createFetchClient } from "@/lib/fetch-client";

// Create client
const client = createFetchClient({
  baseUrl: "https://api.example.com",
  defaultHeaders: {
    Authorization: "Bearer token",
  },
});

// GET request
const result = await client.request<{ id: string; name: string }>({
  url: "/users/1",
  method: "GET",
});

// POST request with JSON body
const createResult = await client.request<{ id: string }>({
  url: "/users",
  method: "POST",
  body: { name: "John", email: "john@example.com" },
});

// POST request with form data
const formData = new URLSearchParams();
formData.append("email", "user@example.com");
formData.append("password", "secret");

const loginResult = await client.request({
  url: "/auth/login",
  method: "POST",
  body: formData,
});
```

## Type Definitions

All types are exported from the main module:

### Core Types

- `FetchRequestOptions<TBody>` - Request options interface
- `FetchResult<TResponse>` - Non-streaming response result
- `FetchStreamResult` - Streaming response result
- `FetchClientConfig` - Client configuration options

### Error Types

- `FetchError` - Custom error class for fetch client errors
- `FetchErrorType` - Enum of error types (NETWORK, HTTP, TIMEOUT, PARSER, UNKNOWN)
- `ParserErrorOptions` - Parser error configuration options

### Utility Types

- `CONTENT_TYPES` - Content type constants
- `detectContentType()` - Detect content type from headers
- `isJsonContentType()` - Check if content type is JSON
- `isTextContentType()` - Check if content type is text
- `isStreamingContentType()` - Check if content type is streaming
- `parseResponseByContentType()` - Parse response based on content type
- `getStreamingResponse()` - Get streaming response body

### Import Example

```ts
import {
  createFetchClient,
  FetchClient,
  FetchError,
  FetchErrorType,
  type FetchRequestOptions,
  type FetchResult,
  type FetchStreamResult,
  type FetchClientConfig,
  type ParserErrorOptions,
} from "@/lib/fetch-client";
```
