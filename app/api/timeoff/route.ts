// Purpose: API route for fetching timeoff list
// - Exposes timeoff list data to client components
// - Handles errors and returns JSON response
//
// Example:
// GET /api/timeoff
// Response: { success: true, data: { data: [...], total: 10 } }

import { NextResponse } from "next/server";

import { getTimeoffList } from "@/lib/services/timeoff";

// Force dynamic rendering - API route requires session/cookies
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getTimeoffList();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch timeoff list",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
