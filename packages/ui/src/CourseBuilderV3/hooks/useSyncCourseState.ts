import type {
  ConvexCourseStructure,
  ConvexLesson,
  ConvexQuiz,
  ConvexTopic,
} from "../utils/dataTransformers";
import {
  safeTransformCourseStructure,
  transformAvailableLessons,
  transformAvailableQuizzes,
  transformAvailableTopics,
  transformCourseStructure,
} from "../utils/dataTransformers";

import type { ConvexSubscriptionOptions } from "./useConvexSubscription";
import React from "react";
import { useUnifiedCourseStore } from "../store/useUnifiedCourseStore";

// ============================================================================
// SYNC STATE INTERFACE
// ============================================================================

export interface SyncCourseStateOptions {
  // Subscription options
  enableRealTime?: boolean;
  syncInterval?: number;
  maxRetries?: number;

  // Lifecycle callbacks
  onInitialLoad?: () => void;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;

  // Data handling
  autoSync?: boolean;
  conflictResolution?: "local" | "remote" | "merge";
}

export interface SyncCourseStateResult {
  isInSync: boolean;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  hasErrors: boolean;
  errors: Error[];

  // Manual control functions
  forceSync: () => Promise<void>;
  retryFailedUpdates: () => Promise<void>;
  clearErrors: () => void;

  // Connection state
  isConnected: boolean;
  connectionQuality: "excellent" | "good" | "poor" | "offline";
}

// ============================================================================
// MAIN SYNC HOOK
// ============================================================================

/**
 * Hook that manages the complete synchronization lifecycle between
 * Zustand store and Convex real-time subscriptions
 */
