"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner"; // Changed import path

import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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

// Define the Zod schema for the form
const topicFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  // Add other fields like description, content type later
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

// TODO: Add props for initial data (if editing) and the actual onSubmit handler
interface TopicFormProps {
  // initialData?: Partial<TopicFormValues>; // For editing existing topics
  onSubmit: (values: TopicFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const TopicForm: React.FC<TopicFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      // Initialize other fields if added
    },
  });

  const handleSubmit = async (values: TopicFormValues) => {
    try {
      await onSubmit(values);
      toast.success("Topic saved successfully!");
      // Optionally reset form or redirect
      form.reset(); // Example: Reset form on success
    } catch (error) {
      console.error("Failed to save topic:", error);
      toast.error("Failed to save topic.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Details</CardTitle>
        <CardDescription>Enter the title for the new topic.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Introduction to React Hooks"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The main title of the topic.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add fields for description, content type etc. here */}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Topic"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
