import { z } from "zod";

// Base webhook payload schema
// All Make.com webhooks must include messageType
export const baseWebhookSchema = z.object({
  messageType: z.string().min(1, "messageType is required"),
});

// Type for base webhook payload
export type BaseWebhookPayload = z.infer<typeof baseWebhookSchema>;

// Helper to extract messageType from payload
export function getMessageType(payload: unknown): string | null {
  const result = baseWebhookSchema.safeParse(payload);
  return result.success ? result.data.messageType : null;
}
