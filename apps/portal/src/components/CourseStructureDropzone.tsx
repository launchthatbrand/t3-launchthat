"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DropzoneProps {
  id: string;
  children: React.ReactNode;
}

export const CourseStructureDropzone: React.FC<DropzoneProps> = ({
  id,
  children,
}) => {
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

export default CourseStructureDropzone;
