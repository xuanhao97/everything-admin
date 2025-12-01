# Base Admin

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Webhook System](#webhook-system)

## Overview

Everything Admin is a fullstack Next.js application that provides authentication with Google OAuth and Base API SSO integration, automatic token refresh, timeoff management, and a robust webhook system for handling Make.com webhooks with type-safe validation and handler dispatching.

## Project Structure

```
everything-admin/
├── app/
│   ├── admin/                # Admin routes
│   │   ├── layout.tsx        # Admin layout with sidebar
│   │   ├── page.tsx         # Admin dashboard
│   │   └── timeoff/         # Timeoff management
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/            # NextAuth API routes
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── timeoff/         # Timeoff API routes
│   │   │   └── route.ts
│   │   └── webhook/         # Webhook API endpoint
│   │       └── route.ts
│   ├── auth/                # Auth pages
│   │   └── google/           # Google OAuth callback
│   ├── sign-in/             # Sign in page
│   ├── layout.tsx            # Root layout
│   └── page.tsx             # Home page
├── lib/
│   ├── constants/           # Constants
│   │   └── timeoff/         # Timeoff constants
│   ├── logger/              # Logger utility
│   ├── schemas/             # Zod validation schemas
│   │   ├── auth/            # Auth schemas
│   │   └── timeoff/          # Timeoff schemas
│   ├── services/            # Business logic services
│   │   ├── auth/            # Authentication services
│   │   │   ├── index.ts
│   │   │   ├── refreshToken.ts
│   │   │   └── ssoGoogle.ts
│   │   └── timeoff/          # Timeoff services
│   │       ├── index.ts
│   │       └── getTimeoffList.ts
│   ├── utils/               # Utility functions
│   │   ├── base-api.ts      # Base API token utilities
│   │   ├── jwt.ts           # JWT token utilities
│   │   └── utils.ts         # General utilities
│   └── webhook/             # Webhook system
│       ├── schemas.ts       # Base webhook schemas
│       ├── dispatcher.ts    # Handler dispatch logic
│       └── handlers/        # Webhook handlers
│           ├── index.ts
│           └── example.ts
├── components/              # React components
│   ├── admin/              # Admin components
│   ├── auth/               # Auth components
│   └── ui/                 # UI components
├── auth.ts                 # NextAuth configuration
├── middleware.ts            # Route protection middleware
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
└── next.config.js
```

## Features

- **Authentication**: Google OAuth with Base API SSO integration and automatic token refresh
- **Timeoff Management**: Service for fetching and managing timeoff data from Base API
- **Webhook System**: Type-safe webhook handler system with messageType-based dispatching
- **Protected Routes**: Admin routes protected with middleware authentication

## Installation

```bash
pnpm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### NextAuth Configuration

1. Create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client ID**
   - Select **Web application**
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (for development)
   - Add production redirect URI: `https://yourdomain.com/api/auth/callback/google` (for production)
   - Copy **Client ID** and **Client Secret**

2. Generate AUTH_SECRET:

   ```bash
   openssl rand -base64 32
   ```

3. Add credentials to `.env.local`:

   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   AUTH_SECRET=your_generated_secret
   ```

4. **Note**: This setup uses JWT strategy (no database). Sessions are stored in encrypted JWTs. Base API tokens are automatically refreshed when expired.

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

