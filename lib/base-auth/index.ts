// Purpose: Base API authentication module
// - Handles Base API authentication using Google OAuth tokens
// - Manages Base API tokens (access, refresh, expiration)
// - Provides request-scoped token storage
// - Separated from auth.ts to avoid circular dependency

export {
  authenticateWithBase,
  refreshBaseToken,
  shouldRefreshBaseToken,
} from "./auth";
export { clearBaseTokens, getBaseTokens, setBaseTokens } from "./context";
export { ensureBaseAuth, getBaseAccessTokenFromContext } from "./ensure";
