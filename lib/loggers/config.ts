import { createDefaultAdapter } from "./factory";
import type { LoggerAdapter, LoggerConfig } from "./types";
import { getDefaultConfig } from "./utils";

// Lazy initialization to avoid creating adapter instance at module load time
let defaultAdapterInstance: LoggerAdapter | null = null;

const getDefaultAdapter = (): LoggerAdapter => {
  if (!defaultAdapterInstance) {
    // Use factory to create default adapter (avoids direct import of adapters)
    defaultAdapterInstance = createDefaultAdapter(defaultConfigValues);
  }
  return defaultAdapterInstance;
};

const defaultConfigValues = getDefaultConfig();
const defaultConfig: LoggerConfig = {
  ...defaultConfigValues,
  // adapter will be initialized lazily via getAdapter()
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
  // Lazy initialization: if adapter is not set, use default
  if (!currentConfig.adapter) {
    currentConfig.adapter = getDefaultAdapter();
  }
  return currentConfig.adapter;
};
