"use client";

import { Loader2 } from "lucide-react";

import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { EntityListViewProps } from "./types";
import { EmptyState } from "../../EmptyState";
import { GridView } from "./GridView";
import { ListView } from "./ListView";

export function EntityListView<T extends object>({
  data,
  columns,
  viewMode,
  isLoading = false,
  onRowClick,
  emptyState,
  entityActions,
  sortConfig,
  onSortChange,
}: EntityListViewProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full">
        {viewMode === "list" ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.id}>{column.header}</TableHead>
                  ))}
                  {entityActions && entityActions.length > 0 && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
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
            icon={<Loader2 className="h-10 w-10 text-muted-foreground" />}
            title="No items found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <ListView
        data={data}
        columns={columns}
        onRowClick={onRowClick}
        entityActions={entityActions}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
      />
    );
  }

  return (
    <GridView
      data={data}
      columns={columns}
      onCardClick={onRowClick}
      entityActions={entityActions}
    />
  );
}
