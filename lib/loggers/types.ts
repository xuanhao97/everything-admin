export type LogLevel = "debug" | "info" | "success" | "warn" | "error";

export interface LoggerMetadata {
  [key: string]: unknown;
}

export interface LoggerContext {
  enabled?: boolean;
  [key: string]: unknown;
}

import type { LoggerAdapter } from "./adapters/adapter";

export interface LoggerConfig {
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

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LoggerContext;
  metadata?: LoggerMetadata;
  timestamp: Date;
}
