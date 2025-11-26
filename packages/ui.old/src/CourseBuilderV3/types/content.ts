/**
 * Base interface for all course content items.
 * Represents a generic item in the course builder (lesson, topic, quiz, etc.).
 * Backend-agnostic, focused on UI representation.
 */
export interface ContentItemBase {
  /** Unique identifier for the item */
  id: string;
  /** Display title for the item */
  title: string;
  /** Type of the content item */
  type: "lesson" | "topic" | "quiz";
  /** Optional: Additional metadata for extensibility */
  [key: string]: unknown;
}

/**
 * Represents a lesson in the course builder.
 */
export interface LessonItem extends ContentItemBase {
  type: "lesson";
  /** Optional: Estimated duration in minutes */
  duration?: number;
  /** Optional: Nested topics within the lesson */
  topics?: TopicItem[];
}

/**
 * Represents a topic in the course builder.
 */
export interface TopicItem extends ContentItemBase {
  type: "topic";
  /** Optional: Description or summary of the topic */
  description?: string;
  /** Optional: Nested quizzes within the topic */
  quizzes?: QuizItem[];
}

/**
 * Represents a quiz in the course builder.
 */
export interface QuizItem extends ContentItemBase {
  type: "quiz";
  /** Optional: List of questions (structure to be refined) */
  questions?: unknown[];
  /** Optional: Maximum score for the quiz */
  maxScore?: number;
}
