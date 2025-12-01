// Purpose: Utility function for Base API cookie
// - Gets Base API cookie from environment variable
// - Separated from base-api.ts to avoid circular dependency with auth

import { env } from "@/env";

/**
 * Gets Base API cookie from environment variable
 *
 * @returns Base API cookie or undefined
 */
export function getBaseCookie(): string | undefined {
  if (!env.BASE_ID) return undefined;
  return `baseid=${env.BASE_ID}`;
}
