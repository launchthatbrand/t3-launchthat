import type { Id } from "./lib/convexId";

export type MetaValue = string | number | boolean | null;

export interface LmsCourseStructureItem {
  lessonId: Id<"posts">;
}

export interface LmsBuilderLesson {
  _id: Id<"posts">;
  title: string;
  content?: string;
  excerpt?: string;
  status?: string;
  order?: number;
  slug?: string;
}

export interface LmsBuilderTopic {
  _id: Id<"posts">;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  lessonId?: Id<"posts">;
  order?: number;
}

export interface LmsBuilderQuiz {
  _id: Id<"posts">;
  title: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  lessonId?: Id<"posts">;
  topicId?: Id<"posts">;
  order?: number;
  isFinal?: boolean;
}

export interface LmsCourseBuilderData {
  course: {
    _id: Id<"posts">;
    slug?: string;
    title: string;
    excerpt?: string;
    status?: string;
    courseStructure: LmsCourseStructureItem[];
  };
  attachedLessons: LmsBuilderLesson[];
  attachedTopics: LmsBuilderTopic[];
  attachedQuizzes: LmsBuilderQuiz[];
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
  _id: Id<"posts">;
  title: string;
  prompt: string;
  quizId: Id<"posts">;
  questionType: QuizQuestionType;
  options: QuizQuestionOption[];
  correctOptionIds: string[];
  answerText?: string | null;
  order: number;
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
