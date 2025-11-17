"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EditItemDialog } from "@/components/EditItemDialog";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { toast } from "@acme/ui/toast";

export default function QuizPage() {
  const params = useParams();
  const { courseId, lessonId, quizId } = params as {
    courseId: string;
    lessonId: string;
    quizId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId,
  });

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const quiz = data.attachedQuizzes.find((q) => q._id === quizId);
  if (!quiz) return <div>Quiz not found.</div>;

  const updateQuizTitle = useMutation(api.lms.quizzes.mutations.updateTitle);

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const handleSelect = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
  };

  const handleSave = async (values: { title: string }) => {
    await updateQuizTitle({ quizId, title: values.title });
    toast.success("Quiz updated");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{quiz.title}</CardTitle>
        <EditItemDialog
          dialogTitle="Edit Quiz"
          initialTitle={quiz.title}
          onSubmit={handleSave}
        />
      </CardHeader>
      <CardContent>
        {quiz.description && (
          <p className="mb-4 text-sm text-muted-foreground">
            {quiz.description}
          </p>
        )}

        {quiz.questions && quiz.questions.length > 0 ? (
          <div className="space-y-8">
            {quiz.questions.map((q, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="text-lg font-medium">
                  {idx + 1}. {q.questionText}
                </h3>

                {/* Multiple choice options */}
                {q.options && (
                  <RadioGroup
                    value={answers[idx] ?? ""}
                    onValueChange={(v) => handleSelect(idx, v)}
                  >
                    {q.options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <RadioGroupItem value={opt} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}

                {submitted && (
                  <p
                    className={
                      q.correctAnswer === answers[idx]
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {q.correctAnswer === answers[idx]
                      ? "Correct!"
                      : `Incorrect. Correct answer: ${q.correctAnswer}`}
                  </p>
                )}
              </div>
            ))}

            {!submitted && (
              <Button onClick={handleSubmitQuiz}>Submit Quiz</Button>
            )}

            {submitted && (
              <p className="mt-4 font-medium">
                Score:{" "}
                {
                  Object.keys(answers).filter(
                    (k) =>
                      quiz.questions?.[Number(k)].correctAnswer === answers[k],
                  ).length
                }
                /{quiz.questions.length}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No questions yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
