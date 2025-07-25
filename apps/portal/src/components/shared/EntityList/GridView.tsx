"use client";

import { useMemo } from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";

import type { ColumnDefinition, EntityAction } from "./types";

export interface GridViewProps<T extends object> {
  /** Data to display in the grid */
  data: T[];

  /** Column definitions to render in each card */
  columns: ColumnDefinition<T>[];

  /** Optional handler for card clicks */
  onCardClick?: (item: T) => void;

  /** Actions that can be performed on each entity */
  entityActions?: EntityAction<T>[];

  /** Number of columns at different breakpoints */
  gridColumns?: {
    sm?: number; // Small screens (default: 1)
    md?: number; // Medium screens (default: 2)
    lg?: number; // Large screens (default: 3)
    xl?: number; // Extra large screens (default: 4)
  };

  /** Whether to display a checkbox for card selection */
  selectable?: boolean;

  /** Currently selected card IDs */
  selectedIds?: string[];

  /** Handler for selection changes */
  onSelectionChange?: (ids: string[]) => void;

  /** ID field in data items (for selection) */
  idField?: keyof T;

  /** Custom renderer for card content (optional) */
  cardRenderer?: (item: T) => React.ReactNode;
}

/**
 * GridView renders data in a responsive card-based grid layout.
 *
 * @template T - The type of data items being displayed (must be an object)
 */
export function GridView<T extends object>({
  data,
  columns,
  onCardClick,
  entityActions,
  gridColumns = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  idField = "id" as keyof T,
  cardRenderer,
}: GridViewProps<T>) {
  // Generate responsive grid classes based on gridColumns
  const gridClasses = useMemo(() => {
    const classes = ["grid", "gap-4"];

    classes.push(`grid-cols-1`); // Default for extra small screens

    if (gridColumns.sm) {
      classes.push(`sm:grid-cols-${gridColumns.sm}`);
    }

    if (gridColumns.md) {
      classes.push(`md:grid-cols-${gridColumns.md}`);
    }

    if (gridColumns.lg) {
      classes.push(`lg:grid-cols-${gridColumns.lg}`);
    }

    if (gridColumns.xl) {
      classes.push(`xl:grid-cols-${gridColumns.xl}`);
    }

    return classes.join(" ");
  }, [gridColumns]);

  // Handle card selection toggle
  const handleSelectCard = (item: T) => {
    if (!onSelectionChange || !idField) return;

    const id = String(item[idField]);
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];

    onSelectionChange(newSelectedIds);
  };

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {data.map((item, index) => {
        if (cardRenderer) {
          return (
            <div
              key={index}
              onClick={() => onCardClick && onCardClick(item)}
              className="cursor-pointer"
            >
              {cardRenderer(item)}
            </div>
          );
        }
        return (
          <Card
            key={index}
            className={
              onCardClick
                ? "cursor-pointer transition-shadow hover:shadow-md"
                : ""
            }
            onClick={() => onCardClick && onCardClick(item)}
          >
            {selectable && (
              <div className="absolute right-2 top-2 z-10">
                <Checkbox
                  checked={selectedIds.includes(String(item[idField]))}
                  onCheckedChange={() => handleSelectCard(item)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Select item"
                />
              </div>
            )}

            {cardRenderer ? (
              // Use custom card renderer if provided
              cardRenderer(item)
            ) : (
              <>
                <CardHeader className="pb-2">
                  {/* Use the first column as a title */}
                  {columns[0] && (
                    <h3 className="text-lg font-semibold">
                      {columns[0].cell
                        ? columns[0].cell(item)
                        : columns[0].accessorKey
                          ? String(item[columns[0].accessorKey] ?? "")
                          : ""}
                    </h3>
                  )}
                </CardHeader>

                <CardContent className="space-y-2 pb-4">
                  {/* Render other columns except the first one */}
                  {columns.slice(1).map((column) => (
                    <div key={column.id}>
                      <div className="text-sm font-medium text-muted-foreground">
                        {column.header}
                      </div>
                      <div>
                        {column.cell
                          ? column.cell(item)
                          : column.accessorKey
                            ? String(item[column.accessorKey] ?? "")
                            : ""}
                      </div>
                    </div>
                  ))}
                </CardContent>

                {entityActions && entityActions.length > 0 && (
                  <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                    {entityActions.map((action) => {
                      const isDisabled =
                        typeof action.isDisabled === "function"
                          ? action.isDisabled(item)
                          : action.isDisabled;

                      return (
                        <Button
                          key={action.id}
                          size="sm"
                          variant={action.variant ?? "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(item);
                          }}
                          disabled={isDisabled}
                        >
                          {action.icon && (
                            <span className="mr-1">{action.icon}</span>
                          )}
                          {typeof action.label === "function"
                            ? action.label(item)
                            : action.label}
                        </Button>
                      );
                    })}
                  </CardFooter>
                )}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
