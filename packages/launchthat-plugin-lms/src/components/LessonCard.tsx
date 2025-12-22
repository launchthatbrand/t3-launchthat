"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Card, CardContent } from "@acme/ui/card";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsPostId,
} from "../types";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { Id } from "../lib/convexId";
import { NestedSortableList } from "./NestedSortableList";
import { QuizDropzone } from "./QuizDropzone";
import { Separator } from "@acme/ui/separator";
import { TopicDropzone } from "./TopicDropzone";

interface LessonCardProps {
  lesson: LmsBuilderLesson;
  topics: LmsBuilderTopic[];
  quizzes: LmsBuilderQuiz[];
  topicSortOrder: "alphabetical" | "date";
  onToggleSortOrder: (lessonId: LmsPostId) => void;
  onRemoveLesson: (lessonId: LmsPostId) => void;
  onRemoveTopic: (topicId: LmsPostId) => void;
  onRemoveQuiz: (quizId: LmsPostId) => void;
}

export const LessonCard = ({
  lesson,
  topics,
  quizzes,
  topicSortOrder,
  onToggleSortOrder,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveQuiz,
}: LessonCardProps) => {
  return (
    <Card className="cursor-default rounded-none border-0 shadow-none">
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
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSortOrder(lesson._id);
                }}
              >
                Sort: {topicSortOrder === "alphabetical" ? "A→Z" : "Date"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
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
              <NestedSortableList
                title="Topics"
                items={topics}
                emptyMessage="Drag or create topics here"
                lessonId={lesson._id as unknown as Id<"posts">}
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
                DropzoneComponent={TopicDropzone}
              />
              <Separator className="my-4" />
              <NestedSortableList
                title="Quizzes"
                items={quizzes}
                emptyMessage="Drag or create quizzes here"
                lessonId={lesson._id as unknown as Id<"posts">}
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
                DropzoneComponent={QuizDropzone}
              />
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

