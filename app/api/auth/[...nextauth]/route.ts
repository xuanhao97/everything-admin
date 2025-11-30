// Purpose: NextAuth.js API route handler
// - Handles all authentication endpoints
// - Exposes NextAuth.js REST API

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
