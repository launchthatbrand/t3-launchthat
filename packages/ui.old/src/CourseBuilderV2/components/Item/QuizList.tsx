import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Doc, Id } from "../../../../apps/wsa/convex/_generated/dataModel"; // Adjust path

import { SortableQuiz } from "./SortableQuiz";

// Assuming Quiz type is defined elsewhere
type Quiz = Doc<"quizzes">;

interface QuizListProps {
  topicId: Id<"topics">; // ID of the parent topic
  quizzes: Quiz[];
  onTitleChange: (
    itemType: "lesson" | "topic" | "quiz",
    itemId: string,
    newTitle: string,
  ) => void;
  onRemoveItem: (itemType: "lesson" | "topic" | "quiz", itemId: string) => void;
}

export const QuizList: React.FC<QuizListProps> = ({
  topicId,
  quizzes,
  onTitleChange,
  onRemoveItem,
}) => {
  // Generate IDs for sortable context, ensure uniqueness
  const sortableQuizIds = quizzes.map((quiz) => `quiz-${topicId}-${quiz._id}`); // Use topicId prefix

  return (
    <SortableContext
      items={sortableQuizIds}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-1.5 pl-6">
        {" "}
        {/* Added padding for hierarchy */}
        {quizzes.map((quiz) => (
          <SortableQuiz
            key={quiz._id}
            quiz={quiz}
            onTitleChange={onTitleChange}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </SortableContext>
  );
};
