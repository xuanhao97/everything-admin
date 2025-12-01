// Purpose: NextAuth.js API route handler
// - Handles all authentication endpoints
// - Exposes NextAuth.js REST API

import { handlers } from "@/auth";

// Force dynamic rendering - NextAuth requires dynamic rendering for session handling
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
