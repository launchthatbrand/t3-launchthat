import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface TopicDropzoneProps {
  id: string; // Should be unique per lesson, e.g., `lesson-${lessonId}-topic-dropzone`
  lessonId: string;
  children?: React.ReactNode;
}

const TopicDropzone: React.FC<TopicDropzoneProps> = ({
  id,
  lessonId,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "topic-dropzone", lessonId },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        "my-2 ml-4 flex min-h-[60px] flex-col items-center justify-center rounded-md border border-dashed border-accent/60 transition-all duration-150 " +
        (isOver ? "border-accent bg-accent/10 p-4" : "bg-muted/5 p-2")
      }
      style={{ minHeight: 60 }}
    >
      <span className="text-xs font-medium text-accent">
        {isOver ? "Release to add topic" : "Drop topics here"}
      </span>
      {children}
    </div>
  );
};

export default TopicDropzone;
