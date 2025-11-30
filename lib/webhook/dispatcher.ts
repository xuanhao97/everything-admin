import { BaseWebhookPayload } from "./schemas";

// Handler function type
export type WebhookHandler = (payload: unknown) => Promise<{
  success: boolean;
  message?: string;
  data?: unknown;
}>;

// Registry of handlers by messageType
const handlers = new Map<string, WebhookHandler>();

// Register a handler for a specific messageType
export function registerHandler(
  messageType: string,
  handler: WebhookHandler
): void {
  handlers.set(messageType, handler);
}

// Dispatch payload to appropriate handler based on messageType
export async function dispatchWebhook(
  payload: BaseWebhookPayload
): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const { messageType } = payload;
  const handler = handlers.get(messageType);

  if (!handler) {
    return {
      success: false,
      message: `No handler registered for messageType: ${messageType}`,
    };
  }

  try {
    return await handler(payload);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get all registered messageTypes
export function getRegisteredMessageTypes(): string[] {
  return Array.from(handlers.keys());
}
