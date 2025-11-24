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
