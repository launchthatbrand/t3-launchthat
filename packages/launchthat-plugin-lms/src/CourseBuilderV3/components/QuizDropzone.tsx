import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface QuizDropzoneProps {
  id: string; // Unique per topic, e.g., `topic-${topicId}-quiz-dropzone`
  topicId: string;
  children?: React.ReactNode;
}

const QuizDropzone: React.FC<QuizDropzoneProps> = ({
  id,
  topicId,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "quiz-dropzone", topicId },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        "my-1 ml-6 flex min-h-[40px] flex-col items-center justify-center rounded border border-dashed border-secondary/50 transition-all duration-150 " +
        (isOver ? "border-secondary bg-secondary/10 p-3" : "bg-muted/2 p-1")
      }
      style={{ minHeight: 40 }}
    >
      <span className="text-[10px] font-medium text-secondary">
        {isOver ? "Release to add quiz" : "Drop quizzes here"}
      </span>
      {children}
    </div>
  );
};

export default QuizDropzone;
