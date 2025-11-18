import type { Id } from "@/convex/_generated/dataModel";

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
  order?: number | null;
  slug?: string;
}

export interface LmsBuilderTopic {
  _id: Id<"posts">;
  title: string;
  excerpt?: string;
  content?: string;
  lessonId?: Id<"posts">;
  order?: number | null;
}

export interface LmsBuilderQuiz {
  _id: Id<"posts">;
  title: string;
  excerpt?: string;
  content?: string;
  lessonId?: Id<"posts">;
  order?: number | null;
  isFinal?: boolean;
}

export interface LmsCourseBuilderData {
  course: {
    _id: Id<"posts">;
    title: string;
    status?: string;
    courseStructure: LmsCourseStructureItem[];
  };
  attachedLessons: LmsBuilderLesson[];
  attachedTopics: LmsBuilderTopic[];
  attachedQuizzes: LmsBuilderQuiz[];
}
