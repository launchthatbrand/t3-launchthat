"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { Badge, Card, cn } from "@acme/ui";
import {
  CourseSidebarProvider,
  CourseSidebarTrigger,
} from "@acme/ui/course-sidebar";
import { AppSidebar } from "@acme/ui/layout/AppSidebar";
import { ScrollArea } from "@acme/ui/scroll-area";

import { Separator } from "~/components/ui/separator";
import CourseHeader from "./_components/CourseHeader";
import { CoursesSidebar } from "./_components/CourseSidebar";
import LessonHeader from "./lesson/[lessonId]/_components/LessonHeader";
import LessonSidebar from "./lesson/[lessonId]/_components/LessonSidebar";

interface CourseLayoutProps {
  children: ReactNode;
}

export default function CourseLayout({ children }: CourseLayoutProps) {
  const params = useParams();
  const { courseId, lessonId } = params as {
    courseId: string;
    lessonId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

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
    <div>
      {/* <LessonHeader /> */}
      <CourseSidebarProvider className="flex-col gap-3">
        <CourseHeader />
        <div className="sticky top-0 flex flex-col gap-3 p-2 md:flex-row md:gap-0">
          <CoursesSidebar
            variant="floating"
            collapsible="icon"
            className="bg-red-500"
          />
          <Card className="flex flex-1 flex-col rounded-l-none">
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 rounded-lg bg-primary p-3 md:rounded-l-none">
              <div className="flex flex-1 items-center gap-2">
                <CourseSidebarTrigger className="-ml-1 text-white" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-2xl font-bold text-white">
                  {lessonMap.get(lessonId)?.title}
                </h1>
              </div>{" "}
              <Badge variant="outline" className="text-md bg-white">
                Lesson
              </Badge>
            </header>
            {children}
          </Card>
          <div className="order-first hidden w-full items-start md:order-last md:flex md:w-1/4 md:pl-6">
            <LessonSidebar />
          </div>
        </div>
      </CourseSidebarProvider>
    </div>
    // <div className="container md:py-8">
    //   <h1 className="mb-4 text-3xl font-bold">{course.title}</h1>
    //   {course.description && (
    //     <p className="mb-6 max-w-2xl text-muted-foreground">
    //       {course.description}
    //     </p>
    //   )}

    //   <div className="flex gap-6">
    //     {/* Sidebar */}
    //     <aside className="md:w-56 md:flex-shrink-0">
    //       <ScrollArea className="h-auto rounded-md border bg-muted p-2 md:p-4">
    //         <ul className="space-y-2">
    //           {orderedLessons.map((lesson) => (
    //             <li key={lesson!._id}>
    //               <Link
    //                 href={`/courses/${courseId}/lesson/${lesson!._id}`}
    //                 className={cn(
    //                   "block rounded-md px-1 py-2 text-sm transition-colors md:px-3",
    //                   selectedLessonSegment === lesson!._id &&
    //                     !selectedTopicSegment
    //                     ? "bg-muted font-semibold text-primary"
    //                     : "hover:bg-accent hover:text-foreground",
    //                 )}
    //               >
    //                 {lesson!.title}
    //               </Link>
    //               {/* Nested topics */}
    //               <ul className="ml-2 mt-1 space-y-1 border-l pl-3 md:ml-4">
    //                 {topicsByLesson.get(lesson!._id)?.map((topic) => (
    //                   <li key={topic._id}>
    //                     <Link
    //                       href={`/courses/${courseId}/lesson/${lesson!._id}/topic/${topic._id}`}
    //                       className={cn(
    //                         "block text-sm transition-colors",
    //                         selectedTopicSegment === topic._id
    //                           ? "font-semibold text-primary"
    //                           : "text-muted-foreground hover:text-foreground",
    //                       )}
    //                     >
    //                       {topic.title}
    //                     </Link>
    //                   </li>
    //                 ))}
    //                 {quizzesByLesson.get(lesson!._id)?.map((quiz) => (
    //                   <li key={quiz._id}>
    //                     <Link
    //                       href={`/courses/${courseId}/lesson/${lesson!._id}/quiz/${quiz._id}`}
    //                       className={cn(
    //                         "block text-sm transition-colors",
    //                         selectedQuizSegment === quiz._id
    //                           ? "font-semibold text-primary"
    //                           : "text-muted-foreground hover:text-foreground",
    //                       )}
    //                     >
    //                       Quiz: {quiz.title}
    //                     </Link>
    //                   </li>
    //                 ))}
    //               </ul>
    //             </li>
    //           ))}
    //         </ul>
    //       </ScrollArea>
    //     </aside>

    //     {/* Main outlet */}
    //     <section className="flex-1">{children}</section>
    //   </div>
    // </div>
  );
}
