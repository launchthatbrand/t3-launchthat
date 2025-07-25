/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "~/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  isOverlayDragging?: boolean;
  className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  data,
  isOverlayDragging,
  className,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id,
    data,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isOverlayDragging ? 0.5 : 1,
    zIndex: isSortableDragging || isOverlayDragging ? 100 : "auto",
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "my-2 flex flex-row items-center rounded-md border p-0 shadow-sm",
        className,
      )}
    >
      <div
        className="flex h-10 cursor-grab items-center justify-center"
        {...listeners}
        data-dnd-handle="true"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SortableItem;
