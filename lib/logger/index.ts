// Purpose: Logger utility with context and colored output
// - Supports info, success, error log levels
// - Context-based logging for better organization
// - ANSI color codes for terminal output

// ANSI color codes
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  // Text colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
} as const;

// Log level colors
const LOG_COLORS = {
  info: COLORS.cyan,
  success: COLORS.green,
  error: COLORS.red,
  warn: COLORS.yellow,
} as const;

// Format timestamp
function formatTimestamp(): string {
  return new Date().toISOString();
}

// Format context label
function formatContext(context: string): string {
  return `${COLORS.dim}[${context}]${COLORS.reset}`;
}

// Format log level label
function formatLevel(level: keyof typeof LOG_COLORS): string {
  const color = LOG_COLORS[level];
  const label = level.toUpperCase().padEnd(7);
  return `${color}${COLORS.bright}${label}${COLORS.reset}`;
}

// Base log function
function log(
  level: keyof typeof LOG_COLORS,
  context: string,
  message: string,
  ...args: unknown[]
): void {
  const timestamp = formatTimestamp();
  const contextLabel = formatContext(context);
  const levelLabel = formatLevel(level);
  const logMessage = `${timestamp} ${levelLabel} ${contextLabel} ${message}`;

  if (level === "error") {
    console.error(logMessage, ...args);
  } else {
    console.log(logMessage, ...args);
  }
}

// Logger interface
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
}

// Create logger with context
export function createLogger(context: string): Logger {
  return {
    info: (message: string, ...args: unknown[]) =>
      log("info", context, message, ...args),
    success: (message: string, ...args: unknown[]) =>
      log("success", context, message, ...args),
    error: (message: string, ...args: unknown[]) =>
      log("error", context, message, ...args),
    warn: (message: string, ...args: unknown[]) =>
      log("warn", context, message, ...args),
  };
}

// Default logger without context
export const logger = createLogger("APP");
