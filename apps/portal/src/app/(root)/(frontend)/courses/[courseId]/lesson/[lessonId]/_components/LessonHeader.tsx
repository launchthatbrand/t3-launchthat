"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CourseSidebarTrigger } from "@acme/ui/course-sidebar";
import { Separator } from "@acme/ui/separator";

const LessonHeader = () => {
  const params = useParams();
  const { courseId, lessonId } = params as {
    courseId: string;
    lessonId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId,
  });

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const course = data.course;
  const lesson = data.attachedLessons.find((l) => l._id === lessonId);
  // if (!lesson) return <div>Lesson not found.</div>;
  return (
    <Card className="flex h-56 items-center bg-primary">
      <CardContent>
        <CardHeader>
          <h1 className="flex gap-2 text-3xl font-bold text-white">
            {course.title} <Badge variant="outline">Course</Badge>
          </h1>

          <CardTitle className="flex gap-2 text-2xl font-bold text-white">
            {lesson?.title ?? "Lesson"}
            <Badge variant="outline" className="text-white">
              Lesson
            </Badge>
          </CardTitle>
          {/* <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Edit Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>Edit Lesson</DialogTitle>
              </DialogHeader>
              <LessonForm
                initialData={{
                  _id: lesson._id,
                  title: lesson.title,
                  content: lesson.content ?? "",
                  excerpt: lesson.excerpt ?? "",
                  categories: lesson.categories?.join(", ") ?? "",
                  featuredMedia: lesson.featuredMedia ?? "",
                  status: lesson.isPublished ? "published" : "draft",
                  featured: false,
                }}
                onSubmit={handleUpdate}
                isSubmitting={false}
                categories={[]}
                submitButtonText="Save Lesson"
              />
            </DialogContent>
          </Dialog> */}
        </CardHeader>
      </CardContent>
    </Card>
  );
  return <div className="flex h-64 flex-col gap-4 bg-blue-500">HEADER</div>;
};

export default LessonHeader;
