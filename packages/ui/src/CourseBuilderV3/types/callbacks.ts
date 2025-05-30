/**
 * Callback type for when a course item is clicked.
 */
export type OnItemClick = (itemId: string, itemType: string) => void;

/**
 * Callback type for when a module is expanded or collapsed.
 */
export type OnModuleExpand = (moduleId: string, expanded: boolean) => void;

/**
 * Renderer prop type for rendering a content item.
 * Should return a React node for the given item.
 */
export type ContentItemRenderer<T = unknown> = (item: T) => React.ReactNode;

/**
 * Renderer prop type for rendering a sidebar item.
 * Should return a React node for the given sidebar item.
 */
export type SidebarItemRenderer<T = unknown> = (item: T) => React.ReactNode;

/**
 * Generic event handler type for UI events.
 */
export type EventHandler<T = unknown> = (event: T) => void;

/**
 * Callback type for drag-and-drop operations.
 */
export type OnDragEnd = (
  sourceId: string,
  destinationId: string | null,
  itemType: string,
) => void;
