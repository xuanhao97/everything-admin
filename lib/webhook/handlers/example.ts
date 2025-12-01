import { z } from "zod";

import { logger } from "@/lib/loggers";

import { registerHandler } from "../dispatcher";

// Example payload schema for a specific messageType
const examplePayloadSchema = z.object({
  messageType: z.literal("example"),
  data: z.object({
    id: z.string(),
    name: z.string(),
    timestamp: z.string().optional(),
  }),
});

// Handler function for "example" messageType
async function handleExample(payload: unknown) {
  // Validate payload against schema
  const result = examplePayloadSchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      message: `Invalid payload: ${result.error.message}`,
    };
  }

  const { data } = result.data;

  // Business logic here
  // Example: process the data, save to database, etc.
  logger.info("Processing example webhook: ", data);

  return {
    success: true,
    message: "Example webhook processed successfully",
    data: {
      processedId: data.id,
      processedName: data.name,
    },
  };
}

// Register the handler
registerHandler("example", handleExample);
