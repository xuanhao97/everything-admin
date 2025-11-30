// Purpose: Client-side providers wrapper
// - Wraps application with NextAuth.js SessionProvider
// - Enables session access in client components

"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
