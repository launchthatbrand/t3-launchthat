"use client";

import { cn } from "@acme/ui";

type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-4",
};

interface LoadingSpinnerProps {
  className?: string;
  size?: SpinnerSize;
}

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "border-primary mb-4 animate-spin rounded-full border-t-transparent",
        sizeClasses[size],
        className,
      )}
    />
  );
}
