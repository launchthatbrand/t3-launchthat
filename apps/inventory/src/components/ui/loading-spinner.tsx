"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn(sizeClass[size], "animate-spin text-primary")} />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}

/**
 * A loading spinner with text
 */
export const LoadingSpinnerWithText = ({
  size = "md",
  className,
  text = "Loading...",
}: LoadingSpinnerProps & { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <LoadingSpinner size={size} className={className} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
};

/**
 * A fullscreen loading spinner
 */
export const FullScreenLoader = ({
  size = "lg",
  text,
}: {
  size?: "sm" | "md" | "lg";
  text?: string;
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {text ? (
        <LoadingSpinnerWithText size={size} text={text} />
      ) : (
        <LoadingSpinner size={size} />
      )}
    </div>
  );
};
