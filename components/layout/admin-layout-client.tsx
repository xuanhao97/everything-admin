"use client";

// Purpose: Admin layout with sidebar navigation (Client Component)
// - Wraps admin pages with sidebar and header
// - Provides consistent layout structure
// - Uses SidebarProvider for sidebar state management
// - Includes navbar with breadcrumbs and user menu
// - Integrates with NextAuth.js for user authentication

import { Bell, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { Avatar } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Force dynamic rendering - this page requires authentication and session data
export const dynamic = "force-dynamic";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/sign-in" });
  };

  const displayName = session?.user?.name || session?.user?.email || "User";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 overflow-x-hidden">
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 shrink-0 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span
                className="absolute right-1 top-1 flex h-2 w-2"
                aria-hidden="true"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 shrink-0 min-w-0"
                  aria-label="User menu"
                  aria-haspopup="true"
                >
                  <Avatar
                    src={session?.user?.image}
                    alt={displayName}
                    size="md"
                    fallback={<User className="h-4 w-4" />}
                  />
                  <span className="hidden md:block truncate max-w-[120px]">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-6 md:pt-6 overflow-x-auto min-w-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
