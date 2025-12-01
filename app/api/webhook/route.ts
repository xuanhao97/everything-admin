import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createLogger } from "@/lib/loggers";
import { dispatchWebhook } from "@/lib/webhook/dispatcher";
import { baseWebhookSchema } from "@/lib/webhook/schemas";

// Import handlers to register them
import "@/lib/webhook/handlers";

// Create logger with context
const logger = createLogger({ service: "WEBHOOK" });

// Webhook response schema - stable format
const webhookResponseSchema = z.object({
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type WebhookResponse = z.infer<typeof webhookResponseSchema>;

// POST handler for Make.com webhook
export async function POST(request: NextRequest) {
  try {
    logger.info("Received webhook request");

    // Parse request body
    const body = await request.json();
    logger.info("Parsed request body", {
      messageType: body.messageType,
      data: body,
    });

    // Validate base webhook structure
    const validationResult = baseWebhookSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error("Invalid webhook payload", {
        error: validationResult.error.message,
        receivedData: body,
      });
      return NextResponse.json(
        {
          success: false,
          message: `Invalid webhook payload: ${validationResult.error.message}`,
        },
        { status: 400 }
      );
    }

    logger.info("Dispatching webhook", {
      messageType: validationResult.data.messageType,
      payload: validationResult.data,
    });

    // Dispatch to appropriate handler
    const result = await dispatchWebhook(validationResult.data);

    logger.info("Handler response received", {
      success: result.success,
      resultData: result,
    });

    // Validate response format
    const responseValidation = webhookResponseSchema.safeParse(result);

    if (!responseValidation.success) {
      logger.error("Invalid handler response format", {
        result,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Internal error: Invalid handler response format",
        },
        { status: 500 }
      );
    }

    // Return stable response format
    const statusCode = result.success ? 200 : 400;

    if (result.success) {
      logger.success("Webhook processed successfully", {
        messageType: validationResult.data.messageType,
        statusCode,
        responseData: result.data,
      });
    } else {
      logger.error("Webhook processing failed", {
        messageType: validationResult.data.messageType,
        message: result.message,
        statusCode,
        errorData: result.data,
      });
    }

    logger.info("Sending response", {
      statusCode,
      response: result,
    });

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      logger.error("Invalid JSON payload", { error: error.message });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON payload",
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    logger.error("Unexpected error", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Optional: Handle GET requests for health checks
export async function GET() {
  logger.info("Health check requested");
  return NextResponse.json(
    {
      success: true,
      message: "Webhook endpoint is active",
    },
    { status: 200 }
  );
}
