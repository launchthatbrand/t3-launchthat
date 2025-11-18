"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface DropzoneProps {
  id: string;
  children: React.ReactNode;
  lessonId: Id<"posts">;
}

export const TopicDropzone: React.FC<DropzoneProps> = ({
  id,
  children,
  lessonId,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { lessonId, type: "topicDropzone" },
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

export default TopicDropzone;
