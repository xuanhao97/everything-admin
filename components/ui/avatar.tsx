import { User } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// Purpose: Avatar component for displaying user avatars
// - Shows user image if available, otherwise shows fallback icon
// - Supports different sizes
// - Handles image loading errors gracefully

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", sizeClasses[size])}
          onError={() => setImgError(true)}
        />
      ) : (
        fallback || <User className={cn("h-1/2 w-1/2", sizeClasses[size])} />
      )}
    </div>
  );
}

// Purpose: Avatar group for displaying multiple avatars
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string | null; alt?: string; username?: string }>;
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = "md",
  className,
  ...props
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt || avatar.username || `Avatar ${index + 1}`}
          size={size}
          className="border-2 border-background"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground border-2 border-background font-medium text-xs",
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
