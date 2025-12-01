"use client";

import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface AvailableItemsCardProps<T extends { _id: string }> {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
  dropzoneId?: string;
}

export const AvailableItemsCard = <T extends { _id: string }>({
  title,
  items,
  emptyMessage,
  renderItem,
  dropzoneId,
}: AvailableItemsCardProps<T>) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <SortableContext
          items={items.map((item) => item._id)}
          strategy={verticalListSortingStrategy}
        >
          {items.length === 0 ? (
            <div
              id={dropzoneId}
              className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed p-4 text-center text-muted-foreground"
            >
              <p>{emptyMessage}</p>
            </div>
          ) : (
            items.map(renderItem)
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
};
