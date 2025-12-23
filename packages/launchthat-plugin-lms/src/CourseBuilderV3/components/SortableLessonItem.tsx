import type { Active } from "@dnd-kit/core";
import React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, Pencil, Trash2 } from "lucide-react";

import { Dropzone } from "@acme/dnd";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@acme/ui/drawer";

import type { Lesson } from "../store/useCourseBuilderStore";
import SortableQuizItem from "./SortableQuizItem";
import SortableTopicItem from "./SortableTopicItem";

interface SortableLessonItemProps {
  lesson: Lesson;
  activeItem: Active | null;
  onRemoveLesson?: (lessonId: string) => void;
  onRemoveTopic?: (lessonId: string, topicId: string) => void;
  onRemoveLessonQuiz?: (lessonId: string, quizId: string) => void;
  onRemoveTopicQuiz?: (topicId: string, quizId: string) => void;
  lessonCertificateTitle?: string | null;
  onClearLessonCertificate?: (lessonId: string) => void;
  getTopicCertificateTitle?: (topicId: string) => string | null;
  onClearTopicCertificate?: (topicId: string) => void;
}

const SortableLessonItem: React.FC<SortableLessonItemProps> = ({
  lesson,
  activeItem,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveLessonQuiz,
  onRemoveTopicQuiz,
  lessonCertificateTitle,
  onClearLessonCertificate,
  getTopicCertificateTitle,
  onClearTopicCertificate,
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
    id: lesson.id,
    data: { type: "lesson" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
    cursor: "grab",
  };

  const contentItemIds = lesson.contentItems.map((item) => item.id);
  const lessonViewUrl = lesson.viewUrl;
  const lessonEditUrl = lesson.editUrl;

  const isOverLesson = isOver && activeItem?.data.current?.type === "lesson";

  const handleOpenLink = (
    event: React.MouseEvent<HTMLButtonElement>,
    url: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {isOverLesson && (
        <div className="absolute -top-1 left-0 h-1 w-full rounded bg-blue-500" />
      )}
      <AccordionItem
        value={lesson.id}
        className="bg-background rounded border shadow-sm"
      >
        <div className="flex items-center pr-2">
          <div
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-2"
            aria-label="Drag to reorder lesson"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <AccordionTrigger className="flex flex-1 items-center gap-2 py-2 text-left">
            <Badge
              variant="outline"
              className="ml-1 shrink-0 whitespace-nowrap"
            >
              Lesson
            </Badge>
            <span className="flex-grow text-left">{lesson.title}</span>
          </AccordionTrigger>
          <div className="ml-auto flex items-center gap-1 pr-1">
            {typeof lessonViewUrl === "string" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`View ${lesson.title}`}
                onClick={(event) => handleOpenLink(event, lessonViewUrl)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {typeof lessonEditUrl === "string" && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${lesson.title}`}
                onClick={(event) => handleOpenLink(event, lessonEditUrl)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onRemoveLesson && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemoveLesson(lesson.id);
                }}
                aria-label={`Remove ${lesson.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <AccordionContent className="border-t px-4 pt-2 pb-4">
          {/* Single Sortable Context for Topics and Quizzes */}
          <SortableContext
            items={contentItemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-2 ml-4 space-y-1">
              {lesson.contentItems.map((item) => {
                if (item.type === "topic") {
                  return (
                    <SortableTopicItem
                      key={item.id}
                      topic={item}
                      parentLessonId={lesson.id}
                      activeItem={activeItem}
                      onRemoveTopic={onRemoveTopic}
                      onRemoveQuiz={onRemoveTopicQuiz}
                      topicCertificateTitle={
                        getTopicCertificateTitle
                          ? getTopicCertificateTitle(item.id)
                          : null
                      }
                      onClearTopicCertificate={onClearTopicCertificate}
                    />
                  );
                } else {
                  return (
                    <SortableQuizItem
                      key={item.id}
                      quiz={item}
                      parentLessonId={lesson.id}
                      isFinalQuiz={false}
                      activeItem={activeItem}
                      onRemoveQuiz={
                        onRemoveLessonQuiz
                          ? () => onRemoveLessonQuiz(lesson.id, item.id)
                          : undefined
                      }
                    />
                  );
                }
              })}
            </div>
          </SortableContext>

          {/* Dropzone for adding new Topics/Quizzes to this Lesson */}
          <Dropzone
            id={`lesson-${lesson.id}-content-dropzone`}
            kind="lesson-content"
            acceptedTypes={["topic", "quiz", "certificate"]}
            data={{ lessonId: lesson.id }}
            className="my-2 ml-4 min-h-[70px]"
            enabledText="Drop Topics, Quizzes, or Certificates here"
          />
          <div className="bg-muted/10 ml-4 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px]">
                  Lesson certificate
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {lessonCertificateTitle
                    ? `Attached: ${lessonCertificateTitle}`
                    : "None attached"}
                </span>
              </div>
              {lessonCertificateTitle && onClearLessonCertificate ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onClearLessonCertificate(lesson.id);
                  }}
                  aria-label="Remove lesson certificate"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Drag a certificate onto the lesson dropzone above to attach it. It
              will always be placed at the end of the lesson.
            </p>
          </div>

          {/* Add Buttons below the dropzone, wrapped in Drawers */}
          <div className="mt-4 flex justify-end space-x-2">
            {/* Add Topic Drawer */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  Add Topic
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Add New Topic</DrawerTitle>
                  <DrawerDescription>
                    Configure your new topic here.
                  </DrawerDescription>
                </DrawerHeader>
                {/* Placeholder for Topic Form/Content */}
                <div className="p-4">Topic creation form will go here...</div>
                <DrawerFooter>
                  <Button>Save Topic</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            {/* Add Quiz Drawer */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  Add Quiz
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Add New Quiz</DrawerTitle>
                  <DrawerDescription>
                    Configure your new quiz here.
                  </DrawerDescription>
                </DrawerHeader>
                {/* Placeholder for Quiz Form/Content */}
                <div className="p-4">Quiz creation form will go here...</div>
                <DrawerFooter>
                  <Button>Save Quiz</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

export default SortableLessonItem;
