"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { cn } from "@acme/ui";
import { ScrollArea } from "@acme/ui/scroll-area";

interface CourseLayoutProps {
  children: ReactNode;
}

export default function CourseLayout({ children }: CourseLayoutProps) {
  const params = useParams();
  const courseId = params.courseId as string | undefined;

  const data = useQuery(
    api.lms.courses.queries.getCourseStructureWithItems,
    courseId ? { courseId } : "skip",
  );

  // Provide safe fallbacks while data is loading to keep hook order consistent
  const course = data?.course;
  const attachedLessons = data?.attachedLessons ?? [];
  const attachedTopics = data?.attachedTopics ?? [];
  const attachedQuizzes = data?.attachedQuizzes ?? [];

  const lessonMap = useMemo(
    () => new Map(attachedLessons.map((l) => [l._id, l])),
    [attachedLessons],
  );

  const topicsByLesson = useMemo(() => {
    const map = new Map<string, typeof attachedTopics>();
    attachedLessons.forEach((l) => {
      map.set(
        l._id,
        attachedTopics.filter((t) => t.lessonId === l._id),
      );
    });
    return map;
  }, [attachedLessons, attachedTopics]);

  const quizzesByLesson = useMemo(() => {
    const map = new Map<string, typeof attachedQuizzes>();
    attachedLessons.forEach((l) => {
      map.set(
        l._id,
        attachedQuizzes.filter((q) => q.lessonId === l._id),
      );
    });
    return map;
  }, [attachedLessons, attachedQuizzes]);

  const orderedLessons = useMemo(() => {
    return (course?.courseStructure ?? [])
      .map((s) => lessonMap.get(s.lessonId))
      .filter(Boolean);
  }, [course?.courseStructure, lessonMap]);

  // current selected params from route – useSelectedLayoutSegment gives dynamic segment names
  const selectedLessonSegment = useSelectedLayoutSegment("lesson");
  const selectedTopicSegment = useSelectedLayoutSegment("topic");
  const selectedQuizSegment = useSelectedLayoutSegment("quiz");

  // Loading / not-found states after hooks to maintain consistent order
  if (data === undefined) {
    return <div className="container py-8">Loading...</div>;
  }

  if (data === null || !course) {
    return <div className="container py-8">Course not found.</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="mb-4 text-3xl font-bold">{course.title}</h1>
      {course.description && (
        <p className="mb-6 max-w-2xl text-muted-foreground">
          {course.description}
        </p>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <aside className="md:w-64 md:flex-shrink-0">
          <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-4">
            <ul className="space-y-2">
              {orderedLessons.map((lesson) => (
                <li key={lesson!._id}>
                  <Link
                    href={`/courses/${courseId}/lesson/${lesson!._id}`}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      selectedLessonSegment === lesson!._id &&
                        !selectedTopicSegment
                        ? "bg-muted font-semibold text-primary"
                        : "hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {lesson!.title}
                  </Link>
                  {/* Nested topics */}
                  <ul className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {topicsByLesson.get(lesson!._id)?.map((topic) => (
                      <li key={topic._id}>
                        <Link
                          href={`/courses/${courseId}/lesson/${lesson!._id}/topic/${topic._id}`}
                          className={cn(
                            "block text-sm transition-colors",
                            selectedTopicSegment === topic._id
                              ? "font-semibold text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {topic.title}
                        </Link>
                      </li>
                    ))}
                    {quizzesByLesson.get(lesson!._id)?.map((quiz) => (
                      <li key={quiz._id}>
                        <Link
                          href={`/courses/${courseId}/lesson/${lesson!._id}/quiz/${quiz._id}`}
                          className={cn(
                            "block text-sm transition-colors",
                            selectedQuizSegment === quiz._id
                              ? "font-semibold text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Quiz: {quiz.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </aside>

        {/* Main outlet */}
        <section className="flex-1">{children}</section>
      </div>
    </div>
  );
}
