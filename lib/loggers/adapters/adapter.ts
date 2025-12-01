import type { LogEntry } from "../types";

export interface LoggerAdapter {
  log(entry: LogEntry): void;
}
