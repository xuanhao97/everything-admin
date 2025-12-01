/* eslint-disable no-console */
import {
  colors,
  formatColor,
  formatTimestamp,
  logLevelColors,
} from "../colors";
import type { LogEntry, LoggerConfig } from "../types";
import { getDefaultConfig } from "../utils";

import type { LoggerAdapter } from "./adapter";

export class ConsoleAdapter implements LoggerAdapter {
  private config: Omit<LoggerConfig, "adapter">;

  constructor(config?: Omit<LoggerConfig, "adapter">) {
    this.config = config || getDefaultConfig();
  }

  log(entry: LogEntry): void {
    const levelConfig = logLevelColors[entry.level];

    if (!levelConfig) {
      // Fallback to default if level config not found
      console.log(entry.message);
      return;
    }

    const parts: string[] = [];

    if (this.config.showTimestamp) {
      parts.push(
        formatColor(`[${formatTimestamp(entry.timestamp)}]`, colors.dim)
      );
    }

    const levelLabel = formatColor(
      `[${levelConfig.label}]`,
      `${levelConfig.bg}${colors.black}${colors.bright}`
    );
    parts.push(levelLabel);

    if (this.config.showContext && entry.context) {
      const contextStr = Object.entries(entry.context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(" ");
      parts.push(formatColor(`[${contextStr}]`, colors.cyan));
    }

    parts.push(formatColor(entry.message, levelConfig.text));

    if (this.config.showMetadata && entry.metadata) {
      const metadataStr = Object.entries(entry.metadata)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(" ");
      parts.push(formatColor(`{${metadataStr}}`, colors.dim));
    }

    const formattedMessage = parts.join(" ");
    const consoleMethod =
      entry.level === "error"
        ? console.error
        : entry.level === "warn"
          ? console.warn
          : console.log;

    consoleMethod(formattedMessage);
  }
}
