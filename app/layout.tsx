// Purpose: Root layout with providers
// - Wraps application with client-side providers
// - Provides session context to all components

import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Base Admin",
  description: "Base Admin - Fullstack Next.js Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
