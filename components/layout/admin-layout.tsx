// Purpose: Server component layout wrapper for admin routes
// - Ensures Base API authentication before rendering admin layout
// - Uses Suspense to allow streaming while auth is being verified
// - Tokens are stored in AsyncLocalStorage and accessible to all nested components

import { Suspense } from "react";

import { LoadingFullscreen } from "@/components/ui/loading-spinner";
import { ensureBaseAuth } from "@/lib/base-auth";

import AdminLayoutClient from "./admin-layout-client";

// Auth check component that runs in parallel with children
// This allows streaming: layout renders immediately, auth check happens in background
async function AuthWrapper({ children }: { children: React.ReactNode }) {
  // Ensure Base API authentication
  // This will authenticate with Base API if needed and store tokens in request context
  // Tokens are stored using AsyncLocalStorage.enterWith() which makes them available
  // to all async operations in the current async context chain
  await ensureBaseAuth();

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <LoadingFullscreen variant="spinner" size="lg" showText={true} />
      }
    >
      <AuthWrapper>{children}</AuthWrapper>
    </Suspense>
  );
}
