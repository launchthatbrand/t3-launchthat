import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { QuizItem } from "./QuizItem";

interface QuizType {
  id: string;
  title: string;
  status: string;
}

interface SortableQuizProps {
  quiz: QuizType;
  onTitleChange: (newTitle: string) => Promise<void>;
  parentType: "topic";
}

export const SortableQuiz: React.FC<SortableQuizProps> = ({
  quiz,
  onTitleChange,
  parentType,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `quiz-${quiz.id}`,
    data: {
      type: "quiz",
      quiz,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div className="sortable-quiz-wrapper" ref={setNodeRef} style={style}>
      <QuizItem
        title={quiz.title}
        status={quiz.status}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onTitleChange={onTitleChange}
        parentType={parentType}
      />
    </div>
  );
};
