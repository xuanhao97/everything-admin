// Purpose: Server component layout wrapper for admin routes
// - Ensures Base API authentication before rendering admin layout
// - Wraps client-side admin layout

import { ensureBaseAuth } from "@/lib/base-auth";

import AdminLayoutClient from "./admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure Base API authentication
  // This will authenticate with Base API if needed and store tokens in request context
  await ensureBaseAuth();

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
