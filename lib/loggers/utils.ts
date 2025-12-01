// Purpose: Configuration values for logger
// - Separated from config.ts to avoid circular dependencies
// - Contains only static configuration values, no functions that import adapters

import type { LoggerConfig } from "./types";

const getEnabledFromEnv = (): boolean => {
  const envValue = process.env.LOGGER_ENABLED;
  if (envValue === undefined) return true;
  return envValue === "true" || envValue === "1";
};

export const getDefaultConfig = (): Omit<LoggerConfig, "adapter"> => {
  return {
    enabled: getEnabledFromEnv(),
    showTimestamp: true,
    showContext: true,
    showMetadata: true,
    debugFilter: {
      enabled: false,
      contexts: [],
    },
  };
};
