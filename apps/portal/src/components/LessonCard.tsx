"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { NestedSortableList } from "@/components/NestedSortableList"; // Changed to named import
import { QuizDropzone } from "@/components/QuizDropzone"; // Correct import

import { TopicDropzone } from "@/components/TopicDropzone"; // Correct import

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
} from "~/plugins/lms/types";

interface LessonCardProps {
  lesson: LmsBuilderLesson;
  topics: LmsBuilderTopic[];
  quizzes: LmsBuilderQuiz[];
  topicSortOrder: "alphabetical" | "date";
  onToggleSortOrder: (lessonId: Id<"posts">) => void;
  onRemoveLesson: (lessonId: Id<"posts">) => void;
  onRemoveTopic: (topicId: Id<"posts">) => void;
  onRemoveQuiz: (quizId: Id<"posts">) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  topics,
  quizzes,
  topicSortOrder,
  onToggleSortOrder,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveQuiz,
}) => {
  return (
    <Card className="YESY cursor-default rounded-none border-0 shadow-none">
      <Accordion type="single" collapsible className="border-0 p-2">
        <AccordionItem value="item-1" className="border-0">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex w-full gap-2">
              {lesson.title} <Badge variant="outline">Lesson</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSortOrder(lesson._id);
                }}
              >
                Sort: {topicSortOrder === "alphabetical" ? "A→Z" : "Date"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveLesson(lesson._id);
                }}
              >
                Remove
              </Button>
            </div>
            <AccordionTrigger className="flex h-8 w-8 items-center justify-center rounded-md bg-muted" />
          </div>
          <AccordionContent>
            <CardContent className="mt-2 rounded-sm bg-muted/50 pt-2">
              {/* Topics */}
              <NestedSortableList
                title="Topics"
                items={topics}
                emptyMessage="Drag or create topics here"
                lessonId={lesson._id}
                dropzoneType="topicDropzone"
                renderItem={(topic) => (
                  <div className="flex items-center justify-between">
                    <span>{topic.title}</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onRemoveTopic(topic._id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                DropzoneComponent={TopicDropzone} // Pass the imported component directly
              />
              <Separator className="my-4" />
              {/* Quizzes */}
              <NestedSortableList
                title="Quizzes"
                items={quizzes}
                emptyMessage="Drag or create quizzes here"
                lessonId={lesson._id}
                dropzoneType="quizDropzone"
                renderItem={(quiz) => (
                  <div className="flex items-center justify-between">
                    <span>{quiz.title}</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onRemoveQuiz(quiz._id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                DropzoneComponent={QuizDropzone} // Pass the imported component directly
              />
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default LessonCard;
