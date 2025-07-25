"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CourseSidebarTrigger } from "@acme/ui/course-sidebar";
import { Separator } from "@acme/ui/separator";

const CourseHeader = () => {
  const params = useParams();
  const { courseId } = params as {
    courseId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const course = data.course;
  // if (!lesson) return <div>Lesson not found.</div>;
  return (
    <Card className="flex items-center rounded-none rounded-b-2xl bg-primary md:h-56">
      <CardContent className="p-0">
        <CardHeader className="flex flex-row items-center gap-3">
          <CardTitle className="flex gap-2 text-4xl font-bold text-white">
            {course.title}
          </CardTitle>
          <Badge variant="outline" className="text-md bg-white">
            Course
          </Badge>
          {/* <div className="bg-red-300">ASADSASD</div> */}
        </CardHeader>
      </CardContent>
    </Card>
  );
  return <div className="flex h-64 flex-col gap-4 bg-blue-500">HEADER</div>;
};

export default CourseHeader;
