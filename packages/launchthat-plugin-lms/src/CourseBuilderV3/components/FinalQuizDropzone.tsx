import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface FinalQuizDropzoneProps {
  id: string; // e.g., "final-quiz-dropzone"
  children?: React.ReactNode;
}

const FinalQuizDropzone: React.FC<FinalQuizDropzoneProps> = ({
  id,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "final-quiz-dropzone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        "my-4 flex min-h-[80px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/40 transition-all duration-150 " +
        (isOver
          ? "border-destructive bg-destructive/10 p-6"
          : "bg-muted/10 p-4")
      }
      style={{ minHeight: 80 }}
    >
      <span className="text-sm font-medium text-destructive">
        {isOver ? "Release to add final quiz" : "Drop quizzes here"}
      </span>
      {children}
    </div>
  );
};

export default FinalQuizDropzone;
