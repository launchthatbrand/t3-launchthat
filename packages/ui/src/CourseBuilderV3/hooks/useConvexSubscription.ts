import type { FunctionReference } from "convex/server";
import React from "react";
import { useQuery } from "convex/react";

// ============================================================================
// SUBSCRIPTION OPTIONS INTERFACE
// ============================================================================

export interface ConvexSubscriptionOptions<T> {
  enabled?: boolean;
  onData?: (data: T) => void;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
  retryOnError?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

// ============================================================================
// SUBSCRIPTION RESULT INTERFACE
// ============================================================================

export interface ConvexSubscriptionResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  retry: () => void;
  refetch: () => void;
}

// ============================================================================
// CONVEX SUBSCRIPTION HOOK
// ============================================================================

/**
 * Generic hook for managing Convex real-time subscriptions with enhanced features:
 * - Automatic error handling and retry logic
 * - Loading state management
 * - Lifecycle callbacks for data changes
 * - Proper cleanup on unmount
 *
 * @param query - Convex query function reference
 * @param args - Arguments for the query function
 * @param options - Configuration options for the subscription
 * @returns Subscription result with data, error state, and control functions
 */
export const useConvexSubscription = <TArgs, TData>(
  query: FunctionReference<"query", "public", TArgs, TData>,
  args: TArgs | "skip",
  options: ConvexSubscriptionOptions<TData> = {},
): ConvexSubscriptionResult<TData> => {
  const {
    enabled = true,
    onData,
    onError,
    onLoading,
    retryOnError = true,
    retryDelay = 1000,
    maxRetries = 3,
  } = options;

  // State for error handling and retry logic
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [forceRefetch, setForceRefetch] = React.useState(0);

  // Create args with force refetch parameter to trigger re-query
  const queryArgs = React.useMemo(() => {
    if (args === "skip" || !enabled) return "skip";

    // Include force refetch counter in args to trigger re-query
    // This is a workaround since Convex doesn't have a built-in refetch mechanism
    return { ...args, _forceRefetch: forceRefetch } as TArgs;
  }, [args, enabled, forceRefetch]);

  // Execute the Convex query
  const data = useQuery(query, queryArgs);
  const isLoading = data === undefined && error === null;

  // Handle data changes
  React.useEffect(() => {
    if (data !== undefined) {
      setError(null);
      setRetryCount(0);

      if (onData) {
        try {
          onData(data);
        } catch (callbackError) {
          console.error("Error in onData callback:", callbackError);
        }
      }
    }
  }, [data, onData]);

  // Handle loading state changes
  React.useEffect(() => {
    if (onLoading) {
      onLoading(isLoading);
    }
  }, [isLoading, onLoading]);

  // Error handling with retry logic
  React.useEffect(() => {
    if (data === undefined && !isLoading && enabled && args !== "skip") {
      // This might indicate an error state
      const errorTimeout = setTimeout(() => {
        if (data === undefined && retryOnError && retryCount < maxRetries) {
          console.warn(
            `Convex subscription failed, retrying... (${retryCount + 1}/${maxRetries})`,
          );
          setRetryCount((prev) => prev + 1);
          setForceRefetch((prev) => prev + 1);
        } else if (retryCount >= maxRetries) {
          const subscriptionError = new Error(
            `Convex subscription failed after ${maxRetries} retries`,
          );
          setError(subscriptionError);

          if (onError) {
            onError(subscriptionError);
          }
        }
      }, retryDelay);

      return () => clearTimeout(errorTimeout);
    }
  }, [
    data,
    isLoading,
    enabled,
    args,
    retryOnError,
    retryCount,
    maxRetries,
    retryDelay,
    onError,
  ]);

  // Manual retry function
  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
    setForceRefetch((prev) => prev + 1);
  }, []);

  // Manual refetch function
  const refetch = React.useCallback(() => {
    setForceRefetch((prev) => prev + 1);
  }, []);

  return {
    data,
    error,
    isLoading,
    retry,
    refetch,
  };
};

// ============================================================================
// COURSE-SPECIFIC SUBSCRIPTION HOOKS
// ============================================================================

/**
 * Hook specifically for subscribing to course structure changes
 */
export const useCourseStructureSubscription = (
  courseId: string,
  options: ConvexSubscriptionOptions<any> = {},
) => {
  // This will be implemented when we have the proper Convex API reference
  // For now, return a placeholder that matches the expected interface
  return React.useMemo(
    () => ({
      data: undefined,
      error: null,
      isLoading: true,
      retry: () => {},
      refetch: () => {},
    }),
    [courseId, options],
  );
};

/**
 * Hook for subscribing to available lessons changes
 */
export const useAvailableLessonsSubscription = (
  courseId: string,
  options: ConvexSubscriptionOptions<any> = {},
) => {
  return React.useMemo(
    () => ({
      data: undefined,
      error: null,
      isLoading: true,
      retry: () => {},
      refetch: () => {},
    }),
    [courseId, options],
  );
};

/**
 * Hook for subscribing to available topics changes
 */
export const useAvailableTopicsSubscription = (
  options: ConvexSubscriptionOptions<any> = {},
) => {
  return React.useMemo(
    () => ({
      data: undefined,
      error: null,
      isLoading: true,
      retry: () => {},
      refetch: () => {},
    }),
    [options],
  );
};

/**
 * Hook for subscribing to available quizzes changes
 */
export const useAvailableQuizzesSubscription = (
  options: ConvexSubscriptionOptions<any> = {},
) => {
  return React.useMemo(
    () => ({
      data: undefined,
      error: null,
      isLoading: true,
      retry: () => {},
      refetch: () => {},
    }),
    [options],
  );
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for batching multiple subscriptions and managing their combined loading state
 */
export const useBatchedSubscriptions = <
  T extends Record<string, ConvexSubscriptionResult<any>>,
>(
  subscriptions: T,
) => {
  const isLoading = React.useMemo(() => {
    return Object.values(subscriptions).some((sub) => sub.isLoading);
  }, [subscriptions]);

  const hasError = React.useMemo(() => {
    return Object.values(subscriptions).some((sub) => sub.error !== null);
  }, [subscriptions]);

  const errors = React.useMemo(() => {
    return Object.values(subscriptions)
      .map((sub) => sub.error)
      .filter((error): error is Error => error !== null);
  }, [subscriptions]);

  const retryAll = React.useCallback(() => {
    Object.values(subscriptions).forEach((sub) => sub.retry());
  }, [subscriptions]);

  const refetchAll = React.useCallback(() => {
    Object.values(subscriptions).forEach((sub) => sub.refetch());
  }, [subscriptions]);

  return {
    isLoading,
    hasError,
    errors,
    retryAll,
    refetchAll,
    subscriptions,
  };
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Expose subscription utilities to window for debugging
  (window as any).convexSubscriptionUtils = {
    useConvexSubscription,
    useBatchedSubscriptions,
  };
}
