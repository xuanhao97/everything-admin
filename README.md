# Base Admin

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Authentication Service](#authentication-service)
- [Webhook System](#webhook-system)
- [Project Structure](#project-structure)
- [Examples](#examples)

## Overview

Base Admin is a fullstack Next.js application built with TypeScript, Server Components, and Server Actions. It includes a robust webhook system for handling Make.com webhooks with type-safe validation and handler dispatching.

## Features

- Next.js 15 with App Router
- TypeScript for type safety
- Server Components by default
- Server Actions for server-side operations
- Zod schema validation
- Better Auth authentication with Google OAuth (no database required)
- Protected admin routes with middleware
- Authentication service with token refresh
- Webhook handler system with messageType-based dispatching
- Stable webhook API response format
- ESLint for code linting
- Prettier for code formatting
- Strict TypeScript configuration

## Installation

```bash
pnpm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `GOOGLE_CLIENT_ID`: Google OAuth Client ID (get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret (get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- `BETTER_AUTH_URL` (optional): Base URL for Better Auth (defaults to `NEXT_PUBLIC_APP_URL` or `http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` (optional): Public app URL (defaults to `http://localhost:3000`)
- `BASE_DOMAIN`: Base API domain (e.g., `https://account.base.vn`)
- `BASE_REFRESH_TOKEN`: Refresh token for authentication
- `BASE_COOKIE`: Session cookie (optional)

### Better Auth Configuration

1. Create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client ID**
   - Select **Web application**
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (for development)
   - Add production redirect URI: `https://yourdomain.com/api/auth/callback/google` (for production)
   - Copy **Client ID** and **Client Secret**

2. Add credentials to `.env.local`:

   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Note**: This setup uses in-memory storage (no database). Sessions will be lost on server restart. For production with persistent sessions, consider adding a database.

## Usage

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check code formatting
pnpm format:check

# Type check without building
pnpm type-check
```

## Authentication Service

### Refresh Token

The authentication service provides a `refreshToken` function to refresh authentication tokens with the Base API.

#### Basic Usage

```typescript
import { refreshToken } from "@/lib/services/auth";

// Use environment variables
const result = await refreshToken();

if (result.success) {
  console.log(result.data?.access_token);
  console.log(result.data?.refresh_token);
} else {
  console.error(result.error);
}
```

#### With Custom Options

```typescript
import { refreshToken } from "@/lib/services/auth";

// Override refresh token and cookie
const result = await refreshToken({
  refreshToken: "your_custom_token",
  cookie: "basessid=your_cookie",
});
```

#### Response Format

```typescript
{
  success: boolean;
  data?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    [key: string]: unknown;
  };
  error?: string;
  message?: string;
}
```

#### Validation

The service uses Zod schemas to validate:

- Input options (refreshToken, cookie)
- API response data structure

Invalid inputs or responses will return detailed error messages.

## Webhook System

### Endpoint

The webhook endpoint is available at:

```
POST /api/webhook
```

### Webhook Payload Format

All webhook payloads must include a `messageType` field:

```json
{
  "messageType": "example",
  "data": {
    "id": "123",
    "name": "Test"
  }
}
```

### Response Format

The webhook endpoint returns a stable response format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

### Creating New Handlers

1. Create a new handler file in `lib/webhook/handlers/`:

```typescript
// lib/webhook/handlers/my-handler.ts
import { z } from "zod";
import { registerHandler } from "../dispatcher";

const myPayloadSchema = z.object({
  messageType: z.literal("my-message-type"),
  // ... other fields
});

async function handleMyMessage(payload: unknown) {
  const result = myPayloadSchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      message: `Invalid payload: ${result.error.message}`,
    };
  }

  // Your business logic here

  return {
    success: true,
    message: "Processed successfully",
  };
}

registerHandler("my-message-type", handleMyMessage);
```

2. Import the handler in `lib/webhook/handlers/index.ts`:

```typescript
import "./my-handler";
```

## Project Structure

```
base-admin/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts      # Webhook API endpoint
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/
│   ├── auth/
│   │   ├── index.ts          # Auth service exports
│   │   ├── refreshToken.ts   # Refresh token service
│   │   └── schemas.ts        # Auth validation schemas
│   └── webhook/
│       ├── schemas.ts        # Base webhook schemas
│       ├── dispatcher.ts     # Handler dispatch logic
│       └── handlers/
│           ├── index.ts      # Handler registry imports
│           └── example.ts    # Example handler
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── next.config.js
```

## Examples

### Refresh Token Example

```typescript
import { refreshToken } from "@/lib/services/auth";

async function handleTokenRefresh() {
  const result = await refreshToken();

  if (result.success && result.data) {
    // Use the new access token
    const accessToken = result.data.access_token;
    const refreshToken = result.data.refresh_token;

    // Update your token storage
    // await updateTokens(accessToken, refreshToken);
  } else {
    // Handle error
    console.error("Token refresh failed:", result.error);
  }
}
```

### Example Webhook Request

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "messageType": "example",
    "data": {
      "id": "123",
      "name": "Test Item"
    }
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Example webhook processed successfully",
  "data": {
    "processedId": "123",
    "processedName": "Test Item"
  }
}
```
