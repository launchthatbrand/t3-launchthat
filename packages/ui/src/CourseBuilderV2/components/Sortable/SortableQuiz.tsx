import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Id, Quiz } from "../../types"; // Removed unused DraggableItemData

import { QuizItem } from "../Item/QuizItem"; // Assuming location

interface SortableQuizProps {
  quiz: Quiz;
  parentId: string; // ID of the parent context (e.g., `topic-${topicId}` or `finalQuizzesZone`)
  // Callbacks from useCourseData
  changeQuizTitle: (quizId: Id<"quizzes">, newTitle: string) => Promise<void>;
  removeQuiz: (quizId: Id<"quizzes">) => Promise<void>;
  // DnD related props
  isMutating: boolean; // To disable interactions during mutations
}

export const SortableQuiz: React.FC<SortableQuizProps> = ({
  quiz,
  parentId,
  changeQuizTitle,
  removeQuiz,
  isMutating,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `quiz-${quiz._id}`,
    data: {
      type: "quiz",
      item: quiz,
      parentId: parentId, // Include parent context
    },
    disabled: isMutating,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined, // Ensure dragged item is on top
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <QuizItem
        quiz={quiz}
        isOverlay={isDragging}
        dragHandleProps={{ listeners }}
        changeQuizTitle={changeQuizTitle}
        removeQuiz={removeQuiz}
        // Add isMutating prop if QuizItem needs to disable actions
      />
    </div>
  );
};
