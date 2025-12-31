// Re-export all stores for centralized imports
export { default as useCarouselStore } from "./useCarouselStore";
export { useNotificationStore } from "./useNotificationStore";
export { useEditorStore } from "./useEditorStore";
export { useSocialStore } from "./useSocialStore";

// Export store interfaces and types for use in components
export type {
  // Editor store types
  EditorMode,
  TextFormatting,
  ColorSettings,
  FontSettings,
  EditorInstance,
} from "./useEditorStore";

export type {
  // Social store types
  Comment,
  Post,
  User,
  PaginationState,
  FilterSettings,
} from "./useSocialStore";

// This centralized approach makes it easier to:
// 1. Import stores with a consistent pattern
// 2. Share types between components
// 3. Track all available stores in one place
