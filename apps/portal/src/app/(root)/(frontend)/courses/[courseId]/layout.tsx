import { ReactNode } from "react";

import { Badge, Card } from "@acme/ui";
import {
  CourseSidebarProvider,
  CourseSidebarTrigger,
} from "@acme/ui/course-sidebar";

import { Separator } from "~/components/ui/separator";
import CourseHeader from "./_components/CourseHeader";
import { CoursesSidebar } from "./_components/CourseSidebar";
import LessonHeader from "./lesson/[lessonId]/_components/LessonHeader";
import LessonSidebar from "./lesson/[lessonId]/_components/LessonSidebar";

interface CourseLayoutProps {
  children: ReactNode;
  params: Promise<{
    courseId: string;
    lessonId?: string;
    topicId?: string;
  }>;
}

export default async function CourseLayout({
  children,
  params,
}: CourseLayoutProps) {
  const resolvedParams = await params;
  const { courseId, lessonId, topicId } = resolvedParams;

  console.log("[CourseLayout] resolvedParams", resolvedParams);

  // Render the course layout - access control is handled by parent AccessGate
  return (
    <div>
      <CourseSidebarProvider className="flex-col gap-3">
        <CourseHeader params={resolvedParams} />
        <div className="sticky top-0 flex flex-col gap-3 p-2 md:flex-row md:gap-0">
          <CoursesSidebar
            variant="floating"
            collapsible="icon"
            className="bg-red-500"
          />
          <Card className="flex flex-1 flex-col rounded-l-none">
            <LessonHeader />
            {/* <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 rounded-lg bg-primary p-3 md:rounded-l-none">
              <div className="flex flex-1 items-center gap-2">
                <CourseSidebarTrigger className="-ml-1 text-white" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-2xl font-bold text-white">
                  {lessonId ? "Lesson" : "Course"}
                </h1>
              </div>
              <Badge variant="outline" className="text-md bg-white">
                {lessonId ? "Lesson" : "Course"}
              </Badge>
            </header> */}
            {children}
          </Card>
          <div className="order-first hidden w-full items-start md:order-last md:flex md:w-1/4 md:pl-6">
            <LessonSidebar />
          </div>
        </div>
      </CourseSidebarProvider>
    </div>
  );
}
