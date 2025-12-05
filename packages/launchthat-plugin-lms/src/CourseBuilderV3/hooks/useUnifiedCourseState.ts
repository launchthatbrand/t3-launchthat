// @ts-nocheck

import React from "react";

import type { SyncCourseStateOptions } from "./useSyncCourseState";
import { useUnifiedCourseStore } from "../store/useUnifiedCourseStore";
import { useSyncCourseState } from "./useSyncCourseState";

// ============================================================================
// UNIFIED COURSE STATE HOOK
// ============================================================================

export interface UseUnifiedCourseStateOptions extends SyncCourseStateOptions {
  // Course identification
  courseId: string;

  // Store initialization options
  autoInitialize?: boolean;
  resetOnCourseChange?: boolean;

  // Performance options
  enableOptimisticUpdates?: boolean;
  debounceMs?: number;
}

export interface UseUnifiedCourseStateResult {
  // Store state
  state: ReturnType<typeof useUnifiedCourseStore.getState>;

  // Store actions (categorized for convenience)
  structureActions: ReturnType<
    typeof useUnifiedCourseStore.getState
  >["structureActions"];
  contentActions: ReturnType<
    typeof useUnifiedCourseStore.getState
  >["contentActions"];
  uiActions: ReturnType<typeof useUnifiedCourseStore.getState>["uiActions"];
  syncActions: ReturnType<typeof useUnifiedCourseStore.getState>["syncActions"];

  // Convenience state selectors
  lessons: ReturnType<typeof useUnifiedCourseStore.getState>["lessons"];
  availableItems: ReturnType<
    typeof useUnifiedCourseStore.getState
  >["availableItems"];
  ui: ReturnType<typeof useUnifiedCourseStore.getState>["ui"];
  sync: ReturnType<typeof useUnifiedCourseStore.getState>["sync"];

  // Sync management
  isInitialized: boolean;
  isConnected: boolean;
  lastSyncTime: number | null;

  // Manual controls
  forceSync: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
}

export const useUnifiedCourseState = (
  options: UseUnifiedCourseStateOptions,
): UseUnifiedCourseStateResult => {
  const {
    courseId,
    autoInitialize = true,
    resetOnCourseChange = true,
    enableOptimisticUpdates = true,
    debounceMs = 300,
    ...syncOptions
  } = options;

  // ============================================================================
  // STORE STATE SUBSCRIPTION
  // ============================================================================

  // Subscribe to the entire store state
  const state = useUnifiedCourseStore();

  // Subscribe to specific slices for performance optimization
  const lessons = useUnifiedCourseStore((state) => state.lessons);
  const availableItems = useUnifiedCourseStore((state) => state.availableItems);
  const ui = useUnifiedCourseStore((state) => state.ui);
  const sync = useUnifiedCourseStore((state) => state.sync);

  // Subscribe to actions
  const structureActions = useUnifiedCourseStore(
    (state) => state.structureActions,
  );
  const contentActions = useUnifiedCourseStore((state) => state.contentActions);
  const uiActions = useUnifiedCourseStore((state) => state.uiActions);
  const syncActions = useUnifiedCourseStore((state) => state.syncActions);

  // ============================================================================
  // SYNC STATE MANAGEMENT
  // ============================================================================

  const {
    isInitialized,
    isConnected,
    lastSyncTime,
    forceSync,
    disconnect,
    reconnect,
  } = useSyncCourseState({
    courseId,
    ...syncOptions,
  });

  // ============================================================================
  // COURSE CHANGE HANDLING
  // ============================================================================

  const previousCourseId = React.useRef<string>();

  React.useEffect(() => {
    if (previousCourseId.current && previousCourseId.current !== courseId) {
      if (resetOnCourseChange) {
        // Reset store state when course changes
        syncActions.resetState();
      }
    }
    previousCourseId.current = courseId;
  }, [courseId, resetOnCourseChange, syncActions]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  React.useEffect(() => {
    if (autoInitialize && courseId && !isInitialized) {
      // Store will be initialized by useSyncCourseState
      console.log(
        `[useUnifiedCourseState] Auto-initializing for course: ${courseId}`,
      );
    }
  }, [autoInitialize, courseId, isInitialized]);

  // ============================================================================
  // OPTIMISTIC UPDATES CONFIGURATION
  // ============================================================================

  React.useEffect(() => {
    if (enableOptimisticUpdates !== sync.optimisticUpdatesEnabled) {
      syncActions.setOptimisticUpdatesEnabled(enableOptimisticUpdates);
    }
  }, [enableOptimisticUpdates, sync.optimisticUpdatesEnabled, syncActions]);

  // ============================================================================
  // RETURN UNIFIED INTERFACE
  // ============================================================================

  return {
    // Store state
    state,

    // Categorized actions
    structureActions,
    contentActions,
    uiActions,
    syncActions,

    // Convenience state selectors
    lessons,
    availableItems,
    ui,
    sync,

    // Sync management
    isInitialized,
    isConnected,
    lastSyncTime,
    forceSync,
    disconnect,
    reconnect,
  };
};

// ============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Hook for components that only need to read course state
 */
export const useUnifiedCourseStateReadonly = (courseId: string) => {
  return useUnifiedCourseState({
    courseId,
    enableRealTimeSubscriptions: true,
    enableMutations: false,
    enableOptimisticUpdates: false,
  });
};

/**
 * Hook for drag-and-drop components that need structure actions
 */
export const useUnifiedCourseStructure = (courseId: string) => {
  const { structureActions, lessons, ui, sync } = useUnifiedCourseState({
    courseId,
    enableRealTimeSubscriptions: true,
    enableMutations: true,
    enableOptimisticUpdates: true,
  });

  return {
    lessons,
    isDragging: ui.isDragging,
    draggedItem: ui.draggedItem,
    selectedItems: ui.selectedItems,
    hasUnsyncedChanges: sync.hasUnsyncedChanges,
    isLoading: sync.isLoading,

    // Structure actions
    addLesson: structureActions.addLesson,
    removeLesson: structureActions.removeLesson,
    reorderLessons: structureActions.reorderLessons,
    updateLesson: structureActions.updateLesson,
  };
};

/**
 * Hook for components that need available items management
 */
export const useUnifiedAvailableItems = (courseId: string) => {
  const { contentActions, availableItems, sync } = useUnifiedCourseState({
    courseId,
    enableRealTimeSubscriptions: true,
    enableMutations: true,
  });

  return {
    availableItems,
    isLoading: sync.isLoading,

    // Content actions
    attachLesson: contentActions.attachLesson,
    detachLesson: contentActions.detachLesson,
    addTopic: contentActions.addTopic,
    addQuiz: contentActions.addQuiz,
  };
};

/**
 * Hook for UI components that need drag state management
 */
export const useUnifiedCourseUI = () => {
  const { uiActions, ui } = useUnifiedCourseStore((state) => ({
    uiActions: state.uiActions,
    ui: state.ui,
  }));

  return {
    ui,
    setDragging: uiActions.setDragging,
    selectItems: uiActions.selectItems,
    clearSelection: uiActions.clearSelection,
    toggleSection: uiActions.toggleSection,
  };
};
