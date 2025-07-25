/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { SortableItem } from "@/components/SortableItem";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface SortableListProps<T extends { _id: string }> {
  items: T[];
  type: "lesson" | "topic" | "quiz";
  renderItem: (item: T) => React.ReactNode;
}

export const SortableList = <T extends { _id: string }>({
  items,
  type,
  renderItem,
}: SortableListProps<T>) => {
  return (
    <SortableContext
      items={items.map((i) => i._id)}
      strategy={verticalListSortingStrategy}
    >
      {items.map((item) => (
        <SortableItem
          key={item._id}
          id={item._id}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data={{ type, item } as any}
        >
          {renderItem(item)}
        </SortableItem>
      ))}
    </SortableContext>
  );
};

export default SortableList;
