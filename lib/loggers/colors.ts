export const colors = {
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
};

export const logLevelColors: Record<
  string,
  { text: string; bg: string; label: string }
> = {
  debug: {
    text: colors.cyan,
    bg: colors.bgCyan,
    label: "DEBUG",
  },
  info: {
    text: colors.blue,
    bg: colors.bgBlue,
    label: "INFO ",
  },
  success: {
    text: colors.green,
    bg: colors.bgGreen,
    label: "SUCCESS",
  },
  warn: {
    text: colors.yellow,
    bg: colors.bgYellow,
    label: "WARN ",
  },
  error: {
    text: colors.red,
    bg: colors.bgRed,
    label: "ERROR",
  },
};

export const formatColor = (text: string, color: string): string => {
  return `${color}${text}${colors.reset}`;
};

export const formatTimestamp = (date: Date): string => {
  return date.toISOString();
};
