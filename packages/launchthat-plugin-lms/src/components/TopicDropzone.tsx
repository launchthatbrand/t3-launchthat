"use client";

import type { Id } from "../lib/convexId";
import type { PropsWithChildren } from "react";
import { useDroppable } from "@dnd-kit/core";

interface DropzoneProps extends PropsWithChildren {
  id: string;
  lessonId: Id<"posts">;
}

export const TopicDropzone = ({ id, children, lessonId }: DropzoneProps) => {
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

