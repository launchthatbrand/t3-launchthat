/**
 * Quizzes Helpers
 *
 * Contains shared utility functions for the quizzes feature.
 */
import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";

interface QuizQuestionShape {
  questionText: string;
  correctAnswer: unknown;
  type: "single" | "multiple" | "boolean";
}

function isQuizQuestion(value: unknown): value is QuizQuestionShape {
  if (typeof value !== "object" || value === null) return false;
  const q = value as Record<string, unknown>;
  const hasText = typeof q.questionText === "string";
  const hasType =
    q.type === "single" || q.type === "multiple" || q.type === "boolean";
  const hasAnswer = q.correctAnswer !== undefined;
  return hasText && hasType && hasAnswer;
}

/**
 * Get quiz statistics
 */
export const getQuizStats = async (
  ctx: QueryCtx,
  quizId: Id<"quizzes">,
): Promise<{
  questionCount: number;
  isPublished: boolean;
  hasCorrectAnswers: boolean;
  attachedTo: "course" | "lesson" | "topic" | "unattached";
} | null> => {
  const quizDoc = await ctx.db.get(quizId);
  if (!quizDoc) {
    return null;
  }

  const questionCount = quizDoc.questions?.length ?? 0;
  const isPublished = quizDoc.isPublished ?? false;
  const hasCorrectAnswers = (quizDoc.questions ?? []).every((q) =>
    isQuizQuestion(q),
  );

  let attachedTo: "course" | "lesson" | "topic" | "unattached" = "unattached";
  if (quizDoc.courseId) {
    attachedTo = "course";
  } else if (quizDoc.lessonId) {
    attachedTo = "lesson";
  } else if (quizDoc.topicId) {
    attachedTo = "topic";
  }

  return {
    questionCount,
    isPublished,
    hasCorrectAnswers,
    attachedTo,
  };
};

/**
 * Check if quiz is ready for publication
 */
export const isQuizReadyForPublication = async (
  ctx: QueryCtx,
  quizId: Id<"quizzes">,
): Promise<boolean> => {
  const quizDoc = await ctx.db.get(quizId);
  if (!quizDoc) {
    return false;
  }

  // Quiz must have a title and at least one question
  if (!quizDoc.title || !quizDoc.questions || quizDoc.questions.length === 0) {
    return false;
  }

  // All questions must have correct answers
  const allQuestionsValid = quizDoc.questions.every((question: unknown) =>
    isQuizQuestion(question),
  );

  return allQuestionsValid;
};

/**
 * Calculate quiz completion score
 */
export const calculateQuizScore = (
  userAnswers: (string | string[] | boolean)[],
  correctAnswers: (string | string[] | boolean)[],
): {
  score: number;
  percentage: number;
  totalQuestions: number;
  correctCount: number;
} => {
  if (userAnswers.length !== correctAnswers.length) {
    throw new Error("User answers and correct answers length mismatch");
  }

  const totalQuestions = correctAnswers.length;
  let correctCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const userAnswer = userAnswers[i];
    const correctAnswer = correctAnswers[i];

    // Handle different answer types
    if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
      // Multiple choice - compare arrays
      const isCorrect =
        correctAnswer.length === userAnswer.length &&
        correctAnswer.every((answer) => userAnswer.includes(answer));
      if (isCorrect) correctCount++;
    } else if (userAnswer === correctAnswer) {
      // Single choice or true/false
      correctCount++;
    }
  }

  const percentage =
    totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  return {
    score: correctCount,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    totalQuestions,
    correctCount,
  };
};
