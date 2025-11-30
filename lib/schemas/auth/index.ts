import { z } from "zod";

// Purpose: Zod schemas for authentication service validation
// - Validates refresh token options input
// - Validates API response data structure

// Schema for refresh token options
export const refreshTokenOptionsSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token cannot be empty").optional(),
  cookie: z.string().optional(),
});

// Schema for successful API response data
export const refreshTokenDataSchema = z
  .object({
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    expires_in: z.number().optional(),
  })
  .passthrough(); // Allow additional fields

// Schema for API response structure
export const refreshTokenResponseSchema = z.object({
  success: z.boolean(),
  data: refreshTokenDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Schema for SSO Google options
export const ssoGoogleOptionsSchema = z.object({
  email: z.string().email("Invalid email address"),
  accessToken: z.string().min(1, "Access token cannot be empty"),
  cookie: z.string().optional(),
});

// Schema for SSO Google response data from Base API
// Response structure: { code, message, data, access_token, refresh_token, user, ... }
export const ssoGoogleDataSchema = z
  .object({
    code: z.number().optional(),
    message: z.string().optional(),
    data: z.unknown().nullable().optional(),
    httpCode: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    user: z
      .object({
        id: z.string().optional(),
        email: z.string().optional(),
        name: z.string().optional(),
        image: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough(); // Allow additional fields like system, client, emoji, etc.

// Schema for SSO Google response structure
export const ssoGoogleResponseSchema = z.object({
  success: z.boolean(),
  data: ssoGoogleDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Type exports
export type RefreshTokenOptions = z.infer<typeof refreshTokenOptionsSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenDataSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
export type SsoGoogleOptions = z.infer<typeof ssoGoogleOptionsSchema>;
export type SsoGoogleData = z.infer<typeof ssoGoogleDataSchema>;
export type SsoGoogleResponse = z.infer<typeof ssoGoogleResponseSchema>;
