import type { LessonItem, QuizItem, TopicItem } from "./types/content";
import type { CourseStructure } from "./types/structure";

export const mockAvailableLessons: LessonItem[] = [
  { id: "lesson-1", title: "Introduction to Course Building", type: "lesson" },
  { id: "lesson-2", title: "Advanced Techniques", type: "lesson" },
  { id: "lesson-3", title: "Deployment Strategies", type: "lesson" },
];

export const mockAvailableTopics: TopicItem[] = [
  { id: "topic-1", title: "Setting up the Environment", type: "topic" },
  { id: "topic-2", title: "Understanding Core Concepts", type: "topic" },
  { id: "topic-3", title: "Integrating with APIs", type: "topic" },
];

export const mockAvailableQuizzes: QuizItem[] = [
  { id: "quiz-1", title: "Basic Concepts Quiz", type: "quiz" },
  { id: "quiz-2", title: "Integration Quiz", type: "quiz" },
];

export const mockEmptyCourseStructure: CourseStructure = {
  id: "course-mock-1",
  title: "New Mock Course",
  modules: [],
  _creationTime: Date.now(), // Add required field
};
