"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

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

export default function ViewCoursePage() {
  // useParams returns a readonly record; spread into a new object to avoid readonly issues
  const { courseId } = useParams() as { courseId: string };
  // Cast to Convex Id type
  const courseIdTyped = courseId as Id<"courses">;

  // Type the query result explicitly
  const course = useQuery(api.lms.index.getCourse, {
    courseId: courseIdTyped,
  });

  if (course === undefined) {
    return <div>Loading course details...</div>;
  }

  if (course === null) {
    return <div>Course not found.</div>;
  }

  // At this point, 'course' is guaranteed to be Doc<"courses">
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{course.title}</CardTitle>
          <CardDescription>
            Course ID: {course._id} - Created:{" "}
            {new Date(course._creationTime).toLocaleDateString()}
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
        {course.productId && (
          <p className="mt-4 text-sm text-muted-foreground">
            Linked Product ID: {course.productId}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/admin/courses/${course._id}/edit`}>Edit Course</Link>
        </Button>
        <Button asChild variant="secondary" className="ml-2">
          <Link href="/admin/courses">Back to List</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
