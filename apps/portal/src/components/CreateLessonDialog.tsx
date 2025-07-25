"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { toast } from "@acme/ui/toast";

import type { LessonFormValues } from "../app/(root)/(admin)/admin/lessons/_components/LessonForm";
import { LessonForm as LessonFormComponent } from "../app/(root)/(admin)/admin/lessons/_components/LessonForm";

interface CreateLessonDialogProps {
  courseId: Id<"courses">;
  onCreate: (lessonId: Id<"lessons">) => Promise<void>;
}

export const CreateLessonDialog: React.FC<CreateLessonDialogProps> = ({
  courseId: _courseId,
  onCreate,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder categories until taxonomy implemented
  const categories = [
    { value: "general", label: "General" },
    { value: "advanced", label: "Advanced" },
  ];

  const handleSubmit = async (_values: LessonFormValues) => {
    setIsSubmitting(true);
    try {
      // This is a placeholder for actual lesson creation logic if needed
      // For now, we only call onCreate with a dummy ID
      await onCreate("" as Id<"lessons">); // Will be replaced by actual ID
      toast.success("Lesson created!");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create lesson:", error);
      toast.error("Failed to create lesson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full md:w-auto">
          New Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create New Lesson</DialogTitle>
        </DialogHeader>
        <LessonFormComponent
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
          submitButtonText="Create Lesson"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateLessonDialog;
