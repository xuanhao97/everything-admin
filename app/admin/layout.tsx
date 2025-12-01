// Purpose: Admin layout route
// - Re-exports AdminLayout from components/layout
// - Next.js requires layout.tsx in app/admin directory

// Force dynamic rendering - requires authentication
export const dynamic = "force-dynamic";

export { default } from "@/components/layout/admin-layout";
