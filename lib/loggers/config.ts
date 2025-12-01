import type { LoggerAdapter } from "./adapters/adapter";
import { ConsoleAdapter } from "./adapters/console-adapter";
import type { LoggerConfig } from "./types";

const getDefaultAdapter = (): LoggerAdapter => {
  return new ConsoleAdapter();
};

const getEnabledFromEnv = (): boolean => {
  const envValue = process.env.LOGGER_ENABLED;
  if (envValue === undefined) return true;
  return envValue === "true" || envValue === "1";
};

const defaultConfig: LoggerConfig = {
  enabled: getEnabledFromEnv(),
  showTimestamp: true,
  showContext: true,
  showMetadata: true,
  adapter: getDefaultAdapter(),
  debugFilter: {
    enabled: false,
    contexts: [],
  },
};

let currentConfig: LoggerConfig = { ...defaultConfig };

export const getConfig = (): LoggerConfig => {
  return { ...currentConfig };
};

export const setConfig = (config: Partial<LoggerConfig>): void => {
  currentConfig = {
    ...currentConfig,
    ...config,
    debugFilter: config.debugFilter
      ? {
          ...currentConfig.debugFilter,
          ...config.debugFilter,
          enabled:
            config.debugFilter.enabled ??
            currentConfig.debugFilter?.enabled ??
            false,
        }
      : currentConfig.debugFilter,
  };
};

export const resetConfig = (): void => {
  currentConfig = { ...defaultConfig };
};

export const setAdapter = (adapter: LoggerAdapter): void => {
  currentConfig.adapter = adapter;
};

export const getAdapter = (): LoggerAdapter => {
  return currentConfig.adapter || getDefaultAdapter();
};
