// Purpose: Sign-in page with custom Google OAuth component
// - Uses custom SignInForm component instead of Clerk's default
// - Custom UI with shadcn/ui components
// - Only supports Google OAuth (must be enabled in Clerk Dashboard)
// - Redirects to /admin after successful sign-in
//
// Note: To restrict to Google OAuth only:
// 1. Go to Clerk Dashboard > User & Authentication > Social Connections
// 2. Enable Google OAuth
// 3. Disable email/password and other OAuth providers

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignInForm redirectUrl="/admin" />
    </div>
  );
}
