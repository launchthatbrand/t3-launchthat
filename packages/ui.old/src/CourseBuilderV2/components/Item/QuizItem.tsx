import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

// Use types from the central location
import type { Id, Quiz } from "../../types"; // Path relative to new location

// Import base components
import { DragHandle } from "./DragHandle";
import { EditableTitle } from "./EditableTitle";
import { ItemWrapper } from "./ItemWrapper";

interface QuizItemProps {
  quiz: Quiz;
  changeQuizTitle: (quizId: Id<"quizzes">, newTitle: string) => Promise<void>;
  removeQuiz: (quizId: Id<"quizzes">) => Promise<void>;
  isOverlay?: boolean;
  dragHandleProps?: {
    listeners?: DraggableSyntheticListeners;
    attributes?: DraggableAttributes;
  };
}

export const QuizItem: React.FC<QuizItemProps> = ({
  quiz,
  changeQuizTitle,
  removeQuiz,
  isOverlay = false,
  dragHandleProps,
}) => {
  // Render Actions Slot
  const renderActions = (
    <button
      onClick={() => removeQuiz(quiz._id)}
      className="text-muted-foreground hover:text-destructive"
      aria-label={`Remove quiz ${quiz.title}`}
      disabled={isOverlay}
    >
      <Cross2Icon className="h-4 w-4" />
    </button>
  );

  // Render Drag Handle Slot
  const renderDragHandle = (
    <DragHandle
      listeners={dragHandleProps?.listeners}
      attributes={dragHandleProps?.attributes}
      disabled={isOverlay}
    />
  );

  return (
    <ItemWrapper
      isOverlay={isOverlay}
      dragHandle={renderDragHandle}
      actions={renderActions}
      className="ml-8" // Maintain original margin
    >
      {/* Main Content Area */}
      <EditableTitle
        as="h5"
        className="flex-grow text-xs font-medium" // Add styling here
        initialTitle={quiz.title}
        onSave={(newTitle) => changeQuizTitle(quiz._id, newTitle)}
        disabled={isOverlay}
      />
    </ItemWrapper>
  );
};
