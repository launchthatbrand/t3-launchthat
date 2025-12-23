import type { Id } from "./lib/convexId";

export type MetaValue = string | number | boolean | null;

// LMS content is stored in Convex component-scoped tables (e.g. `launchthat_lms:posts`),
// so IDs are plain strings (they are not compatible with app-scoped `GenericId<"posts">`).
export type LmsPostId = string;

export interface LmsCourseStructureItem {
  lessonId: LmsPostId;
}

export interface LmsBuilderLesson {
  _id: LmsPostId;
  title: string;
  content?: string;
  excerpt?: string;
  status?: string;
  order?: number;
  slug?: string;
  certificateId?: LmsPostId;
}

export interface LmsBuilderTopic {
  _id: LmsPostId;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  lessonId?: LmsPostId;
  order?: number;
  certificateId?: LmsPostId;
}

export interface LmsBuilderQuiz {
  _id: LmsPostId;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  lessonId?: LmsPostId;
  topicId?: LmsPostId;
  order?: number;
  isFinal?: boolean;
}

export interface LmsBuilderCertificate {
  _id: LmsPostId;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  status?: string;
}

export interface LmsCourseBuilderData {
  course: {
    _id: LmsPostId;
    slug?: string;
    title: string;
    excerpt?: string;
    status?: string;
    certificateId?: LmsPostId;
    courseStructure: LmsCourseStructureItem[];
  };
  attachedLessons: LmsBuilderLesson[];
  attachedTopics: LmsBuilderTopic[];
  attachedQuizzes: LmsBuilderQuiz[];
  attachedCertificates?: LmsBuilderCertificate[];
}

export type QuizQuestionType =
  | "singleChoice"
  | "multipleChoice"
  | "shortText"
  | "longText";

export const QUIZ_QUESTION_TYPES: QuizQuestionType[] = [
  "singleChoice",
  "multipleChoice",
  "shortText",
  "longText",
];

export const DEFAULT_QUIZ_QUESTION_TYPE: QuizQuestionType = "singleChoice";

export const questionTypeSupportsOptions = (type: QuizQuestionType) =>
  type === "singleChoice" || type === "multipleChoice";

export const questionTypeSupportsAnswerText = (type: QuizQuestionType) =>
  type === "shortText" || type === "longText";

export interface QuizQuestionOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  _id: LmsPostId;
  title: string;
  prompt: string;
  quizId: LmsPostId;
  questionType: QuizQuestionType;
  options: QuizQuestionOption[];
  correctOptionIds: string[];
  answerText?: string | null;
  order: number;
}

export interface QuizAttemptSummary {
  _id: string;
  scorePercent: number;
  totalQuestions: number;
  gradedQuestions: number;
  correctCount: number;
  completedAt: number;
  durationMs?: number;
}

export interface QuizQuestionInput {
  prompt: string;
  questionType: QuizQuestionType;
  options?: QuizQuestionOption[];
  correctOptionIds?: string[];
  answerText?: string;
}

const parseJsonArray = <T>(value: MetaValue, fallback: T[]): T[] => {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
  } catch {
    // swallow JSON errors
  }
  return fallback;
};

export const parseQuizQuestionOptions = (
  value: MetaValue,
): QuizQuestionOption[] => {
  const parsed = parseJsonArray<QuizQuestionOption>(value, []);
  return parsed
    .filter(
      (option): option is QuizQuestionOption =>
        option !== null &&
        typeof option === "object" &&
        typeof option.id === "string" &&
        typeof option.label === "string",
    )
    .map((option) => ({
      id: option.id,
      label: option.label,
    }));
};

export const serializeQuizQuestionOptions = (
  options: QuizQuestionOption[] | undefined,
): string => {
  return JSON.stringify(
    (options ?? []).map((option) => ({
      id: option.id,
      label: option.label,
    })),
  );
};

export const parseQuizQuestionAnswers = (value: MetaValue): string[] => {
  const parsed = parseJsonArray<string>(value, []);
  return parsed.filter((answer) => typeof answer === "string");
};

export const serializeQuizQuestionAnswers = (
  answers: string[] | undefined,
): string => {
  return JSON.stringify(answers ?? []);
};
