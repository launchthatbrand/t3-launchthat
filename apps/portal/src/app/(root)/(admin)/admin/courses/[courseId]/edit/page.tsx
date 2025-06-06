"use client";

import type { Id } from "@/../convex/_generated/dataModel"; // Import Id type

// Import Shadcn components for layout
import React from "react";
import { redirect, useRouter } from "next/navigation";
import { api } from "@/../convex/_generated/api";
// Import Convex hooks and API reference
import { useMutation, useQuery } from "convex/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
//import { CourseBuilder } from "../../../_components/course-builder"; // Corrected path
import { CourseBuilderV2 as CourseBuilder } from "@acme/ui/CourseBuilderV2";

// Import the shared form component
import { CourseForm } from "../../_components/course-form";

// Import Sonner for toasts (optional)
// import { toast } from "sonner";

interface CourseEditPageProps {
  params: {
    courseId: Id<"courses">;
  };
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  const router = useRouter();
  const { courseId } = params;

  // Fetch minimal course data to ensure it exists
  // Switched to getCourse as suggested by linter
  const course = useQuery(api.courses.getCourse, { courseId });

  // Set up the Convex mutation for updating the course
  const updateCourse = useMutation(api.courses.updateCourse);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Define the submit handler for the form
  const handleSubmit = async (values: {
    title?: string;
    description?: string;
    isPublished?: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      // Call the Convex mutation, passing the courseId along with updates
      await updateCourse({ courseId, ...values });
      console.log("Course updated successfully:", courseId);
      // toast.success("Course updated successfully!"); // Optional success toast

      // Redirect back to the courses list page
      router.push("/admin/courses");
      // router.refresh(); // Optional refresh
    } catch (error) {
      console.error("Failed to update course:", error);
      // toast.error("Failed to update course. Please try again."); // Optional error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (course === undefined) {
    return <div>Loading course details...</div>;
  }

  // Not found state
  if (course === null) {
    return redirect("/admin/courses"); // Or show a 404 page
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Course</CardTitle>
        <CardDescription>Update the details for this course.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Pass fetched course data as initialData */}
        <CourseForm
          onSubmit={handleSubmit}
          initialData={course}
          isSubmitting={isSubmitting}
        />
        {/* Render CourseBuilder instead of or alongside other edit forms */}
        <CourseBuilder courseId={courseId} />
      </CardContent>
    </Card>
  );
}
