import { ReactNode } from "react";

/**
 * Possible view modes for the EntityList
 * - list: Traditional table-like view
 * - grid: Card-based grid layout
 */
export type ViewMode = "list" | "grid";

/**
 * Configuration for a column in the EntityList
 * @template T - The type of data being displayed
 */
export interface ColumnDefinition<T> {
  /** Unique identifier for the column */
  id: string;

  /** Header text to display for the column */
  header: string;

  /** Key in T to access the data for this column (optional if using cell renderer) */
  accessorKey?: keyof T;

  /** Custom cell renderer function (optional) */
  cell?: (item: T) => ReactNode;

  /** Whether this column can be sorted */
  sortable?: boolean;
}

/**
 * Configuration for a filter option in the EntityList
 * @template T - The type of data being filtered
 */
export interface FilterConfig<T> {
  /** Unique identifier for the filter */
  id: string;

  /** Display label for the filter */
  label: string;

  /** Type of input to use for the filter */
  type: "text" | "select" | "date" | "boolean" | "number";

  /** Options for select-type filters */
  options?: { label: string; value: string | number | boolean }[];

  /** Field to filter on - either a key in T or a function that returns boolean */
  field: keyof T | ((item: T) => boolean);
}

/**
 * Configuration for an action that can be performed on an entity
 * @template T - The type of entity the action applies to
 */
export interface EntityAction<T> {
  /** Unique identifier for the action */
  id: string;

  /** Display label for the action (string or function that returns a string) */
  label: string | ((item: T) => string);

  /** Icon to display with the action (optional) */
  icon?: ReactNode;

  /** Handler function for the action */
  onClick: (item: T) => void;

  /** Whether the action should be disabled */
  isDisabled?: boolean | ((item: T) => boolean);

  /** Visual variant of the action (maps to button variants) */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
}

/**
 * Configuration for sorting
 */
export interface SortConfig {
  /** The column ID to sort by */
  id: string;

  /** Sort direction */
  direction: "asc" | "desc";
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page index (0-based) */
  pageIndex: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages */
  pageCount: number;

  /** Handler for page changes */
  onPageChange: (page: number) => void;

  /** Handler for page size changes (optional) */
  onPageSizeChange?: (size: number) => void;
}

/**
 * Props for the EntityList component
 * @template T - The type of data being displayed (must be an object)
 */
export interface EntityListProps<T extends object> {
  /** Array of data items to display */
  data: T[];

  /** Column configurations */
  columns: ColumnDefinition<T>[];

  /** Filter configurations (optional) */
  filters?: FilterConfig<T>[];

  /** Whether the data is currently loading */
  isLoading?: boolean;

  /** Error state (optional) */
  error?: string | Error | null;

  /** Available view modes (default: ["list", "grid"]) */
  viewModes?: ViewMode[];

  /** Default view mode (default: "list") */
  defaultViewMode?: ViewMode;

  /** Title for the list (optional) */
  title?: string;

  /** Description text (optional) */
  description?: string;

  /** Handler for row/item clicks (optional) */
  onRowClick?: (item: T) => void;

  /** UI elements for actions like "Add" button (optional) */
  actions?: ReactNode;

  /** Custom empty state UI (optional) */
  emptyState?: ReactNode;

  /** Pagination configuration (optional) */
  pagination?: PaginationConfig;

  /** Entity actions configuration (optional) */
  entityActions?: EntityAction<T>[];

  /** Initial sort configuration (optional) */
  initialSort?: SortConfig;

  /** Hide the built-in filters section (default: false) */
  hideFilters?: boolean;

  /** Initial filter values */
  initialFilters?: Record<string, FilterValue>;

  /** Handler for filter changes (optional) */
  onFiltersChange?: (filters: Record<string, FilterValue>) => void;
}

/**
 * Props for the EntityListHeader component
 */
export interface EntityListHeaderProps {
  /** Title for the list (optional) */
  title?: string;

  /** Description text (optional) */
  description?: string;

  /** Current search term */
  searchTerm: string;

  /** Handler for search term changes */
  onSearchChange: (value: string) => void;

  /** Current view mode */
  viewMode: ViewMode;

  /** Available view modes */
  viewModes: ViewMode[];

  /** Handler for view mode changes */
  onViewModeChange: (mode: ViewMode) => void;

  /** UI elements for actions (optional) */
  actions?: ReactNode;

  /** Whether search is currently in progress */
  isSearching?: boolean;
}

/**
 * Allowed filter value types
 */
export type FilterValue = string | number | boolean | Date | null;

/**
 * Props for the EntityListFilters component
 * @template T - The type of data being filtered
 */
export interface EntityListFiltersProps<T> {
  /** Filter configurations */
  filters: FilterConfig<T>[];

  /** Currently active filters */
  activeFilters: Record<string, FilterValue>;

  /** Handler for filter changes */
  onFilterChange: (filters: Record<string, FilterValue>) => void;
}

/**
 * Props for the EntityListView component
 * @template T - The type of data being displayed
 */
export interface EntityListViewProps<T extends object> {
  /** Array of data items to display */
  data: T[];

  /** Column configurations */
  columns: ColumnDefinition<T>[];

  /** Current view mode */
  viewMode: ViewMode;

  /** Whether the data is currently loading */
  isLoading?: boolean;

  /** Handler for row/item clicks (optional) */
  onRowClick?: (item: T) => void;

  /** Custom empty state UI (optional) */
  emptyState?: ReactNode;

  /** Entity actions configuration (optional) */
  entityActions?: EntityAction<T>[];

  /** Current sort configuration (optional) */
  sortConfig?: SortConfig;

  /** Handler for sort changes (optional) */
  onSortChange?: (config: SortConfig) => void;
}

/**
 * Props for the EntityListPagination component
 */
export interface EntityListPaginationProps {
  /** Current page index (0-based) */
  pageIndex: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages */
  pageCount: number;

  /** Handler for page changes */
  onPageChange: (page: number) => void;

  /** Handler for page size changes (optional) */
  onPageSizeChange?: (size: number) => void;
}

export interface EntityListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  timestamp?: number;
  status?: string;
  image?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  };
  icon?: React.ReactNode;
  metadata?: Record<string, unknown>;
  actions?: EntityItemAction[];
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

export interface EntityItemAction {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  onClick: (id: string) => void;
  isDisabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}
