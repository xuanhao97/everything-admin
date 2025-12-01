# Logger Library

A logger wrapper library with context, metadata, colors, debug filtering, and adapter pattern for extensibility to other logging systems like Sentry.

## Table of Contents

- [Structure](#structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Basic Usage](#basic-usage)
  - [Default Logger](#default-logger)
  - [Logger with Context](#logger-with-context)
  - [Logger with Metadata](#logger-with-metadata)
  - [Extend Context](#extend-context)
- [Configuration](#configuration)
  - [Global Configuration](#global-configuration)
  - [Debug Filter](#debug-filter)
- [Adapter Pattern](#adapter-pattern)
  - [Console Adapter (Default)](#console-adapter-default)
  - [Sentry Adapter](#sentry-adapter)
  - [Custom Adapter](#custom-adapter)
- [Log Levels](#log-levels)
- [Log Format](#log-format)
- [Usage Examples](#usage-examples)
  - [API Route](#api-route)
  - [Service Layer](#service-layer)
- [Types](#types)
- [Best Practices](#best-practices)

## Structure

```
loggers/
├── index.ts              # Main exports
├── logger.ts             # Core logger implementation
├── types.ts              # Type definitions
├── config.ts             # Configuration management
├── colors.ts             # Color utilities
├── adapters/
│   ├── index.ts          # Adapter exports
│   ├── adapter.ts        # Adapter interface
│   ├── console-adapter.ts    # Console adapter (default)
│   ├── sentry-adapter.ts     # Sentry adapter
│   └── grafana-adapter.ts    # Grafana Loki adapter
└── README.md             # Documentation
```

## Installation

Logger is integrated into the project, no additional dependencies needed.

```typescript
import { logger, createLogger, setConfig } from "@/lib/loggers";
```

## Environment Variables

Logger can be enabled/disabled via environment variable:

```bash
# .env.local or .env
LOGGER_ENABLED=true   # Enable logger (default: true)
LOGGER_ENABLED=false  # Disable logger
```

When `LOGGER_ENABLED=false`, all logs will be completely hidden.

## Basic Usage

### Default Logger

```typescript
import { logger } from "@/lib/loggers";

logger.info("System information");
logger.success("Operation successful");
logger.warn("Warning");
logger.error("Error occurred");
logger.debug("Debug information");
```

### Logger with Context

```typescript
import { createLogger } from "@/lib/loggers";

const apiLogger = createLogger({ service: "api", version: "1.0" });

apiLogger.info("Request received", { endpoint: "/users" });
apiLogger.error("Request failed", { endpoint: "/users", status: 500 });
```

### Logger with Metadata

```typescript
logger.info("User logged in", undefined, { userId: "123", ip: "192.168.1.1" });
logger.success(
  "Payment processed",
  { orderId: "ORD-001" },
  { amount: 1000, currency: "USD" }
);
```

### Extend Context

```typescript
const logger = createLogger({ service: "auth" });
const extendedLogger = logger.withContext({ userId: "123" });
extendedLogger.info("User action");
```

## Configuration

### Global Configuration

```typescript
import { setConfig } from "@/lib/loggers";

setConfig({
  enabled: true,
  showTimestamp: true,
  showContext: true,
  showMetadata: true,
});
```

### Debug Filter

Filter debug logs by context:

```typescript
import { setConfig } from "@/lib/loggers";

setConfig({
  debugFilter: {
    enabled: true,
    contexts: ["api", "database"],
  },
});
```

**Note**: When `debugFilter.enabled = false`, all debug logs are hidden. Only when `enabled = true` and context matches the filter will debug logs be shown.

## Adapter Pattern

Logger uses adapter pattern for extensibility. Default is `ConsoleAdapter`.

### Console Adapter (Default)

```typescript
import { ConsoleAdapter, setAdapter } from "@/lib/loggers";

const consoleAdapter = new ConsoleAdapter();
setAdapter(consoleAdapter);
```

### Sentry Adapter

Send logs to Sentry for error tracking and monitoring.

```typescript
import { SentryAdapter, setAdapter, ConsoleAdapter } from "@/lib/loggers";
import * as Sentry from "@sentry/nextjs";

// Use Sentry adapter
const sentryAdapter = new SentryAdapter(Sentry);
setAdapter(sentryAdapter);

// Or combine with console adapter
import type { LoggerAdapter, LogEntry } from "@/lib/loggers";

class MultiAdapter implements LoggerAdapter {
  private adapters: LoggerAdapter[];

  constructor(adapters: LoggerAdapter[]) {
    this.adapters = adapters;
  }

  log(entry: LogEntry): void {
    this.adapters.forEach((adapter) => {
      try {
        adapter.log(entry);
      } catch (error) {
        console.error("Adapter error:", error);
      }
    });
  }
}

const multiAdapter = new MultiAdapter([
  new ConsoleAdapter(),
  new SentryAdapter(Sentry),
]);
setAdapter(multiAdapter);
```

**Note**: Install `@sentry/nextjs` to use Sentry adapter:

```bash
pnpm add @sentry/nextjs
```

### Custom Adapter

Create custom adapter by implementing `LoggerAdapter` interface:

```typescript
import type { LoggerAdapter, LogEntry } from "@/lib/loggers";
import { setAdapter } from "@/lib/loggers";

class CustomAdapter implements LoggerAdapter {
  log(entry: LogEntry): void {
    // Custom logic to send logs
    // e.g., send to database, external API, etc.
    console.log("Custom log:", entry);
  }
}

setAdapter(new CustomAdapter());
```

## Log Levels

- **Info** (Blue): `logger.info('Information')`
- **Success** (Green): `logger.success('Success')`
- **Warn** (Yellow): `logger.warn('Warning')`
- **Error** (Red): `logger.error('Error')`
- **Debug** (Cyan): `logger.debug('Debug')`

## Log Format

```
[timestamp] [LEVEL] [context] message {metadata}
```

Example:

```
[2024-01-15T10:30:45.123Z] [INFO ] [service=api endpoint=/users] Request received {userId=123 ip=192.168.1.1}
```

## Usage Examples

### API Route

```typescript
import { createLogger } from "@/lib/loggers";

const logger = createLogger({ service: "api" });

export async function GET(request: Request) {
  logger.info("API request received", { method: "GET" });

  try {
    const data = await fetchData();
    logger.success("Data fetched successfully", undefined, {
      count: data.length,
    });
    return Response.json(data);
  } catch (error) {
    logger.error(
      "Failed to fetch data",
      { method: "GET" },
      { error: error.message }
    );
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Service Layer

```typescript
import { createLogger } from "@/lib/loggers";

const userServiceLogger = createLogger({ module: "user-service" });

export async function createUser(userData: UserData) {
  userServiceLogger.debug("Creating user", { email: userData.email });

  try {
    const user = await db.users.create(userData);
    userServiceLogger.success("User created", { userId: user.id });
    return user;
  } catch (error) {
    userServiceLogger.error(
      "Failed to create user",
      { email: userData.email },
      { error: error.message }
    );
    throw error;
  }
}
```

## Types

```typescript
type LogLevel = "debug" | "info" | "success" | "warn" | "error";

interface LoggerContext {
  [key: string]: unknown;
}

interface LoggerMetadata {
  [key: string]: unknown;
}

interface LoggerConfig {
  enabled: boolean;
  showTimestamp: boolean;
  showContext: boolean;
  showMetadata: boolean;
  adapter?: LoggerAdapter;
  debugFilter?: {
    enabled: boolean;
    contexts?: string[];
  };
}

interface LoggerAdapter {
  log(entry: LogEntry): void;
}
```

## Best Practices

1. **Use appropriate context**: Create logger with clear context for each module/service
2. **Metadata for additional info**: Use metadata for non-contextual information
3. **Debug filter in development**: Enable debug filter when debugging specific modules
4. **Disable debug in production**: Ensure `debugFilter.enabled = false` in production
5. **Consistent context naming**: Use consistent context names (e.g., 'api', 'database', 'auth')
6. **Environment variables**: Use `LOGGER_ENABLED=false` in production to completely disable logger if needed
7. **Adapter selection**: Choose adapter suitable for environment (Console for dev, Sentry for production)
8. **Multi-adapter**: Use multi-adapter to send logs to multiple destinations simultaneously
