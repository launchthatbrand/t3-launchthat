"use client";

import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { ClipboardList, Layers, PlayCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import type { Id } from "../lib/convexId";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
} from "../types";
import type { StructuredLessonEntry } from "./components/CourseStructure";
import { CourseStructure } from "./components/CourseStructure";
import { HeroStat } from "./components/HeroStat";

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

  const totalTopics = lessons.reduce((sum, lesson) => {
    const lessonTopics = topicsByLesson.get(lesson._id) ?? [];
    return sum + lessonTopics.length;
  }, 0);

  const totalQuizzes = lessons.reduce((sum, lesson) => {
    const lessonQuizzes = quizzesByLesson.get(lesson._id) ?? [];
    return sum + lessonQuizzes.length;
  }, 0);

  const structuredLessons = useMemo<StructuredLessonEntry[]>(() => {
    return course.courseStructure
      .map((item) => {
        const lesson = attachedLessons.find((l) => l._id === item.lessonId);
        if (!lesson) {
          return null;
        }

        const lessonTopics = [...(topicsByLesson.get(lesson._id) ?? [])].sort(
          sortByOrderThenTitle,
        );
        const lessonQuizzes = [...(quizzesByLesson.get(lesson._id) ?? [])].sort(
          sortByOrderThenTitle,
        );

        return {
          lesson,
          topics: lessonTopics,
          quizzes: lessonQuizzes,
        };
      })
      .filter(Boolean) as StructuredLessonEntry[];
  }, [
    course.courseStructure,
    attachedLessons,
    topicsByLesson,
    quizzesByLesson,
  ]);

  const standaloneQuizzes = useMemo(
    () =>
      attachedQuizzes
        .filter((quiz) => !quiz.lessonId)
        .map((quiz) => ({ ...quiz }))
        .sort(sortByOrderThenTitle),
    [attachedQuizzes],
  );

  if (isLoading) {
    return (
      <div className="container space-y-4 py-16">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isMissing) {
    return (
      <div className="container py-16 text-center text-muted-foreground">
        Course not found.
      </div>
    );
  }

  return (
    <div className="space-y-10 bg-gradient-to-b from-muted/50 via-transparent to-transparent py-10">
      <div className="container space-y-6">
        <header className="rounded-3xl bg-background/90 p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full">
              Course
            </Badge>
            <span className="text-sm text-muted-foreground">
              Updated recently
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            {course.title}
          </h1>
          {course.excerpt && (
            <p className="mt-3 text-lg text-muted-foreground">
              {course.excerpt}
            </p>
          )}
          <div className="relative mt-6 grid gap-4 md:grid-cols-3">
            <HeroStat
              label="Lessons"
              value={lessons.length}
              icon={<Layers className="size-5" />}
            />
            <HeroStat
              label="Topics"
              value={totalTopics}
              icon={<PlayCircle className="size-5" />}
            />
            <HeroStat
              label="Quizzes"
              value={totalQuizzes}
              icon={<ClipboardList className="size-5" />}
            />
          </div>
        </header>

        {structuredLessons.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              This course does not have any lessons yet.
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Course outline</h2>
              <p className="text-sm text-muted-foreground">
                Lessons display their topics and quizzes following the structure
                you defined in the course builder.
              </p>
            </div>
            <CourseStructure
              lessons={structuredLessons}
              standaloneQuizzes={standaloneQuizzes}
              baseCoursePath={baseCoursePath}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function sortByOrderThenTitle<
  T extends { order?: number | null; title: string },
>(a: T, b: T) {
  const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder === bOrder) {
    return a.title.localeCompare(b.title);
  }
  return aOrder - bOrder;
}
