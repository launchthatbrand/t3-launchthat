"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Import Shadcn components
import { Button } from "@acme/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";

// Import Sonner for toasts (assuming it's installed/configured)
// import { toast } from "sonner";

// Define the schema for the course form using Zod
const courseFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional(), // Description is optional
});

// Infer the type for the form values from the schema
type CourseFormValues = z.infer<typeof courseFormSchema>;

// Define props for the CourseForm component
interface CourseFormProps {
  // Function to call when the form is submitted successfully
  onSubmit: (values: CourseFormValues) => Promise<void | string>; // Can return ID or void
  // Add _id to initialData type definition for edit check
  initialData?: Partial<CourseFormValues & { _id?: string }>; // For editing later
  isSubmitting?: boolean; // To control button loading state
}

/**
 * A form component for creating or editing a course.
 */
export function CourseForm({
  onSubmit,
  initialData = {},
  isSubmitting = false,
}: CourseFormProps) {
  // Initialize react-hook-form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema), // Use Zod for validation
    defaultValues: initialData, // Set initial values if editing
    mode: "onChange", // Validate on change for better UX
  });

  // Handle form submission
  const handleFormSubmit = async (values: CourseFormValues) => {
    try {
      await onSubmit(values);
      // Optionally, show a success toast message
      // toast.success(initialData?._id ? "Course updated!" : "Course created!");
    } catch (error) {
      console.error("Form submission error:", error);
      // Optionally, show an error toast message
      // toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)} // Use react-hook-form's handleSubmit
        className="space-y-8" // Add spacing between form elements
      >
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Introduction to Web Development"
                  {...field}
                />
              </FormControl>
              <FormDescription>The main title of the course.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                {/* Use Textarea component from Shadcn */}
                <Textarea
                  placeholder="A brief summary of the course content..."
                  className="resize-none" // Prevent resizing
                  {...field}
                  // Ensure value is never null/undefined for Textarea
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                A short description of what the course covers (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {/* Dynamically change button text based on submitting state and whether it's an edit */}
          {isSubmitting
            ? "Saving..."
            : initialData._id
              ? "Save Changes"
              : "Create Course"}
        </Button>
      </form>
    </Form>
  );
}
