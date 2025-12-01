import type { LogEntry } from "../types";

import type { LoggerAdapter } from "./adapter";

export interface GrafanaAdapterOptions {
  endpoint?: string;
  apiKey?: string;
  labels?: Record<string, string>;
}

export class GrafanaAdapter implements LoggerAdapter {
  private options: GrafanaAdapterOptions;

  constructor(options?: GrafanaAdapterOptions) {
    this.options = {
      endpoint: options?.endpoint || process.env.GRAFANA_LOKI_ENDPOINT,
      apiKey: options?.apiKey || process.env.GRAFANA_LOKI_API_KEY,
      labels: options?.labels || {},
    };
  }

  log(entry: LogEntry): void {
    if (!this.options.endpoint) {
      console.warn(
        "Grafana Loki endpoint not configured. Set GRAFANA_LOKI_ENDPOINT env variable."
      );
      return;
    }

    this.sendToLoki(entry);
  }

  private async sendToLoki(entry: LogEntry): Promise<void> {
    try {
      const labels = {
        level: entry.level,
        ...this.options.labels,
        ...this.extractLabelsFromContext(entry.context),
      };

      const logLine = {
        stream: labels,
        values: [
          [
            String(entry.timestamp.getTime() * 1000000),
            this.formatLogLine(entry),
          ],
        ],
      };

      const response = await fetch(
        `${this.options.endpoint}/loki/api/v1/push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.options.apiKey && {
              Authorization: `Bearer ${this.options.apiKey}`,
            }),
          },
          body: JSON.stringify({ streams: [logLine] }),
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to send log to Grafana Loki:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error sending log to Grafana Loki:", error);
    }
  }

  private extractLabelsFromContext(
    context?: Record<string, unknown>
  ): Record<string, string> {
    if (!context) return {};

    const labels: Record<string, string> = {};
    for (const [key, value] of Object.entries(context)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        labels[key] = String(value);
      }
    }
    return labels;
  }

  private formatLogLine(entry: LogEntry): string {
    const parts: string[] = [entry.message];

    if (entry.context) {
      parts.push(`context=${JSON.stringify(entry.context)}`);
    }

    if (entry.metadata) {
      parts.push(`metadata=${JSON.stringify(entry.metadata)}`);
    }

    return parts.join(" ");
  }
}
