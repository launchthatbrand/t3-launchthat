"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { CompleteContentButton } from "./CompleteContentButton";
import { CourseProgress } from "./CourseProgress";
import { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { api } from "@convex-config/_generated/api";
import { useConvexUser } from "~/hooks/useConvexUser";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

const CourseHeader = () => {
  const params = useParams();
  const { convexId: userId } = useConvexUser();
  const { courseId } = params as {
    courseId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  // Get course progress for the user
  const courseProgressByLessons = useQuery(
    api.lms.progress.index.getCourseProgressByLessons,
    userId
      ? {
          userId,
          courseId: courseId as Id<"courses">,
        }
      : "skip",
  );

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const course = data.course;

  return (
    <Card className="z-20 flex flex-col rounded-none rounded-b-2xl bg-primary">
      <CardContent className="p-0">
        <CardHeader className="flex flex-col gap-6 p-6">
          {/* Course Title and Badge */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <CardTitle className="text-3xl font-bold text-white md:text-4xl">
                {course.title}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-md w-fit bg-white text-primary"
              >
                Course
              </Badge>
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
          {course.description && (
            <p className="max-w-4xl text-lg text-white/90">
              {course.description}
            </p>
          )}

          <Separator className="bg-white/20" />

          {/* Course Progress */}
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">Your Progress</h3>
            <CourseProgress
              courseProgressByLessons={courseProgressByLessons}
              lessons={data.attachedLessons}
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
