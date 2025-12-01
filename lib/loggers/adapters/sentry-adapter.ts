import type { LogEntry } from "../types";

import type { LoggerAdapter } from "./adapter";

export class SentryAdapter implements LoggerAdapter {
  private sentryClient: unknown;

  constructor(sentryClient?: unknown) {
    this.sentryClient = sentryClient;
  }

  log(entry: LogEntry): void {
    if (!this.sentryClient) {
      console.warn(
        "Sentry client not initialized. Install @sentry/nextjs and pass client to SentryAdapter."
      );
      return;
    }

    const severity = this.mapLevelToSentrySeverity(entry.level);

    if (entry.level === "error") {
      this.captureException(entry);
    } else {
      this.captureMessage(entry, severity);
    }
  }

  private mapLevelToSentrySeverity(level: LogEntry["level"]): string {
    const mapping: Record<LogEntry["level"], string> = {
      debug: "debug",
      info: "info",
      success: "info",
      warn: "warning",
      error: "error",
    };
    return mapping[level];
  }

  private captureException(entry: LogEntry): void {
    const Sentry = this.sentryClient as {
      captureException: (error: Error, context?: unknown) => void;
    };

    const error = new Error(entry.message);
    Sentry.captureException(error, {
      level: "error",
      tags: entry.context,
      extra: entry.metadata,
    });
  }

  private captureMessage(entry: LogEntry, severity: string): void {
    const Sentry = this.sentryClient as {
      captureMessage: (
        message: string,
        level?: string,
        context?: unknown
      ) => void;
    };

    Sentry.captureMessage(entry.message, severity, {
      tags: entry.context,
      extra: entry.metadata,
    });
  }
}
