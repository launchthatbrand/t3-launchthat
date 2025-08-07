"use client";

import type { CourseFormValues } from "@/components/CourseForm";
import type { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CourseForm } from "@/components/CourseForm";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

export default function EditCoursePage() {
  const params = useParams();
  const courseIdTyped = params.courseId as unknown as Id<"courses">;

  // Fetch course details
  const course = useQuery(api.lms.courses.index.getCourse, {
    courseId: courseIdTyped,
  });

  const updateCourse = useMutation(api.lms.courses.index.updateCourse);

  if (course === undefined) {
    return <div>Loading course details...</div>;
  }

  if (course === null) {
    return <div>Course not found.</div>;
  }

  const lessonCount = course.courseStructure?.length ?? 0;

  const handleSaveCourse = async (values: CourseFormValues) => {
    await updateCourse({
      courseId: courseIdTyped,
      title: values.title,
      description: values.description,
      isPublished: values.isPublished ?? false,
    });
    toast.success("Course updated");
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Edit Course</h2>
      </div>

      <CourseForm
        initialData={{
          title: course.title,
          description: course.description ?? "",
          isPublished: course.isPublished ?? false,
        }}
        onSubmit={handleSaveCourse}
        isSubmitting={false}
        submitButtonText="Save Course"
      />

      <Separator className="my-8" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>
              Course ID: {course._id} – Created:{" "}
              {new Date(course._creationTime).toLocaleDateString()}
              {lessonCount > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  Lessons: {lessonCount}
                </span>
              )}
            </CardDescription>
          </div>
          {course.isPublished !== undefined && (
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Description:</p>
          <p>{course.description ?? "No description provided."}</p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="secondary">
            <Link href="/admin/courses">Back to List</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
