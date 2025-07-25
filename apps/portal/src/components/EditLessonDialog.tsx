"use client";

import type { LessonFormValues } from "@/app/(root)/(admin)/admin/lessons/_components/LessonForm";
import type { Doc } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import { LessonForm as LessonFormComponent } from "@/app/(root)/(admin)/admin/lessons/_components/LessonForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@acme/ui/button";

interface EditLessonDialogProps {
  lesson: Doc<"lessons">;
  onSave: (values: LessonFormValues) => Promise<void>;
}

export const EditLessonDialog: React.FC<EditLessonDialogProps> = ({
  lesson,
  onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder categories until taxonomy implemented
  const categories = [
    { value: "general", label: "General" },
    { value: "advanced", label: "Advanced" },
  ];

  const handleSubmit = async (values: LessonFormValues) => {
    setIsSubmitting(true);
    await onSave(values);
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
        </DialogHeader>
        <LessonFormComponent
          initialData={{
            title: lesson.title,
            content: lesson.content ?? "",
            excerpt: lesson.excerpt ?? "",
            categories: lesson.categories?.join(", ") ?? "",
            featuredMedia:
              typeof lesson.featuredMedia === "string"
                ? lesson.featuredMedia
                : "",
            status: lesson.isPublished ? "published" : "draft",
            featured: false,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
          submitButtonText="Save Lesson"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditLessonDialog;
