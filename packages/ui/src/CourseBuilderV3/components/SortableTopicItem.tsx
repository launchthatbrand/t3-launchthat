import type { Active } from "@dnd-kit/core";
import React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import type { Topic } from "../store/useCourseBuilderStore";
import Dropzone from "./Dropzone";
import SortableQuizItem from "./SortableQuizItem";

// Import Accordion components

interface SortableTopicItemProps {
  topic: Topic;
  parentLessonId: string;
  activeItem: Active | null;
  onRemoveTopic?: (lessonId: string, topicId: string) => void;
  onRemoveQuiz?: (topicId: string, quizId: string) => void;
}

const SortableTopicItem: React.FC<SortableTopicItemProps> = ({
  topic,
  parentLessonId,
  activeItem,
  onRemoveTopic,
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
    id: topic.id,
    data: { type: "topic", parentLessonId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  const quizIds = topic.quizzes.map((q) => q.id);

  const isOverTopic = isOver && activeItem?.data.current?.type === "topic";

  return (
    // Change root from li to div for sortable
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} // Spread attributes to the main sortable div
      className="mb-1 w-full"
      aria-label={`Sortable topic: ${topic.title}`}
    >
      {/* Drop Indicator */}
      {isOverTopic && (
        <div className="absolute -top-1 left-0 h-1 w-full rounded bg-green-500" />
      )}
      {/* Wrap content in AccordionItem */}
      <AccordionItem
        value={topic.id} // Use topic ID for the accordion item value
        className="rounded border border-accent/20 bg-accent/5 shadow-sm"
      >
        {/* Trigger contains handle and title */}
        <div className="flex items-center">
          {/* Drag Handle */}
          <div
            {...listeners} // Apply listeners only to the handle
            className="flex cursor-grab touch-none items-center border-r border-r-accent/20 p-2 text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground"
            aria-label="Drag to reorder topic"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Add Badge here */}
          <AccordionTrigger
            className="flex flex-1 items-center gap-2 px-1 py-2 text-sm font-medium hover:no-underline data-[state=open]:border-b"
            aria-label={`Topic: ${topic.title}`}
          >
            <Badge variant="secondary" className="ml-2 whitespace-nowrap">
              Topic
            </Badge>
            <span className="flex-grow text-accent-foreground">
              {topic.title}
            </span>
            {/* Optional: Show quiz count? */}
            {topic.quizzes.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({topic.quizzes.length}{" "}
                {topic.quizzes.length === 1 ? "quiz" : "quizzes"})
              </span>
            )}
          </AccordionTrigger>
          {onRemoveTopic && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRemoveTopic(parentLessonId, topic.id);
              }}
              aria-label={`Remove ${topic.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content contains nested quizzes and dropzone */}
        <AccordionContent className="border-t px-4 pb-4 pt-2">
          {/* Sortable Quizzes within Topic */}
          {topic.quizzes.length > 0 && (
            <div className="mt-2 border-t border-dashed border-accent/30 pt-2">
              <SortableContext
                items={quizIds}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1">
                  {topic.quizzes.map((quiz) => (
                    <SortableQuizItem
                      key={quiz.id}
                      quiz={quiz}
                      parentTopicId={topic.id}
                      activeItem={activeItem}
                      onRemoveQuiz={
                        onRemoveQuiz
                          ? () => onRemoveQuiz(topic.id, quiz.id)
                          : undefined
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </div>
          )}

          {/* Dropzone for adding new Quizzes to this Topic */}
          <Dropzone
            id={`topic-${topic.id}-quiz-dropzone`}
            kind="topic-quiz"
            acceptedTypes={["quiz"]}
            data={{ topicId: topic.id }}
            className="mt-2 min-h-[50px]"
            enabledText="Drop Quizzes here"
          />
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

export default SortableTopicItem;
