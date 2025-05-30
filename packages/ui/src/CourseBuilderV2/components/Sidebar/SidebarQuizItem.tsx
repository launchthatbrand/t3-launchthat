import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Adjust the import path for the Convex Doc type
// Assuming a common monorepo structure where `apps/wsa` is a sibling of `packages/ui`
import type { Doc } from "../../../../../../apps/wsa/convex/_generated/dataModel";

interface SidebarQuizItemProps {
  quiz: Doc<"quizzes">;
}

export const SidebarQuizItem: React.FC<SidebarQuizItemProps> = ({ quiz }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `sidebar-quiz-${quiz._id}`, // Unique ID
      data: {
        type: "sidebarQuiz", // Specific type for sidebar quizzes
        item: quiz, // Pass quiz data
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      // Consider using shared Tailwind classes or a base component if styles repeat
      className="mb-2 rounded border bg-card p-2 text-xs shadow-sm transition-opacity duration-150 ease-in-out"
    >
      {quiz.title}
    </div>
  );
};
