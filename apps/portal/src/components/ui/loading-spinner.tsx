"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   */
  size?: SpinnerSize;
  /**
   * Custom class name
   */
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

/**
 * A loading spinner component to indicate loading state
 */
export const LoadingSpinner = ({
  size = "md",
  className,
}: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center">
      <Loader2
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className,
        )}
      />
    </div>
  );
};

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
  size?: SpinnerSize;
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
