"use client";

import { Badge, Card, cn } from "@acme/ui";
import {
  CourseSidebarProvider,
  CourseSidebarTrigger,
} from "@acme/ui/course-sidebar";
import { ReactNode, useMemo } from "react";
import { useParams, useSelectedLayoutSegment } from "next/navigation";

import { AppSidebar } from "@acme/ui/layout/AppSidebar";
import CourseHeader from "./_components/CourseHeader";
import { CoursesSidebar } from "./_components/CourseSidebar";
import { Id } from "@convex-config/_generated/dataModel";
import LessonSidebar from "./lesson/[lessonId]/_components/LessonSidebar";
import Link from "next/link";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { api } from "@convex-config/_generated/api";
import { useAccessContext } from "../../layout"; // Import the access context
import { useQuery } from "convex/react";

interface CourseLayoutProps {
  children: ReactNode;
}

export default function CourseLayout({ children }: CourseLayoutProps) {
  const params = useParams();
  const { courseId, lessonId } = params as {
    courseId: string;
    lessonId: string;
  };

  // Use the global access context
  const { hasAccess, isLoading, reason, accessRules, userTags } =
    useAccessContext();

  // Get course data for the header
  const courseData = useQuery(api.lms.courses.queries.getCourse, {
    courseId: courseId as Id<"courses">,
  });

  // Provide safe fallbacks while data is loading to keep hook order consistent
  const course = courseData?.course;
  const attachedLessons = courseData?.attachedLessons ?? [];
  const attachedTopics = courseData?.attachedTopics ?? [];
  const attachedQuizzes = courseData?.attachedQuizzes ?? [];

  const lessonMap = useMemo(
    () => new Map(attachedLessons.map((l) => [l._id, l])),
    [attachedLessons],
  );

  // Show access denied if no access
  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md border-destructive">
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold text-destructive">
              Access Restricted
            </h2>
            <p className="mb-4 text-muted-foreground">
              You don't have permission to access "{courseData.title}"
            </p>
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">
                Access Denied
              </p>
              <p className="text-sm text-destructive/80">{reason}</p>
            </div>

            {accessRules && (
              <div className="mt-4">
                <h3 className="text-sm font-medium">Access Requirements</h3>

                {accessRules.requiredTags.tagIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Required tags (must have{" "}
                      {accessRules.requiredTags.mode === "all"
                        ? "ALL"
                        : "AT LEAST ONE"}
                      ):
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {accessRules.requiredTags.tagIds.map((tagId: string) => (
                        <Badge
                          key={tagId}
                          variant="outline"
                          className="text-xs"
                        >
                          {tagId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {accessRules.excludedTags.tagIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Must NOT have{" "}
                      {accessRules.excludedTags.mode === "all" ? "ALL" : "ANY"}{" "}
                      of:
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {accessRules.excludedTags.tagIds.map((tagId: string) => (
                        <Badge
                          key={tagId}
                          variant="destructive"
                          className="text-xs"
                        >
                          {tagId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">
                    Your current tags:
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {userTags.map((tag: any, index: number) => (
                      <Badge
                        key={tag.marketingTag._id}
                        variant="secondary"
                        className="bg-blue-50 text-xs"
                      >
                        {tag.marketingTag.name} - {tag.marketingTag._id}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Render the normal course layout if access is granted
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
