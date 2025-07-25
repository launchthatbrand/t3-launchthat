/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { SortableItem } from "@/components/SortableItem";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface DraggedItemData<T> {
  type: string;
  item: T;
}

interface NestedSortableListProps<T extends Doc<"topics"> | Doc<"quizzes">> {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
  DropzoneComponent: React.FC<{
    id: string;
    lessonId: Id<"lessons">; // Correctly type lessonId
    children: React.ReactNode;
  }>;
  lessonId: Id<"lessons">; // Correctly type lessonId
  dropzoneType: "topicDropzone" | "quizDropzone";
}

export const NestedSortableList = <T extends Doc<"topics"> | Doc<"quizzes">>({
  title,
  items,
  emptyMessage,
  renderItem,
  DropzoneComponent,
  lessonId,
  dropzoneType,
}: NestedSortableListProps<T>) => {
  return (
    <div className="mt-4">
      <h4 className="text-md mb-2 font-semibold">{title}:</h4>
      {items.length > 0 ? (
        <SortableContext
          items={items.map((i) => i._id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableItem
              key={item._id}
              id={item._id}
              className="bg-white"
              data={
                {
                  type: dropzoneType === "topicDropzone" ? "topic" : "quiz",
                  item: item, // Now correctly typed
                } as DraggedItemData<T>
              } // Explicitly cast to DraggedItemData
            >
              {renderItem(item)}
            </SortableItem>
          ))}
        </SortableContext>
      ) : (
        <DropzoneComponent
          id={`lesson-${lessonId}-${dropzoneType}`}
          lessonId={lessonId}
        >
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </DropzoneComponent>
      )}
    </div>
  );
};
