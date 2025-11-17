"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";

import type { EntityAction } from "./types";

export interface GridViewProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  onCardClick?: (item: T) => void;
  entityActions?: EntityAction<T>[];
  gridColumns?: { sm?: number; md?: number; lg?: number; xl?: number };
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  idField?: keyof T;
  cardRenderer?: (item: T) => React.ReactNode;
}

function renderCellValue<T extends object>(column: ColumnDef<T>, item: T) {
  if (column.cell) {
    const ctx: any = {
      row: { original: item },
      getValue: () => {
        const key = (column as { accessorKey?: string }).accessorKey;
        return key ? (item as Record<string, unknown>)[key] : undefined;
      },
      column: { columnDef: column },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    return (column.cell as any)(ctx);
  }
  const key = (column as { accessorKey?: string }).accessorKey;
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return key ? String((item as Record<string, unknown>)[key] ?? "") : "";
}

export function GridView<T extends object>({
  data,
  columns,
  onCardClick,
  entityActions,
  gridColumns = { sm: 1, md: 2, lg: 3, xl: 4 },
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  idField = "id" as keyof T,
  cardRenderer,
}: GridViewProps<T>) {
  const gridClasses = useMemo(() => {
    const classes = ["grid", "gap-4"];
    classes.push(`grid-cols-1`);
    if (gridColumns.sm) classes.push(`sm:grid-cols-${gridColumns.sm}`);
    if (gridColumns.md) classes.push(`md:grid-cols-${gridColumns.md}`);
    if (gridColumns.lg) classes.push(`lg:grid-cols-${gridColumns.lg}`);
    if (gridColumns.xl) classes.push(`xl:grid-cols-${gridColumns.xl}`);
    return classes.join(" ");
  }, [gridColumns]);

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

            <CardHeader className="pb-2">
              {columns[0] && (
                <h3 className="text-lg font-semibold">
                  {renderCellValue(columns[0], item)}
                </h3>
              )}
            </CardHeader>

            <CardContent className="space-y-2 pb-4">
              {columns.slice(1).map((column) => (
                <div key={column.id as string}>
                  <div className="text-sm font-medium text-muted-foreground">
                    {typeof column.header === "string"
                      ? column.header
                      : String(
                          (column.id as string) ??
                            (column as { accessorKey?: string }).accessorKey ??
                            "",
                        )}
                  </div>
                  <div>{renderCellValue(column, item)}</div>
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
          </Card>
        );
      })}
    </div>
  );
}
