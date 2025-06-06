"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";

import type {
  ColumnDefinition,
  EntityAction,
  EntityListItem,
  EntityListProps,
  FilterConfig,
  FilterValue,
  SortConfig,
  ViewMode,
} from "./types";
import { EntityListFilters } from "./EntityListFilters";
import { EntityListHeader } from "./EntityListHeader";
import { EntityListPagination } from "./EntityListPagination";
import { EntityListView } from "./EntityListView";

/**
 * EntityList is a universal component for displaying collections of data
 * with features like search, filtering, pagination, and switchable views.
 *
 * @template T - The type of data items being displayed (must be an object)
 */
export function EntityList<T extends object>({
  data,
  columns,
  filters,
  isLoading = false,
  viewModes = ["list", "grid"],
  defaultViewMode = "list",
  title,
  description,
  onRowClick,
  actions,
  emptyState,
  pagination,
  entityActions,
  initialSort,
  error,
  hideFilters = false,
  initialFilters = {},
  onFiltersChange,
}: EntityListProps<T>) {
  // State for view mode
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for active filters
  const [activeFilters, setActiveFilters] =
    useState<Record<string, FilterValue>>(initialFilters);

  // State for sorting
  const [sorting, setSorting] = useState<SortConfig | undefined>(initialSort);

  // Handle search term changes with isSearching state
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);

    // Clear search state after a short delay to show loading indicator
    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  };

  // Clear isSearching state when data changes
  useEffect(() => {
    setIsSearching(false);
  }, [data]);

  // Sync with external filter changes
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setActiveFilters(initialFilters);
    }
  }, [initialFilters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);

    // Notify parent component if callback provided
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // Filter data based on search term and active filters
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let filtered = [...data];

    // Apply search filter if searchTerm is provided
    if (searchTerm.trim()) {
      const lowercasedTerm = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        // Search through all accessible fields (columns with accessorKey)
        return columns.some((column) => {
          if (!column.accessorKey) return false;
          const value = item[column.accessorKey];
          return (
            value != null &&
            String(value).toLowerCase().includes(lowercasedTerm)
          );
        });
      });
    }

    // Apply active filters
    if (Object.keys(activeFilters).length > 0 && filters?.length) {
      Object.entries(activeFilters).forEach(([filterId, filterValue]) => {
        const filterConfig = filters.find((f) => f.id === filterId);
        if (!filterConfig) return;

        filtered = filtered.filter((item) => {
          if (typeof filterConfig.field === "function") {
            // If field is a function, use it to filter
            return filterConfig.field(item);
          } else {
            // Otherwise filter by matching the field value
            const itemValue = item[filterConfig.field as keyof typeof item];
            return itemValue === filterValue;
          }
        });
      });
    }

    return filtered;
  }, [data, searchTerm, activeFilters, columns, filters]);

  // Handle sorting change
  const handleSortChange = (newSortConfig: SortConfig) => {
    setSorting(newSortConfig);
  };

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {typeof error === "string"
            ? error
            : "An error occurred while loading data."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title, search, and view toggles */}
      <EntityListHeader
        title={title}
        description={description}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        viewModes={viewModes}
        onViewModeChange={setViewMode}
        actions={actions}
        isSearching={isSearching || isLoading}
      />

      {/* Filters section */}
      {filters && filters.length > 0 && !hideFilters && (
        <EntityListFilters
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Main content - list or grid view */}
      <EntityListView
        data={filteredData}
        columns={columns}
        viewMode={viewMode}
        isLoading={isLoading}
        onRowClick={onRowClick}
        emptyState={emptyState}
        entityActions={entityActions}
        sortConfig={sorting}
        onSortChange={handleSortChange}
      />

      {/* Pagination controls */}
      {pagination && <EntityListPagination {...pagination} />}
    </div>
  );
}

// Re-export types for ease of use
export type {
  ColumnDefinition,
  EntityAction,
  EntityListProps,
  FilterConfig,
  FilterValue,
  SortConfig,
  ViewMode,
  EntityListItem,
};

interface SimpleEntityListProps {
  items: EntityListItem[];
  onItemClick?: (id: string) => void;
  keyField?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function SimpleEntityList({
  items,
  onItemClick,
  keyField = "id",
  emptyMessage = "No items found",
  isLoading = false,
}: SimpleEntityListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item[keyField] as string}
              className="border-b transition-colors hover:bg-muted/50"
              onClick={() => onItemClick?.(item.id)}
              style={{ cursor: onItemClick ? "pointer" : "default" }}
            >
              <td className="px-4 py-3">
                <div className="font-medium">{item.title}</div>
                {item.subtitle && (
                  <div className="text-xs text-muted-foreground">
                    {item.subtitle}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {item.status && (
                  <Badge
                    variant={
                      item.status === "active" || item.status === "connected"
                        ? "default"
                        : item.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatTime(item.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
