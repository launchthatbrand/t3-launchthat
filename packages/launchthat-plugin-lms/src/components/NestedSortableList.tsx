"use client";

import type { ReactNode } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableItem } from "@acme/dnd";

import type { Id } from "../lib/convexId";

type DraggedItemData<T> = Record<string, unknown> & {
  type: string;
  item: T;
};

interface NestedSortableListProps<T extends { _id: Id<"posts"> }> {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
  DropzoneComponent: React.FC<{
    id: string;
    lessonId: Id<"posts">;
    children: ReactNode;
  }>;
  lessonId: Id<"posts">;
  dropzoneType: "topicDropzone" | "quizDropzone";
}

export const NestedSortableList = <T extends { _id: Id<"posts"> }>({
  title,
  items,
  emptyMessage,
  renderItem,
  DropzoneComponent,
  lessonId,
  dropzoneType,
}: NestedSortableListProps<T>) => {
  const dropzoneId = `lesson-${lessonId}-${dropzoneType}`;
  const dropzone = (
    <DropzoneComponent id={dropzoneId} lessonId={lessonId}>
      <p className="text-muted-foreground text-sm">
        {items.length === 0
          ? emptyMessage
          : "Drop and release here to attach new items"}
      </p>
    </DropzoneComponent>
  );

  return (
    <div className="mt-4">
      <h4 className="text-md mb-2 font-semibold">{title}:</h4>
      {items.length > 0 ? (
        <>
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
                    item,
                  } as DraggedItemData<T>
                }
              >
                {renderItem(item)}
              </SortableItem>
            ))}
          </SortableContext>
          {dropzone}
        </>
      ) : (
        dropzone
      )}
    </div>
  );
};
