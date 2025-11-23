"use client";

import type { PropsWithChildren } from "react";
import { useDroppable } from "@dnd-kit/core";

interface DropzoneProps extends PropsWithChildren {
  id: string;
}

export const CourseStructureDropzone = ({ id, children }: DropzoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "course-structure-droppable" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-2 rounded-md border p-2 text-center text-muted-foreground ${
        isOver ? "border-primary bg-primary/10" : "border-dashed"
      }`}
    >
      {children}
    </div>
  );
};

