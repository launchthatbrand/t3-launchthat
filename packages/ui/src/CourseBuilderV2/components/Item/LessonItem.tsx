import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import React from "react";
import { Cross2Icon, DragHandleDots2Icon } from "@radix-ui/react-icons";

import type { Id } from "../../../../apps/wsa/convex/_generated/dataModel";
import type { LessonWithTopics } from "./index";

// --- Component Props ---
interface LessonItemProps {
  lesson: LessonWithTopics;
  isExpanded: boolean;
  isOverlay?: boolean; // Optional: Indicates if rendering in drag overlay
  // Updated drag handle prop type
  dragHandleProps?: {
    listeners?: DraggableSyntheticListeners;
    attributes?: DraggableAttributes;
  };
  onToggleExpand: (lessonId: Id<"lessons">) => void;
  onAddQuiz: () => void; // Keep simple for now, handles warning internally
  // Updated signatures
  onTitleChange: (lessonId: Id<"lessons">, newTitle: string) => void;
  onRemove: (lessonId: Id<"lessons">) => void;
}

export const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  isExpanded,
  isOverlay = false,
  dragHandleProps,
  onToggleExpand,
  onAddQuiz,
  onTitleChange,
  onRemove,
}) => {
  const handleTitleBlur = (event: React.FocusEvent<HTMLHeadingElement>) => {
    const newTitle = event.currentTarget.textContent?.trim();
    if (newTitle && newTitle !== lesson.title) {
      onTitleChange(lesson._id, newTitle); // Pass only ID
    } else {
      event.currentTarget.textContent = lesson.title;
    }
  };

  const handleTitleKeyDown = (
    event: React.KeyboardEvent<HTMLHeadingElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.currentTarget.textContent = lesson.title;
      event.currentTarget.blur();
    }
  };

  const itemClasses = `rounded border bg-background p-3 shadow-sm ${isOverlay ? "opacity-75" : ""}`;

  return (
    <div className={itemClasses}>
      <div className="flex items-center justify-between">
        <div className="flex flex-grow items-center">
          {/* Drag Handle */}
          <div
            className={`cursor-grab text-muted-foreground hover:text-foreground ${dragHandleProps ? "" : "cursor-not-allowed opacity-50"}`}
            {...dragHandleProps?.listeners}
            {...dragHandleProps?.attributes}
            aria-label="Drag lesson"
          >
            <DragHandleDots2Icon className="mr-2 h-4 w-4" />
          </div>
          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => onToggleExpand(lesson._id)} // Pass ID
            className="mr-2 text-muted-foreground hover:text-foreground"
            aria-expanded={isExpanded}
            aria-controls={`lesson-content-${lesson._id}`}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
          {/* Lesson Title (Editable) */}
          <h3
            className="flex-grow cursor-text rounded px-1 text-base font-semibold hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
            contentEditable={!isOverlay}
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
          >
            {lesson.title}
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add Quiz Button (triggers warning) */}
          <button
            onClick={onAddQuiz}
            className="text-xs text-blue-600 hover:underline"
            aria-label="Add Quiz to Lesson (warning)"
            title="Adding quiz directly to lesson not standard"
            disabled={isOverlay}
          >
            + Quiz
          </button>
          {/* Remove Button */}
          <button
            onClick={() => onRemove(lesson._id)} // Pass only ID
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Remove lesson ${lesson.title}`}
            disabled={isOverlay}
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Content area placeholder for isExpanded, handled by parent */}
    </div>
  );
};
