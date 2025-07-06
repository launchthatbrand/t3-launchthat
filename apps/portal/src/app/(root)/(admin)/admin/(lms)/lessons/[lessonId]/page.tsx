"use client";

import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";

import LessonForm, {
  LessonFormValues,
} from "../../../lessons/_components/LessonForm";

export default function AdminLessonEditPage() {
  const params = useParams();
  const { lessonId } = params as { lessonId: string };

  const lesson = useQuery(api.lms.lessons.index.getLesson, { lessonId });

  const updateLesson = useMutation(api.lms.lessons.index.update);

  const handleSubmit = async (values: LessonFormValues) => {
    await updateLesson({
      lessonId,
      title: values.title,
      content: values.content,
      excerpt: values.excerpt,
      categories: values.categories
        ? values.categories.split(",").map((c) => c.trim())
        : undefined,
      featuredImage: values.featuredImageUrl,
      // status handled via isPublished in form values
      isPublished: values.status === "published",
    });
    toast.success("Lesson updated");
  };

  if (lesson === undefined) return <div>Loading...</div>;
  if (lesson === null) return <div>Lesson not found.</div>;

  // Dummy categories placeholder
  const categories = [
    { value: "general", label: "General" },
    { value: "advanced", label: "Advanced" },
  ];

  return (
    <LessonForm
      initialData={{
        title: lesson.title,
        content: lesson.content ?? "",
        excerpt: lesson.excerpt ?? "",
        categories: lesson.categories?.join(", ") ?? "",
        featuredImageUrl: lesson.featuredImage ?? "",
        status: lesson.isPublished ? "published" : "draft",
        featured: false,
      }}
      onSubmit={handleSubmit}
      isSubmitting={false}
      categories={categories}
      submitButtonText="Save Lesson"
    />
  );
}
