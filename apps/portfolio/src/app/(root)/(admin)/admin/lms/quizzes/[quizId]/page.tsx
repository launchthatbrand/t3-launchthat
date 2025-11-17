"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";

import QuizForm, { QuizFormValues } from "../_components/QuizForm";

export default function AdminQuizEditPage() {
  const params = useParams();
  const { quizId } = params as { quizId: string };

  const quiz = useQuery(api.lms.quizzes.queries.getQuiz, {
    quizId,
  });

  const updateQuiz = useMutation(api.lms.quizzes.mutations.update);

  const handleSubmit = async (values: QuizFormValues) => {
    try {
      await updateQuiz({
        quizId,
        title: values.title,
        description: values.description,
        questions: values.questions?.map((q) => ({
          type: "single-choice" as const,
          questionText: q.questionText,
          options: q.options.map((o) => o.value),
          explanation: undefined,
          correctAnswer: q.options[q.correctIndex]?.value ?? "",
        })),
        isPublished: values.status === "published",
      });
      toast.success("Quiz updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quiz");
    }
  };

  if (quiz === undefined) return <div>Loading...</div>;
  if (quiz === null) return <div>Quiz not found.</div>;

  return (
    <QuizForm
      initialData={{
        title: quiz.title,
        description: quiz.description ?? "",
        questions: quiz.questions ?? [],
        status: quiz.isPublished ? "published" : "draft",
      }}
      onSubmit={handleSubmit}
      isSubmitting={false}
      submitButtonText="Save Quiz"
    />
  );
}
