"use client";

import Link from "next/link";

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
} from "../../types";

export interface StructuredLessonEntry {
  lesson: LmsBuilderLesson;
  topics: LmsBuilderTopic[];
  quizzes: LmsBuilderQuiz[];
}

interface CourseStructureProps {
  lessons: StructuredLessonEntry[];
  baseCoursePath: string;
  standaloneQuizzes?: LmsBuilderQuiz[];
}

const LESSON_LEVEL_QUIZ_KEY = "__lesson__";

export function CourseStructure({
  lessons,
  baseCoursePath,
  standaloneQuizzes = [],
}: CourseStructureProps) {
  if (lessons.length === 0 && standaloneQuizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          This course does not have any lessons yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {lessons.length > 0 && (
        <Accordion type="multiple" className="space-y-3">
          {lessons.map(({ lesson, topics, quizzes }) => {
            const lessonPath = `${baseCoursePath}/lesson/${lesson.slug ?? lesson._id}`;
            const quizzesByTopic = groupQuizzesByTopic(quizzes);
            const lessonLevelQuizzes =
              quizzesByTopic.get(LESSON_LEVEL_QUIZ_KEY) ?? [];

            return (
              <AccordionItem
                key={lesson._id}
                value={lesson._id}
                className="rounded-3xl border px-4"
              >
                <AccordionTrigger className="text-left">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Lesson
                    </p>
                    <h3 className="text-lg font-semibold">{lesson.title}</h3>
                    {lesson.excerpt && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {lesson.excerpt}
                      </p>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pb-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Badge variant="outline">{topics.length} topics</Badge>
                    <Badge variant="outline">{quizzes.length} quizzes</Badge>
                  </div>

                  {topics.length > 0 && (
                    <div className="space-y-3">
                      <HeaderLabel title="Topics" />
                      <div className="space-y-2">
                        {topics.map((topic) => (
                          <TopicItem
                            key={topic._id}
                            lessonPath={lessonPath}
                            topic={topic}
                            topicQuizzes={quizzesByTopic.get(topic._id) ?? []}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {lessonLevelQuizzes.length > 0 && (
                    <div className="space-y-3">
                      <HeaderLabel title="Lesson quizzes" />
                      <QuizList
                        lessonPath={lessonPath}
                        quizzes={lessonLevelQuizzes}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" asChild>
                      <Link href={lessonPath}>View lesson</Link>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {topics.length} topics · {quizzes.length} quizzes
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {standaloneQuizzes.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Final assessment
              </p>
              <h3 className="text-lg font-semibold">Course-wide quizzes</h3>
              <p className="text-sm text-muted-foreground">
                These quizzes are not tied to a specific lesson and typically
                act as final exams or certification checkpoints.
              </p>
            </div>
            <QuizList lessonPath={baseCoursePath} quizzes={standaloneQuizzes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TopicItem({
  lessonPath,
  topic,
  topicQuizzes,
}: {
  lessonPath: string;
  topic: LmsBuilderTopic;
  topicQuizzes: LmsBuilderQuiz[];
}) {
  const topicPath = `${lessonPath}/topic/${topic.slug ?? topic._id}`;
  const hasQuizzes = topicQuizzes.length > 0;

  return (
    <div className="rounded-2xl border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Topic
          </p>
          <p className="font-medium">{topic.title}</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href={topicPath}>View topic</Link>
        </Button>
      </div>
      {topic.excerpt && (
        <p className="mt-2 text-sm text-muted-foreground">{topic.excerpt}</p>
      )}

      {hasQuizzes && (
        <div className="mt-3 space-y-2">
          <Separator />
          <HeaderLabel title="Topic quizzes" compact />
          <QuizList lessonPath={lessonPath} quizzes={topicQuizzes} dense />
        </div>
      )}
    </div>
  );
}

function QuizList({
  lessonPath,
  quizzes,
  dense = false,
}: {
  lessonPath: string;
  quizzes: LmsBuilderQuiz[];
  dense?: boolean;
}) {
  return (
    <div className="space-y-2">
      {quizzes.map((quiz) => {
        const quizPath = `${lessonPath}/quiz/${quiz.slug ?? quiz._id}`;
        return (
          <div
            key={quiz._id}
            className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{quiz.title}</p>
              {quiz.excerpt && !dense && (
                <p className="text-xs text-muted-foreground">{quiz.excerpt}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link href={quizPath}>Start</Link>
            </Button>
          </div>
        );
      })}
      {quizzes.length === 0 && (
        <p className="text-sm text-muted-foreground">No quizzes available.</p>
      )}
    </div>
  );
}

function HeaderLabel({
  title,
  compact = false,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
        compact ? "" : "mt-1"
      }`}
    >
      {title}
    </p>
  );
}

function groupQuizzesByTopic(quizzes: LmsBuilderQuiz[]) {
  const map = new Map<string, LmsBuilderQuiz[]>();
  for (const quiz of quizzes) {
    const key = quiz.topicId ?? LESSON_LEVEL_QUIZ_KEY;
    const list = map.get(key) ?? [];
    list.push(quiz);
    map.set(key, list);
  }
  return map;
}
