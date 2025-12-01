import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { dispatchWebhook } from "@/lib/webhook/dispatcher";
import "@/lib/webhook/register-handlers";
import { baseWebhookSchema } from "@/lib/webhook/schemas";

// Webhook response schema - stable format
const webhookResponseSchema = z.object({
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type WebhookResponse = z.infer<typeof webhookResponseSchema>;

// Force dynamic rendering - webhook endpoint requires dynamic handling
export const dynamic = "force-dynamic";

// POST handler for Make.com webhook
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate base webhook structure
    const validationResult = baseWebhookSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid webhook payload: ${validationResult.error.message}`,
        },
        { status: 400 }
      );
    }

    // Dispatch to appropriate handler
    const result = await dispatchWebhook(validationResult.data);

    // Validate response format
    const responseValidation = webhookResponseSchema.safeParse(result);

    if (!responseValidation.success) {
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

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
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
  return NextResponse.json(
    {
      success: true,
      message: "Webhook endpoint is active",
    },
    { status: 200 }
  );
}
