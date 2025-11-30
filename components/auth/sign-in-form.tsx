"use client";

// Purpose: Custom sign-in form component with Google OAuth
// - Uses NextAuth.js for authentication
// - Custom UI with shadcn/ui components
// - Only supports Google OAuth
// - Handles loading states and error messages
//
// Example:
// <SignInForm redirectUrl="/admin" />

import { AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SignInFormProps {
  redirectUrl?: string;
}

// Purpose: Get error message from error code
function getErrorMessage(error?: string | null): string | null {
  if (!error) return null;

  switch (error) {
    case "base_access_denied":
      return "You do not have permission to access Base API. Please contact your administrator.";
    case "Configuration":
      return "There is a problem with the server configuration.";
    case "AccessDenied":
      return "You do not have permission to sign in.";
    case "Verification":
      return "The verification token has expired or has already been used.";
    case "OAuthSignin":
      return "Error in constructing an authorization URL.";
    case "OAuthCallback":
      return "Error in handling the response from an OAuth provider.";
    case "OAuthCreateAccount":
      return "Could not create OAuth account in the database.";
    case "EmailCreateAccount":
      return "Could not create email account in the database.";
    case "Callback":
      return "Error in the OAuth callback handler route.";
    case "OAuthAccountNotLinked":
      return "Email on the account is already linked, but not with this OAuth account.";
    case "EmailSignin":
      return "Sending the e-mail with the verification token failed.";
    case "CredentialsSignin":
      return "The credentials provided are not correct.";
    case "SessionRequired":
      return "You must be signed in to view this page.";
    default:
      return "An error occurred during authentication. Please try again.";
  }
}

export function SignInForm({ redirectUrl = "/admin" }: SignInFormProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams.get("error");
  const errorMessage = getErrorMessage(error);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const callbackUrl = searchParams.get("callbackUrl") || redirectUrl;

    try {
      // Use NextAuth.js to sign in with Google
      await signIn("google", {
        callbackUrl,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
        <CardDescription>Sign in to access the admin dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div
            className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium">Authentication Error</p>
              <p className="mt-1 text-destructive/80">{errorMessage}</p>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
