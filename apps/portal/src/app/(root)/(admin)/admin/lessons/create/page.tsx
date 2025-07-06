"use client";

import React from "react";
import { notFound } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";

import LessonForm, { LessonFormValues } from "../_components/LessonForm";

const LessonCreatePage: React.FC = () => {
  // Dummy categories until categories system implemented
  const categories = [
    { value: "general", label: "General" },
    { value: "advanced", label: "Advanced" },
  ];

  const createLesson = useMutation(api.lms.lessons.index.create);

  const handleSubmit = async (values: LessonFormValues) => {
    await createLesson({
      title: values.title,
      content: values.content,
      excerpt: values.excerpt,
      categories: values.categories
        ? values.categories
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : undefined,
      featuredImage: values.featuredImageUrl,
      isPublished: values.status === "published",
    });
    // TODO: redirect or toast
  };

  return (
    <LessonForm
      onSubmit={handleSubmit}
      isSubmitting={false}
      categories={categories}
    />
  );
};

export default LessonCreatePage;
