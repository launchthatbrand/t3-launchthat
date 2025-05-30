import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface LessonContentDropzoneProps {
  id: string; // Unique per lesson, e.g., `lesson-${lessonId}-content-dropzone`
  lessonId: string;
  children?: React.ReactNode;
}

const LessonContentDropzone: React.FC<LessonContentDropzoneProps> = ({
  id,
  lessonId,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "lesson-content-dropzone", lessonId }, // Accepts topics and quizzes
  });

  return (
    <div
      ref={setNodeRef}
      className={
        "my-2 ml-4 flex min-h-[70px] flex-col items-center justify-center rounded-md border border-dashed border-sky-500/60 transition-all duration-150 " +
        (isOver ? "border-sky-500 bg-sky-500/10 p-5" : "bg-muted/5 p-2")
      }
      style={{ minHeight: 70 }}
    >
      <span className="text-xs font-medium text-sky-600">
        {isOver ? "Release to add item" : "Drop Topics or Quizzes here"}
      </span>
      {children}
    </div>
  );
};

export default LessonContentDropzone;
