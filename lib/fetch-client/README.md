# Fetch Client Library

A reusable, type-safe fetch client for API requests with comprehensive error handling, streaming support, and configurable options.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Examples](#examples)

## Overview

The Fetch Client library provides a robust, configurable HTTP client built on top of the native `fetch` API. It supports:

- Base URL configuration for API endpoints
- Automatic request/response transformation
- Streaming response support
- Comprehensive error handling with typed errors
- Configurable parser error handling
- Optional logging
- Timeout support

## Features

- **Type-safe**: Full TypeScript support with generics
- **Base URL Support**: Configure base URL for relative endpoint paths
- **Streaming**: Support for streaming responses
- **Error Classification**: Typed errors with classification (Network, HTTP, Timeout, Parser, Unknown)
- **Parser Error Handling**: Configurable parser error handling with fallback values
- **Logging Control**: Optional logging with enable/disable
- **Timeout Support**: Configurable request timeouts (default: 60s)

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

console.log(result.data); // Response data
console.log(result.status); // HTTP status
```

```ts
// POST request with JSON body
const result = await client.request<{ id: string }>({
  url: "/users",
  method: "POST",
  body: { name: "John" },
});
```

```ts
// POST request with form data (URLSearchParams)
const formData = new URLSearchParams();
formData.append("email", "user@example.com");
formData.append("token", "abc123");

const result = await client.request({
  url: "/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: formData, // URLSearchParams is supported
});
```

```ts
// POST request with FormData (multipart/form-data)
const formData = new FormData();
formData.append("file", fileBlob);
formData.append("name", "document.pdf");

const result = await client.request({
  url: "/upload",
  method: "POST",
  body: formData, // FormData is supported, Content-Type will be set automatically
});
```

```ts
// Streaming request
const streamResult = await client.request({
  url: "/stream",
  stream: true,
});

const reader = streamResult.stream.getReader();
// Process stream...
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

Executes a fetch request.

**Parameters:**

- `options.url`: Request URL (relative or absolute)
- `options.method` (optional): HTTP method (default: "GET")
- `options.body` (optional): Request body
  - FormData: Pass through as-is (browser handles Content-Type with boundary)
  - URLSearchParams: Pass through as-is
  - String: Pass through as-is
  - Object: Will be JSON stringified
- `options.headers` (optional): Custom headers
- `options.timeout` (optional): Request timeout in milliseconds
- `options.parseJson` (optional): Parse response as JSON (default: true)
- `options.stream` (optional): Return streaming response (default: false)

**Returns:** Promise resolving to `FetchResult` or `FetchStreamResult`

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

### Service-Specific Client

```ts
// chatbot-service.ts
import { createFetchClient } from "@/lib/fetch-client";

const chatbotClient = createFetchClient({
  baseUrl: "https://ai-chat.arobid.com/api/v1.0",
  defaultHeaders: {
    "User-Agent": "Mozilla/5.0...",
  },
  defaultTimeout: 30000,
  enableLogger: false,
});

export async function askChatbot(question: string) {
  const result = await chatbotClient.request<{ answer: string }>({
    url: "/chat/ask",
    method: "POST",
    body: { question },
  });

  return result.data.answer;
}
```

### Error Handling with Type Guards

```ts
import { FetchError, FetchErrorType } from "@/lib/fetch-client";

try {
  const result = await client.request({ url: "/api/data" });
} catch (error) {
  if (error instanceof FetchError) {
    if (error.type === FetchErrorType.HTTP && error.status === 404) {
      // Handle 404 specifically
      console.log("Resource not found");
    } else if (error.type === FetchErrorType.TIMEOUT) {
      // Handle timeout
      console.log("Request timed out");
    }
  }
}
```

### Streaming Response

```ts
const streamResult = await client.request({
  url: "/api/stream",
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

## File Structure

```
fetch-client/
├── index.ts           # Main FetchClient class and exports
├── error-handler.ts   # Error handling utilities
└── README.md          # This file
```

## Type Definitions

All types are exported from the main module:

- `FetchRequestOptions<TBody>`
- `FetchResult<TResponse>`
- `FetchStreamResult`
- `FetchClientConfig`
- `ParserErrorOptions`
- `FetchError`
- `FetchErrorType`