export const useSyncCourseState = (
  courseId: string,
  options: SyncCourseStateOptions = {},
): SyncCourseStateResult => {
  const {
    enableRealTime = true,
    syncInterval = 30000, // 30 seconds
    maxRetries = 3,
    onInitialLoad,
    onSyncStart,
    onSyncComplete,
    onSyncError,
    autoSync = true,
    conflictResolution = "remote", // Default to remote wins
  } = options;

  // Get store actions and state
  const store = useUnifiedCourseStore();
  const syncActions = useUnifiedCourseStore((state) => state.actions.sync);
  const hasUnsyncedChanges = useUnifiedCourseStore(
    (state) => state.sync.hasUnsyncedChanges,
  );

  // Local state for sync management
  const [errors, setErrors] = React.useState<Error[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [connectionQuality, setConnectionQuality] = React.useState<
    "excellent" | "good" | "poor" | "offline"
  >("excellent");

  // Refs for cleanup and intervals
  const syncIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // ================================================================
  // CORE SYNC FUNCTIONS
  // ================================================================

  const addError = React.useCallback(
    (error: Error) => {
      setErrors((prev) => [...prev, error]);
      if (onSyncError) {
        onSyncError(error);
      }
    },
    [onSyncError],
  );

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const forceSync = React.useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    if (onSyncStart) onSyncStart();

    try {
      // TODO: Implement actual Convex query calls here
      // This is a placeholder that will be replaced with real Convex subscriptions

      // Simulate sync operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      syncActions.markSynced();

      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      const syncError =
        error instanceof Error ? error : new Error("Sync failed");
      addError(syncError);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, syncActions, onSyncStart, onSyncComplete, addError]);

  const retryFailedUpdates = React.useCallback(async () => {
    try {
      await syncActions.retryFailedUpdates();
      clearErrors();
    } catch (error) {
      const retryError =
        error instanceof Error ? error : new Error("Retry failed");
      addError(retryError);
    }
  }, [syncActions, addError, clearErrors]);

  // ================================================================
  // PERIODIC SYNC SETUP
  // ================================================================

  React.useEffect(() => {
    if (!autoSync || !enableRealTime) return;

    // Set up periodic sync for unsynced changes
    syncIntervalRef.current = setInterval(() => {
      if (hasUnsyncedChanges && !isSyncing) {
        forceSync();
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [
    autoSync,
    enableRealTime,
    hasUnsyncedChanges,
    isSyncing,
    forceSync,
    syncInterval,
  ]);

  // ================================================================
  // INITIAL LOAD EFFECT
  // ================================================================

  React.useEffect(() => {
    if (courseId && onInitialLoad) {
      onInitialLoad();
    }
  }, [courseId, onInitialLoad]);

  // ================================================================
  // CONNECTION QUALITY MONITORING
  // ================================================================

  React.useEffect(() => {
    // Monitor connection quality based on sync success/failure
    const updateConnectionQuality = () => {
      if (errors.length === 0) {
        setConnectionQuality("excellent");
      } else if (errors.length <= 2) {
        setConnectionQuality("good");
      } else if (errors.length <= 5) {
        setConnectionQuality("poor");
      } else {
        setConnectionQuality("offline");
      }
    };

    updateConnectionQuality();
  }, [errors.length]);

  // ================================================================
  // CLEANUP
  // ================================================================

  React.useEffect(() => {
    return () => {
      // Cleanup intervals and timeouts
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ================================================================
  // RETURN SYNC STATE
  // ================================================================

  return {
    isInSync: !hasUnsyncedChanges && errors.length === 0,
    lastSyncedAt: store.sync.lastSyncedAt,
    isSyncing,
    hasErrors: errors.length > 0,
    errors,
    forceSync,
    retryFailedUpdates,
    clearErrors,
    isConnected: connectionQuality !== "offline",
    connectionQuality,
  };
};

// ============================================================================
// COURSE DATA SUBSCRIPTION HOOK
// ============================================================================

/**
 * Hook that manages real-time subscriptions for course data
 * This will be enhanced when Convex API is fully integrated
 */
export const useCourseDataSubscription = (
  courseId: string,
  options: ConvexSubscriptionOptions<any> = {},
) => {
  const store = useUnifiedCourseStore();

  // State for managing subscriptions
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [subscriptionErrors, setSubscriptionErrors] = React.useState<Error[]>(
    [],
  );

  // Handle course structure updates
  const handleCourseStructureUpdate = React.useCallback(
    (data: ConvexCourseStructure) => {
      try {
        const transformedData = safeTransformCourseStructure(data);
        if (transformedData) {
          store.initialize(courseId, {
            courseId: transformedData.courseId,
            title: transformedData.title,
            description: transformedData.description,
            lessons: transformedData.lessons,
          });
        }
      } catch (error) {
        const transformError =
          error instanceof Error ? error : new Error("Transform failed");
        setSubscriptionErrors((prev) => [...prev, transformError]);
      }
    },
    [courseId, store],
  );

  // Handle available lessons updates
  const handleAvailableLessonsUpdate = React.useCallback(
    (data: ConvexLesson[]) => {
      try {
        const transformedLessons = transformAvailableLessons(data);
        // Update the store with new available lessons
        // This will be implemented when store has the proper update method
        console.log("Available lessons updated:", transformedLessons);
      } catch (error) {
        const transformError =
          error instanceof Error ? error : new Error("Transform failed");
        setSubscriptionErrors((prev) => [...prev, transformError]);
      }
    },
    [],
  );

  // Set up subscription lifecycle
  React.useEffect(() => {
    if (courseId) {
      setIsSubscribed(true);

      // TODO: Set up actual Convex subscriptions here
      // This is a placeholder for the real implementation

      return () => {
        setIsSubscribed(false);
      };
    }
  }, [courseId]);

  return {
    isSubscribed,
    subscriptionErrors,
    clearSubscriptionErrors: () => setSubscriptionErrors([]),
  };
};

// ============================================================================
// BATCH SYNC HOOK
// ============================================================================

/**
 * Hook for managing multiple course subscriptions simultaneously
 */
export const useBatchCourseSync = (courseIds: string[]) => {
  const [syncStates, setSyncStates] = React.useState<
    Record<string, SyncCourseStateResult>
  >({});

  // Create sync state for each course
  React.useEffect(() => {
    const newSyncStates: Record<string, SyncCourseStateResult> = {};

    courseIds.forEach((courseId) => {
      // This would use useSyncCourseState for each course
      // For now, just create placeholder states
      newSyncStates[courseId] = {
        isInSync: true,
        lastSyncedAt: new Date(),
        isSyncing: false,
        hasErrors: false,
        errors: [],
        forceSync: async () => {},
        retryFailedUpdates: async () => {},
        clearErrors: () => {},
        isConnected: true,
        connectionQuality: "excellent",
      };
    });

    setSyncStates(newSyncStates);
  }, [courseIds]);

  const syncAll = React.useCallback(async () => {
    const promises = Object.values(syncStates).map((state) =>
      state.forceSync(),
    );
    await Promise.all(promises);
  }, [syncStates]);

  const hasAnyErrors = React.useMemo(() => {
    return Object.values(syncStates).some((state) => state.hasErrors);
  }, [syncStates]);

  const isAnySyncing = React.useMemo(() => {
    return Object.values(syncStates).some((state) => state.isSyncing);
  }, [syncStates]);

  return {
    syncStates,
    syncAll,
    hasAnyErrors,
    isAnySyncing,
  };
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Expose sync utilities to window for debugging
  (window as any).courseSyncUtils = {
    useSyncCourseState,
    useCourseDataSubscription,
    useBatchCourseSync,
  };
}
