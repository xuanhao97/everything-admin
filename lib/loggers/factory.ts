// Purpose: Factory for creating default logger adapter
// - Separated from config.ts to avoid config importing adapters directly
// - Creates ConsoleAdapter as default adapter
// - Can be extended to support other default adapters

import type { LoggerAdapter } from "./adapters/adapter";
import { ConsoleAdapter } from "./adapters/console-adapter";
import type { LoggerConfig } from "./types";
import { getDefaultConfig } from "./utils";

/**
 * Creates the default logger adapter
 * Currently returns ConsoleAdapter with default config
 *
 * @param config - Optional config to pass to adapter
 * @returns Default logger adapter instance
 */
export function createDefaultAdapter(
  config?: Omit<LoggerConfig, "adapter">
): LoggerAdapter {
  return new ConsoleAdapter(config || getDefaultConfig());
}
