import type { Active } from "@dnd-kit/core";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, Pencil, Trash2 } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import type { Quiz } from "../store/useCourseBuilderStore";

// import Dropzone from "./Dropzone"; // Placeholder if quizzes can contain items

interface SortableQuizItemProps {
  quiz: Quiz;
  // Context IDs to know where this quiz lives
  parentLessonId?: string;
  parentTopicId?: string;
  isFinalQuiz?: boolean;
  activeItem: Active | null;
  onRemoveQuiz?: () => void;
}

const SortableQuizItem: React.FC<SortableQuizItemProps> = ({
  quiz,
  parentLessonId,
  parentTopicId,
  isFinalQuiz,
  activeItem,
  onRemoveQuiz,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: quiz.id,
    data: {
      type: "quiz",
      parentLessonId,
      parentTopicId,
      isFinalQuiz,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  // Determine border color based on context
  const borderColorClass = isFinalQuiz
    ? "border-destructive/20"
    : parentTopicId
      ? "border-accent/20"
      : "border-secondary/20";
  const bgColorClass = isFinalQuiz
    ? "bg-destructive/5"
    : parentTopicId
      ? "bg-accent/5"
      : "bg-secondary/5";
  const handleColorClass = isFinalQuiz
    ? "hover:text-destructive-foreground"
    : parentTopicId
      ? "hover:text-accent-foreground"
      : "hover:text-secondary-foreground";
  const indicatorColorClass = isFinalQuiz
    ? "bg-destructive"
    : parentTopicId
      ? "bg-green-500"
      : "bg-purple-500";

  const isOverQuiz = isOver && activeItem?.data.current?.type === "quiz";

  const handleOpenLink = (
    event: React.MouseEvent<HTMLButtonElement>,
    url?: string,
  ) => {
    if (!url) return;
    event.preventDefault();
    event.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {isOverQuiz && (
        <div
          className={`absolute -top-1 left-0 h-1 w-full rounded ${indicatorColorClass}`}
        />
      )}
      <AccordionItem
        value={quiz.id}
        className={`mb-1 rounded border ${borderColorClass} ${bgColorClass} shadow-sm`}
      >
        <div className="flex items-center">
          {/* Drag Handle */}
          <div
            {...listeners}
            className={`flex cursor-grab touch-none items-center border-r ${borderColorClass} p-2 text-muted-foreground ${handleColorClass}`}
            aria-label="Drag to reorder quiz"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          {/* Badge + trigger */}
          <AccordionTrigger
            className="flex flex-1 items-center gap-2 px-1 py-2 text-sm font-medium hover:no-underline data-[state=open]:border-b"
            aria-label={`Quiz: ${quiz.title}`}
          >
            <Badge
              variant={isFinalQuiz ? "destructive" : "outline"}
              className="ml-2 whitespace-nowrap"
            >
              Quiz
            </Badge>
            <span
              className={
                isFinalQuiz
                  ? "text-destructive-foreground"
                  : parentTopicId
                    ? "text-accent-foreground"
                    : "text-secondary-foreground"
              }
            >
              {quiz.title}
            </span>
          </AccordionTrigger>
          <div className="ml-auto flex items-center gap-1 pr-1">
            {quiz.viewUrl && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`View ${quiz.title}`}
                onClick={(event) => handleOpenLink(event, quiz.viewUrl)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {quiz.editUrl && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${quiz.title}`}
                onClick={(event) => handleOpenLink(event, quiz.editUrl)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onRemoveQuiz && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemoveQuiz();
                }}
                aria-label={`Remove ${quiz.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <AccordionContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground">
          {/* Placeholder for potential future quiz content/settings/dropzones */}
          Quiz content/settings area...
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

export default SortableQuizItem;
