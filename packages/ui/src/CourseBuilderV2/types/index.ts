import type {
  Doc,
  Id,
} from "../../../../../apps/wsa/convex/_generated/dataModel";

// Re-export imported base types if needed elsewhere
export type { Doc, Id };

// Basic Content Types
export type Quiz = Doc<"quizzes">;
export type Topic = Doc<"topics">;
export type Lesson = Doc<"lessons">;

// Nested Structure Types
export type TopicWithQuizzes = Topic & { quizzes?: Quiz[] };
export type LessonWithTopics = Lesson & {
  topics?: TopicWithQuizzes[];
};

// Union type for Draggable Items
export type DraggableCourseItem = LessonWithTopics | TopicWithQuizzes | Quiz;

// Type for identifying item type during DND
export type CourseItemType =
  | "lesson"
  | "topic"
  | "quiz"
  | "sidebarLesson"
  | "sidebarTopic"
  | "sidebarQuiz";

// Data structure attached to draggable elements
export interface DraggableItemData {
  type: CourseItemType;
  item: LessonWithTopics | TopicWithQuizzes | Quiz;
  lessonId?: Id<"lessons">; // Optional: For items nested in lessons (e.g., topics)
  topicId?: Id<"topics">; // Optional: For items nested in topics (e.g., quizzes)
  parentId?: string; // Optional: For generic parent tracking (e.g., final quiz zone)
}

// Props for the main CourseBuilderV2 component
export interface CourseBuilderV2Props {
  courseId: Id<"courses">;
  initialLessons: LessonWithTopics[] | null | undefined;
  finalQuizzes: Quiz[] | null | undefined;
  availableLessons: Lesson[] | null | undefined;
  availableTopics: Topic[] | null | undefined;
  availableQuizzes: Quiz[] | null | undefined;

  // Callbacks for data operations
  onAddLesson: (courseId: Id<"courses">, order: number) => Promise<void>;
  onAddTopic: (lessonId: Id<"lessons">, order: number) => Promise<void>;
  onAddQuiz: (
    context:
      | { topicId: Id<"topics">; order: number }
      | { isFinalQuiz: true; courseId: Id<"courses">; order: number },
  ) => Promise<void>;

  onRemoveLesson: (lessonId: Id<"lessons">) => Promise<void>;
  onRemoveTopic: (topicId: Id<"topics">) => Promise<void>;
  onRemoveQuiz: (quizId: Id<"quizzes">) => Promise<void>;

  onTitleChangeLesson: (
    lessonId: Id<"lessons">,
    newTitle: string,
  ) => Promise<void>;
  onTitleChangeTopic: (
    topicId: Id<"topics">,
    newTitle: string,
  ) => Promise<void>;
  onTitleChangeQuiz: (quizId: Id<"quizzes">, newTitle: string) => Promise<void>;

  onReorderItems: (
    activeId: string, // DND Kit ID (e.g., "lesson-<dbId>")
    overId: string | null, // DND Kit ID
    parentId?: Id<"lessons"> | Id<"topics">, // DB ID of container if reordering within list
  ) => Promise<void>;

  onAttachLesson: (
    lessonId: Id<"lessons">,
    courseId: Id<"courses">,
    order: number,
  ) => Promise<void>;
  onAttachTopic: (
    topicId: Id<"topics">,
    lessonId: Id<"lessons">,
    order: number,
  ) => Promise<void>;
  onAttachQuizToTopic: (
    quizId: Id<"quizzes">,
    topicId: Id<"topics">,
    order: number,
  ) => Promise<void>;
  onAttachQuizToFinal: (
    quizId: Id<"quizzes">,
    courseId: Id<"courses">,
    order: number,
  ) => Promise<void>;
}
