"use client";

import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Card, CardContent } from "@acme/ui/card";

import { SortableItem } from "../app/(root)/(admin)/admin/(lms)/courses/[courseId]/builder/page";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface NestedSortableListProps<T extends { _id: string }> {
  title: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
  DropzoneComponent: React.FC<any>;
  lessonId: string;
  dropzoneType: "topicDropzone" | "quizDropzone";
}

export const NestedSortableList = <T extends { _id: string }>({
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
        items.map(renderItem)
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
