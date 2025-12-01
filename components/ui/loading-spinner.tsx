"use client";

// Purpose: Loading spinner component with framer-motion animations
// - Provides smooth, animated loading indicator
// - Supports different sizes and variants
// - Uses framer-motion for fluid animations
//
// Example:
// <LoadingSpinner />
// <LoadingSpinner size="lg" />
// <LoadingSpinner variant="dots" />

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

// Purpose: Spinner variant - rotating circle
function SpinnerVariant({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <motion.div
      className={cn(
        "rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size]
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Purpose: Dots variant - bouncing dots
function DotsVariant({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dotSize =
    size === "sm" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5";
  const gap = size === "sm" ? "gap-1" : size === "lg" ? "gap-2" : "gap-1.5";

  return (
    <div className={cn("flex items-center", gap)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn("rounded-full bg-primary", dotSize)}
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Purpose: Pulse variant - pulsing circle
function PulseVariant({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <motion.div
      className={cn("rounded-full bg-primary", sizeClasses[size])}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Purpose: Animated text component for "Everything Admin" with running effect
function AnimatedText() {
  const text = "Everything Admin";
  const letters = text.split("");

  return (
    <div className="relative flex items-center justify-center overflow-hidden">
      <motion.div
        className="flex items-center gap-0.5"
        animate={{
          x: [0, -100, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            className="inline-block text-primary font-semibold text-lg"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export function LoadingSpinner({
  size = "md",
  variant = "spinner",
  className,
  showText = true,
}: LoadingSpinnerProps & { showText?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
      {variant === "spinner" && <SpinnerVariant size={size} />}
      {variant === "dots" && <DotsVariant size={size} />}
      {variant === "pulse" && <PulseVariant size={size} />}
      {showText && <AnimatedText />}
    </div>
  );
}

// Purpose: Fullscreen loading component
// - Covers entire viewport with loading spinner
// - Provides backdrop overlay
// - Centered spinner with optional text
//
// Example:
// <LoadingFullscreen />
// <LoadingFullscreen variant="dots" />
interface LoadingFullscreenProps {
  variant?: "spinner" | "dots" | "pulse";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function LoadingFullscreen({
  variant = "spinner",
  size = "lg",
  showText = true,
  className,
}: LoadingFullscreenProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
      <LoadingSpinner
        size={size}
        variant={variant}
        showText={showText}
        className="bg-background/95 rounded-lg p-8 shadow-lg"
      />
    </div>
  );
}
