import { getAdapter, getConfig } from "./config";
import type {
  LogEntry,
  LogLevel,
  LoggerContext,
  LoggerMetadata,
} from "./types";

class Logger {
  private context: LoggerContext;

  constructor(context?: LoggerContext) {
    this.context = context || {};
  }

  withContext(context: LoggerContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  private shouldLog(level: LogLevel, context?: LoggerContext): boolean {
    const config = getConfig();

    if (!config.enabled) {
      return false;
    }

    // Check enabled from context (defaults to true)
    const mergedContext = { ...this.context, ...context };
    const contextEnabled = mergedContext.enabled ?? true;
    if (!contextEnabled) {
      return false;
    }

    if (level === "debug") {
      if (!config.debugFilter?.enabled) {
        return false;
      }

      if (
        config.debugFilter.contexts &&
        config.debugFilter.contexts.length > 0
      ) {
        const contextKeys = Object.keys(mergedContext);
        const hasMatchingContext = config.debugFilter.contexts.some(
          (filterContext) =>
            contextKeys.includes(filterContext) ||
            contextKeys.some((key) => key.includes(filterContext))
        );

        if (!hasMatchingContext) {
          return false;
        }
      }
    }

    return true;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LoggerContext,
    metadata?: LoggerMetadata
  ): void {
    if (!this.shouldLog(level, context)) {
      return;
    }

    const mergedContext = { ...this.context, ...context };
    const entry: LogEntry = {
      level,
      message,
      context:
        Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
      metadata,
      timestamp: new Date(),
    };

    const adapter = getAdapter();
    adapter.log(entry);
  }

  debug(
    message: string,
    context?: LoggerContext,
    metadata?: LoggerMetadata
  ): void {
    this.log("debug", message, context, metadata);
  }

  info(
    message: string,
    context?: LoggerContext,
    metadata?: LoggerMetadata
  ): void {
    this.log("info", message, context, metadata);
  }

  success(
    message: string,
    context?: LoggerContext,
    metadata?: LoggerMetadata
  ): void {
    this.log("success", message, context, metadata);
  }

  warn(
    message: string,
    context?: LoggerContext,
    metadata?: LoggerMetadata
  ): void {
    this.log("warn", message, context, metadata);
  }

  error(
    message: string,
    context?: LoggerContext,
    metadata?: LoggerMetadata
  ): void {
    this.log("error", message, context, metadata);
  }
}

export const createLogger = (context?: LoggerContext): Logger => {
  return new Logger(context);
};

export const logger = createLogger();
