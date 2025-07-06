"use client";

// Import Shadcn components for layout
import React from "react";
import { useRouter } from "next/navigation"; // For redirection
// Import Convex mutation hook and API reference
import { useMutation } from "convex/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

// Import the shared form component
import { CourseForm } from "../_components/course-form";
import { api } from "../../../../../../../../convex/_generated/api";

// Import the form values type (optional but good practice)
// import type { CourseFormValues } from "../_components/course-form"; // Type definition is local to course-form.tsx

// Import Sonner for toasts (optional)
// import { toast } from "sonner";

export default function CreateCoursePage() {
  const router = useRouter();

  // Set up the Convex mutation for creating a course
  const createCourse = useMutation(api.courses.createCourse);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Define the submit handler for the form
  const handleSubmit = async (values: {
    title: string;
    description?: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Call the Convex mutation
      const courseId = await createCourse(values);
      console.log("Course created with ID:", courseId);
      // toast.success("Course created successfully!"); // Optional success toast

      // Redirect back to the courses list page
      router.push("/admin/courses");
      // Optionally, trigger a re-fetch or rely on Convex's real-time updates
      // router.refresh(); // Could be used if not relying solely on real-time
    } catch (error) {
      console.error("Failed to create course:", error);
      // toast.error("Failed to create course. Please try again."); // Optional error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Course</CardTitle>
        <CardDescription>
          Fill in the details for the new course.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CourseForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </CardContent>
    </Card>
  );
}
