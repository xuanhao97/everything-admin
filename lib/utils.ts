import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Purpose: Utility function for merging Tailwind CSS classes
// - Combines clsx and tailwind-merge for conditional class names
// - Handles Tailwind class conflicts properly
//
// Example:
// cn("px-2 py-1", "px-4") // Returns "py-1 px-4"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
