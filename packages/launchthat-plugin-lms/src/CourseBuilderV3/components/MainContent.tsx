import type { Active } from "@dnd-kit/core";
import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Dropzone } from "@acme/dnd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";

import type { Lesson, Quiz } from "../store/useCourseBuilderStore";
import SortableLessonItem from "./SortableLessonItem";
import SortableQuizItem from "./SortableQuizItem";

interface MainContentProps {
  mainContentItems: (Lesson | Quiz)[];
  activeItem: Active | null;
  onRemoveLesson?: (lessonId: string) => void;
  onRemoveTopic?: (lessonId: string, topicId: string) => void;
  onRemoveLessonQuiz?: (lessonId: string, quizId: string) => void;
  onRemoveTopicQuiz?: (topicId: string, quizId: string) => void;
  onRemoveFinalQuiz?: (quizId: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  mainContentItems,
  activeItem,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveLessonQuiz,
  onRemoveTopicQuiz,
  onRemoveFinalQuiz,
}) => {
  return (
    <div className="grow space-y-4 overflow-y-auto p-6">
      <Dropzone
        id="main-content-dropzone"
        kind="main-content-root"
        acceptedTypes={["lesson", "quiz"]}
        className="my-4"
        enabledText="Drop Lessons or Quizzes here"
      >
        {mainContentItems.length === 0 && (
          <span className="text-muted-foreground text-xs">
            No content added yet.
          </span>
        )}
        {mainContentItems.length > 0 && (
          <SortableContext
            items={mainContentItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Accordion type="multiple" className="w-full space-y-2">
              {mainContentItems.map((item) => {
                if (item.type === "lesson") {
                  return (
                    <SortableLessonItem
                      key={item.id}
                      lesson={item}
                      activeItem={activeItem}
                      onRemoveLesson={onRemoveLesson}
                      onRemoveTopic={onRemoveTopic}
                      onRemoveLessonQuiz={onRemoveLessonQuiz}
                      onRemoveTopicQuiz={onRemoveTopicQuiz}
                    />
                  );
                } else {
                  return (
                    <SortableQuizItem
                      key={item.id}
                      quiz={item}
                      isFinalQuiz={true}
                      activeItem={activeItem}
                      onRemoveQuiz={
                        onRemoveFinalQuiz
                          ? () => onRemoveFinalQuiz(item.id)
                          : undefined
                      }
                    />
                  );
                }
              })}
            </Accordion>
          </SortableContext>
        )}
      </Dropzone>

      {/* Debug Accordion */}
      <Accordion type="single" collapsible className="w-full pt-4">
        <AccordionItem value="debug-json">
          <AccordionTrigger className="text-muted-foreground text-sm font-medium hover:no-underline">
            Debug: Course Structure State
          </AccordionTrigger>
          <AccordionContent>
            <pre className="bg-muted/50 mt-1 overflow-x-auto rounded p-4 text-xs">
              {JSON.stringify({ mainContentItems }, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MainContent;
