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
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Trash2 } from "lucide-react";

interface MainContentProps {
  mainContentItems: (Lesson | Quiz)[];
  activeItem: Active | null;
  onRemoveLesson?: (lessonId: string) => void;
  onRemoveTopic?: (lessonId: string, topicId: string) => void;
  onRemoveLessonQuiz?: (lessonId: string, quizId: string) => void;
  onRemoveTopicQuiz?: (topicId: string, quizId: string) => void;
  onRemoveFinalQuiz?: (quizId: string) => void;
  getLessonCertificateTitle?: (lessonId: string) => string | null;
  getTopicCertificateTitle?: (topicId: string) => string | null;
  onClearLessonCertificate?: (lessonId: string) => void;
  onClearTopicCertificate?: (topicId: string) => void;
  courseCertificateTitle?: string | null;
  onClearCourseCertificate?: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  mainContentItems,
  activeItem,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveLessonQuiz,
  onRemoveTopicQuiz,
  onRemoveFinalQuiz,
  getLessonCertificateTitle,
  getTopicCertificateTitle,
  onClearLessonCertificate,
  onClearTopicCertificate,
  courseCertificateTitle,
  onClearCourseCertificate,
}) => {
  return (
    <div className="grow space-y-4 overflow-y-auto p-6">
      <Dropzone
        id="main-content-dropzone"
        kind="main-content-root"
        acceptedTypes={["lesson", "quiz", "certificate"]}
        className="my-4"
        enabledText="Drop Lessons, Quizzes, or Certificates here"
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
                      lessonCertificateTitle={
                        getLessonCertificateTitle
                          ? getLessonCertificateTitle(item.id)
                          : null
                      }
                      onClearLessonCertificate={onClearLessonCertificate}
                      getTopicCertificateTitle={getTopicCertificateTitle}
                      onClearTopicCertificate={onClearTopicCertificate}
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

      <div className="bg-muted/10 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              Course certificate
            </Badge>
            <span className="text-muted-foreground text-xs">
              {courseCertificateTitle
                ? `Attached: ${courseCertificateTitle}`
                : "None attached"}
            </span>
          </div>
          {courseCertificateTitle && onClearCourseCertificate ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClearCourseCertificate();
              }}
              aria-label="Remove course certificate"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Drag a certificate onto the main course dropzone above to attach it.
          It will always be placed at the end of the course.
        </p>
      </div>

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
