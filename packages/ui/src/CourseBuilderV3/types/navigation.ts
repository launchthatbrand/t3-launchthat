/**
 * Represents the state of a sidebar item (active, completed, locked).
 */
export type SidebarItemState = "active" | "completed" | "locked";

/**
 * Represents an item in the course navigation sidebar.
 */
export interface SidebarItem {
  /** Unique identifier for the sidebar item */
  id: string;
  /** Display label for the sidebar item */
  label: string;
  /** Type of the sidebar item (lesson, topic, quiz, etc.) */
  type: "lesson" | "topic" | "quiz";
  /** State of the sidebar item */
  state: SidebarItemState;
  /** Optional: Nested children for hierarchical navigation */
  children?: SidebarItem[];
}

/**
 * Represents a breadcrumb navigation element.
 */
export interface Breadcrumb {
  /** Unique identifier for the breadcrumb */
  id: string;
  /** Display label for the breadcrumb */
  label: string;
  /** Optional: Link target for navigation */
  href?: string;
}

/**
 * Represents a progress indicator for navigation or completion.
 */
export interface ProgressIndicator {
  /** Total number of items */
  total: number;
  /** Number of completed items */
  completed: number;
}

/**
 * Represents the state of a collapsible or expandable UI control.
 */
export interface CollapsibleState {
  /** Whether the item is expanded */
  expanded: boolean;
  /** Optional: Unique identifier for the collapsible item */
  id?: string;
}
