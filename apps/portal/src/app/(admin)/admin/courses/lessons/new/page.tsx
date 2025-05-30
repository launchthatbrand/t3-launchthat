"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

// Placeholder for the mutation - we'll create this next
// import { createStandaloneLesson } from "@convex-config/api/lessons";

function CreateStandaloneLessonPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use the correct mutation
  const createLesson = useMutation(api.courses.createStandaloneLesson);
  // const createLesson = useMutation(api.lessons.createLesson); // TEMPORARY - using existing for now

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!title.trim()) return; // Basic validation

      setIsLoading(true);
      try {
        // Call the actual mutation
        const lessonId = await createLesson({ title });
        console.log("Created standalone lesson with ID:", lessonId);

        // Clear the form
        setTitle("");

        // Optionally redirect after successful creation (e.g., to a lesson management page)
        // alert(`Lesson "${title}" created successfully!`); // Or use a toast notification
        // router.push(`/admin/courses/lessons`);
        router.push(`/admin/dashboard`); // Redirecting to dashboard for now
      } catch (error) {
        console.error("Failed to create lesson:", error);
        alert("Error creating lesson. See console for details.");
      } finally {
        setIsLoading(false);
      }
    },
    [title, createLesson, router], // Add createLesson and router
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Create New Standalone Lesson</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to React"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Creating..." : "Create Lesson"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateStandaloneLessonPage;
