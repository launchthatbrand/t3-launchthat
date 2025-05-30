import type { Active } from "@dnd-kit/core";
import React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

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
import Dropzone from "./Dropzone";
import SortableQuizItem from "./SortableQuizItem";
import SortableTopicItem from "./SortableTopicItem";

interface SortableLessonItemProps {
  lesson: Lesson;
  activeItem: Active | null;
}

const SortableLessonItem: React.FC<SortableLessonItemProps> = ({
  lesson,
  activeItem,
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

  const isOverLesson = isOver && activeItem?.data.current?.type === "lesson";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {isOverLesson && (
        <div className="absolute -top-1 left-0 h-1 w-full rounded bg-blue-500" />
      )}
      <AccordionItem
        value={lesson.id}
        className="rounded border bg-background shadow-sm"
      >
        {/* <div className="flex items-center"> */}

        <AccordionTrigger className="w-full flex-1 py-2 pr-2">
          <div
            {...listeners}
            className="cursor-grab touch-none p-2 text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder lesson"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <Badge
            variant="outline"
            className="ml-2 mr-2 shrink-0 whitespace-nowrap"
          >
            Lesson
          </Badge>
          <span className="flex-grow text-left">{lesson.title}</span>
        </AccordionTrigger>
        {/* </div> */}
        <AccordionContent className="border-t px-4 pb-4 pt-2">
          {/* Single Sortable Context for Topics and Quizzes */}
          <SortableContext
            items={contentItemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="ml-4 mt-2 space-y-1">
              {lesson.contentItems.map((item) => {
                if (item.type === "topic") {
                  return (
                    <SortableTopicItem
                      key={item.id}
                      topic={item}
                      parentLessonId={lesson.id}
                      activeItem={activeItem}
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
            acceptedTypes={["topic", "quiz"]}
            data={{ lessonId: lesson.id }}
            className="my-2 ml-4 min-h-[70px]"
            enabledText="Drop Topics or Quizzes here"
          />

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
