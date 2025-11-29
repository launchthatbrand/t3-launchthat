"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { ColumnDefinition, EntityListViewProps } from "./types";
import { EmptyState } from "./EmptyState";
import { GridView } from "./GridView";

type LegacyCellRenderer<T extends Record<string, unknown>> = (context: {
  row: Row<T>;
}) => React.ReactNode;

const shouldFallbackToLegacyRenderer = (error: unknown) => {
  if (!(error instanceof TypeError)) return false;
  const message = error.message ?? "";
  if (typeof message !== "string") return false;
  return (
    message.includes("reading 'original'") ||
    message.includes("reading 'row'") ||
    message.includes("Cannot destructure property 'row'")
  );
};

const renderCellWithFallback = <T extends Record<string, unknown>>(
  cell: ColumnDefinition<T>["cell"],
  row: Row<T>,
) => {
  if (!cell) return undefined;
  try {
    return (cell as (item: T) => React.ReactNode)(row.original as T);
  } catch (error) {
    if (shouldFallbackToLegacyRenderer(error)) {
      return (cell as LegacyCellRenderer<T>)({ row });
    }
    throw error;
  }
};

export function EntityListView<T extends Record<string, unknown>>({
  data,
  columns,
  viewMode,
  isLoading,
  onRowClick,
  gridColumns,
  selectedId,
  emptyState,
  entityActions,
  enableFooter = true,
  sortConfig,
  onSortChange,
  itemRender,
}: EntityListViewProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Use ColumnDef directly and add actions column if needed
  const tableColumns: ColumnDef<T>[] = React.useMemo(() => {
    const cols: ColumnDef<T>[] = columns.map((column) => {
      const baseColumn: ColumnDef<T> = {
        id: column.id,
        header: () => column.header,
        enableSorting: column.sortable ?? false,
        cell: column.cell
          ? ({ row }) => renderCellWithFallback(column.cell, row)
          : column.accessorKey
            ? ({ row }) =>
                String(row.original[column.accessorKey as keyof T] ?? "")
            : undefined,
      };

      if (column.accessorKey) {
        return {
          ...baseColumn,
          accessorKey: column.accessorKey as string,
        };
      }

      return baseColumn;
    });

    // Add actions column if entityActions exist
    if (entityActions && entityActions.length > 0) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {entityActions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(row.original)}
                className="rounded p-1 hover:bg-gray-100"
                title={
                  typeof action.label === "function"
                    ? action.label(row.original)
                    : action.label
                }
              >
                {action.icon}
              </button>
            ))}
          </div>
        ),
      });
    }

    return cols;
  }, [columns, entityActions]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      //This line
      pagination: {
        pageSize: 15,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="w-full">
        {viewMode === "list" ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={column.id ?? index}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                  {entityActions && entityActions.length > 0 && (
                    <TableHead>
                      <Skeleton className="h-4 w-16" />
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((column, index) => (
                      <TableCell key={column.id ?? index}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                    {entityActions && entityActions.length > 0 && (
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 shadow-sm">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-4">
        {emptyState ?? (
          <EmptyState
            icon={<Loader2 className="text-muted-foreground h-10 w-10" />}
            title="No items found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="w-full">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={onRowClick ? "cursor-pointer" : ""}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {enableFooter && <EntityListFooter table={table} />}
      </div>
    );
  }

  return (
    <GridView
      data={data}
      columns={columns}
      onCardClick={onRowClick}
      selectedIds={selectedId ? [selectedId] : []}
      entityActions={entityActions}
      cardRenderer={itemRender}
      gridColumns={gridColumns}
    />
  );
}

export const EntityListFooter = <T extends Record<string, unknown>>({
  table,
}: {
  table: TanstackTable<T>;
}) => {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
