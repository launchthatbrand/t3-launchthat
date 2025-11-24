"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import type { Id } from "../lib/convexId";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
} from "../types";

interface CourseSingleProps {
  courseId: Id<"posts">;
  courseSlug?: string | null;
  organizationId?: Id<"organizations">;
}

export function CourseSingle({
  courseId,
  courseSlug,
  organizationId,
}: CourseSingleProps) {
  const data = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    organizationId
      ? { courseId, organizationId }
      : {
          courseId,
        },
  );
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [expandedQuizzes, setExpandedQuizzes] = useState<string[]>([]);

  const isLoading = data === undefined;
  const isMissing = data === null;

  const fallbackCourse: LmsCourseBuilderData["course"] = {
    _id: courseId,
    slug: courseSlug ?? undefined,
    title: "Course",
    excerpt: "",
    status: undefined,
    courseStructure: [],
  };

  const course = (data?.course ??
    fallbackCourse) as LmsCourseBuilderData["course"];
  const attachedLessons = data?.attachedLessons ?? [];
  const attachedTopics = data?.attachedTopics ?? [];
  const attachedQuizzes = data?.attachedQuizzes ?? [];

  const baseCoursePath = `/course/${courseSlug ?? course._id}`;

  const lessons = useMemo(() => {
    return course.courseStructure
      .map((item) =>
        attachedLessons.find((lesson) => lesson._id === item.lessonId),
      )
      .filter(Boolean) as LmsBuilderLesson[];
  }, [course.courseStructure, attachedLessons]);

  const topicsByLesson = useMemo(() => {
    const map = new Map<string, LmsBuilderTopic[]>();
    for (const topic of attachedTopics) {
      if (!topic.lessonId) continue;
      const list = map.get(topic.lessonId) ?? [];
      list.push(topic);
      map.set(topic.lessonId, list);
    }
    return map;
  }, [attachedTopics]);

  const quizzesByLesson = useMemo(() => {
    const map = new Map<string, LmsBuilderQuiz[]>();
    for (const quiz of attachedQuizzes) {
      if (!quiz.lessonId) continue;
      const list = map.get(quiz.lessonId) ?? [];
      list.push(quiz);
      map.set(quiz.lessonId, list);
    }
    return map;
  }, [attachedQuizzes]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>
    );
  }

  if (isMissing) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        Course not found.
      </div>
    );
  }

  return (
    <div className="container space-y-10 py-8">
      <header className="space-y-4">
        <Badge variant="secondary" className="rounded-full">
          Course
        </Badge>
        <h1 className="text-4xl font-bold">{course.title}</h1>
        {course.excerpt && (
          <p className="text-lg text-muted-foreground">{course.excerpt}</p>
        )}
      </header>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This course does not have any lessons yet.
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          value={expandedLessons}
          onValueChange={setExpandedLessons}
          className="space-y-4"
        >
          {lessons.map((lesson) => {
            const lessonTopics = topicsByLesson.get(lesson._id) ?? [];
            const lessonQuizzes = quizzesByLesson.get(lesson._id) ?? [];
            const lessonPath = `${baseCoursePath}/lesson/${lesson.slug ?? lesson._id}`;

            return (
              <AccordionItem key={lesson._id} value={lesson._id}>
                <AccordionTrigger className="items-start gap-4 text-left text-lg font-semibold">
                  <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span>{lesson.title}</span>
                        <Badge variant="outline">Lesson</Badge>
                      </div>
                      {lesson.excerpt && (
                        <p className="text-sm font-normal text-muted-foreground">
                          {lesson.excerpt}
                        </p>
                      )}
                    </div>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={lessonPath}>View lesson</Link>
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="border bg-card">
                    <CardContent className="space-y-6 pt-6">
                      {lessonTopics.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Topics
                          </h3>
                          <Accordion
                            type="multiple"
                            value={expandedTopics}
                            onValueChange={setExpandedTopics}
                            className="space-y-3"
                          >
                            {lessonTopics.map((topic) => {
                              const topicPath = `${lessonPath}/topic/${topic.slug ?? topic._id}`;
                              return (
                                <AccordionItem
                                  key={topic._id}
                                  value={topic._id}
                                >
                                  <AccordionTrigger className="text-left text-base font-medium">
                                    {topic.title}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-4">
                                      {topic.excerpt && (
                                        <p className="text-sm text-muted-foreground">
                                          {topic.excerpt}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">Topic</Badge>
                                        <Button
                                          asChild
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Link href={topicPath}>
                                            View topic
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        </div>
                      )}

                      {lessonQuizzes.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Quizzes
                          </h3>
                          <Accordion
                            type="multiple"
                            value={expandedQuizzes}
                            onValueChange={setExpandedQuizzes}
                            className="space-y-3"
                          >
                            {lessonQuizzes.map((quiz) => {
                              const quizPath = `${lessonPath}/quiz/${quiz.slug ?? quiz._id}`;
                              return (
                                <AccordionItem key={quiz._id} value={quiz._id}>
                                  <AccordionTrigger className="text-left text-base font-medium">
                                    <span className="flex items-center gap-2">
                                      {quiz.title}
                                      <Badge variant="outline">
                                        {quiz.isFinal ? "Final Quiz" : "Quiz"}
                                      </Badge>
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-4">
                                      {quiz.excerpt && (
                                        <p className="text-sm text-muted-foreground">
                                          {quiz.excerpt}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          asChild
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Link href={quizPath}>View quiz</Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
