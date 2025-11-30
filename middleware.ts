// Purpose: NextAuth.js middleware for route protection
// - Protects /admin routes requiring authentication
// - Requires both Google OAuth and Base API access token
// - Redirects unauthenticated users to sign-in page
// - Allows public access to home and sign-in pages

import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  const publicRoutes = ["/", "/sign-in", "/api/webhook"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // Check if user is authenticated (has NextAuth session)
    if (!req.auth) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user has Base API access token (has permission to access Base)
    if (!req.auth.baseAccessToken) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      signInUrl.searchParams.set("error", "base_access_denied");
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
