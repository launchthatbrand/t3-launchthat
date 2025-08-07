"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

import { useConvexUser } from "~/hooks/useConvexUser";
import { CompleteContentButton } from "./CompleteContentButton";
import { CourseProgress } from "./CourseProgress";

// import { fetchQuery } from "convex/nextjs";

const CourseHeader = () => {
  const params = useParams();
  const { convexId: userId } = useConvexUser();
  const { courseId, lessonId } = params as {
    courseId: string;
    lessonId?: string;
    topicId?: string;
  };

  console.log("[CourseHeader] params", params);

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  // Get course progress for the user
  const courseProgressByLessons = useQuery(
    api.lms.progress.queries.getCourseProgressByLessons,
    userId
      ? {
          userId,
          courseId: courseId as Id<"courses">,
        }
      : "skip",
  );

  const isCourseProgressLoading = courseProgressByLessons === undefined;

  // if (data === undefined) return <div>Loading...</div>;
  // if (data === null) return <div>Course not found.</div>;

  const course = data?.course;

  const lesson = data?.attachedLessons.find((l) => l._id === lessonId);

  return (
    <Card className="z-20 flex flex-col rounded-none rounded-b-2xl bg-primary">
      <CardContent className="p-0">
        <CardHeader className="flex flex-col gap-2 p-4 md:gap-6 md:p-6">
          {/* Course Title and Badge */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex justify-between gap-4 md:flex-row md:items-center md:justify-start">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-white md:text-4xl">
                {course?.title ?? <Skeleton className="h-8 w-60 bg-white/30" />}
                <ChevronRight className="h-4 w-4" />
                {lesson?.title ?? <Skeleton className="h-8 w-60 bg-white/30" />}
                {/* <Badge
                    variant="outline"
                    className="absolute w-fit -translate-y-1/2 bg-white text-[0.7rem] text-primary"
                  >
                    Course
                  </Badge> */}
              </CardTitle>
            </div>

            {/* Complete Course Button */}
            {/* <div className="flex gap-3">
              <CompleteContentButton
                contentType="course"
                courseId={courseId as Id<"courses">}
                timeSpent={0}
                className="bg-white text-primary hover:bg-gray-100"
                variant="secondary"
                size="lg"
                showProgress={false}
              />
            </div> */}
          </div>

          {/* Course Description */}
          {course?.description && (
            <p className="max-w-4xl text-lg text-white/90">
              {course.description}
            </p>
          )}

          <Separator className="bg-white/20" />

          {/* Course Progress */}
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm md:p-4">
            <h3 className="text-md font-semibold text-white md:text-lg">
              Your Progress
            </h3>
            <CourseProgress
              courseProgressByLessons={courseProgressByLessons}
              lessons={data?.attachedLessons}
              isLoading={isCourseProgressLoading}
              userId={userId}
              courseId={courseId as Id<"courses">}
              className="text-white [&_.text-muted-foreground]:text-white/70"
            />
          </div>
        </CardHeader>
      </CardContent>
    </Card>
  );
};

export default CourseHeader;
