"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { ReactNode } from "react";
import { SortableItem } from "./SortableItem";

interface SortableListProps<T extends { _id: string }> {
  items: T[];
  type: string;
  renderItem: (item: T) => ReactNode;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={{ type, item } as any}
        >
          {renderItem(item)}
        </SortableItem>
      ))}
    </SortableContext>
  );
};

