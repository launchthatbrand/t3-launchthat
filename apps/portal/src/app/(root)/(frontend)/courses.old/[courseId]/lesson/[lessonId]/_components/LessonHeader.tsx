"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";
import { CheckCircle2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CourseSidebarTrigger } from "@acme/ui/course-sidebar";
import { useIsMobile } from "@acme/ui/hooks/use-mobile";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

import { useConvexUser } from "~/hooks/useConvexUser";
import { cn } from "~/lib/utils";
import LessonSidebar from "./LessonSidebar";

const LessonHeader = () => {
  const params = useParams();
  const isMobile = useIsMobile();
  const { convexId: userId, isLoading: _isAuthLoading } = useConvexUser();
  const { courseId, lessonId, topicId } = params as {
    courseId: string;
    lessonId: string;
    topicId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  const lesson = data?.attachedLessons.find((l) => l._id === lessonId);

  const topic = data?.attachedTopics.find((t) => t._id === topicId);

  const isCompleted = useQuery(
    api.lms.progress.queries.isItemCompleted,
    userId && topicId
      ? {
          userId,
          itemId: topicId as Id<"topics">,
        }
      : "skip",
  );

  // if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  // const course = data.course;
  // const lesson = data.attachedLessons.find((l) => l._id === lessonId);
  // if (!lesson) return <div>Lesson not found.</div>;
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-col">
      {topicId && (
        <Card className="overflow-hidden rounded-b-none md:rounded-l-none md:rounded-r-none md:rounded-r-xl">
          <Accordion
            type="single"
            collapsible
            defaultValue="item-1"
            className="sticky top-14 z-20 p-0"
          >
            <AccordionItem value="item-1 p-0">
              <CardHeader className="sticky:shadow-lg top-14 z-10 flex flex-col justify-between gap-3 space-y-0 bg-primary p-3 lg:sticky">
                <div className="flex flex-row items-center justify-between gap-2 bg-primary">
                  <div className="flex flex-row items-center justify-between gap-2">
                    <CourseSidebarTrigger className="-ml-1 text-white" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <CardTitle className="flex gap-2 text-2xl font-bold text-white">
                      {topic?.title || <Skeleton className="h-8 w-32" />}
                    </CardTitle>{" "}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-md flex gap-3", {
                      "bg-green-500 text-white": isCompleted,
                      "bg-white": !isCompleted,
                    })}
                  >
                    Topic
                    {isCompleted && <CheckCircle2 className="h-5 w-5" />}
                  </Badge>
                </div>

                {/* Course Progress Indicator */}
                {/* {courseProgress && (
              <div className="text-sm text-muted-foreground">
                Course Progress: {courseProgress.percentComplete}% (
                {courseProgress.completed}/{courseProgress.total} items
                completed)
              </div>
            )} */}

                {isMobile && (
                  <AccordionTrigger className="rounded-md bg-slate-100 p-3 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:rounded-md [&>svg]:bg-white [&>svg]:shadow-md">
                    Additional Information
                  </AccordionTrigger>
                )}
              </CardHeader>

              <AccordionContent className="bg-slate-100 p-4 md:hidden">
                <LessonSidebar />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}
    </header>
  );
  return <div className="flex h-64 flex-col gap-4 bg-blue-500">HEADER</div>;
};

export default LessonHeader;
