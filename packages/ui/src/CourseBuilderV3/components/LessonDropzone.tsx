import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface LessonDropzoneProps {
  id: string;
  children?: React.ReactNode;
}

const LessonDropzone: React.FC<LessonDropzoneProps> = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "lesson-dropzone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        "my-4 flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 transition-all duration-150 " +
        (isOver ? "border-primary bg-primary/10 p-8" : "bg-muted/10 p-4")
      }
      style={{ minHeight: 120 }}
    >
      <span className="text-sm font-medium text-primary">
        {isOver ? "Release to add lesson" : "Drop lessons here"}
      </span>
      {children}
    </div>
  );
};

export default LessonDropzone;
