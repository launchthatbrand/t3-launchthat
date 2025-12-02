"use client";

import React, { createContext, useContext } from "react";

import type { Id } from "../../../../../apps/wsa/convex/_generated/dataModel";
import type { CourseBuilderV2Props, LessonWithTopics, Quiz } from "../types";
import { useCourseData } from "../hooks/useCourseData";

// 1. Define the Context Type (matches useCourseData return value)
interface CourseDataContextType {
  lessons: LessonWithTopics[];
  finalQuizzes: Quiz[];
  isMutating: boolean;
  addLesson: (courseId: Id<"courses">) => Promise<void>;
  addTopic: (lessonId: Id<"lessons">) => Promise<void>;
  addQuiz: (
    context: Parameters<CourseBuilderV2Props["onAddQuiz"]>[0],
  ) => Promise<void>;
  removeLesson: (lessonId: Id<"lessons">) => Promise<void>;
  removeTopic: (topicId: Id<"topics">) => Promise<void>;
  removeQuiz: (quizId: Id<"quizzes">) => Promise<void>;
  changeLessonTitle: (
    lessonId: Id<"lessons">,
    newTitle: string,
  ) => Promise<void>;
  changeTopicTitle: (topicId: Id<"topics">, newTitle: string) => Promise<void>;
  changeQuizTitle: (quizId: Id<"quizzes">, newTitle: string) => Promise<void>;
}

// 2. Create the Context
const CourseDataContext = createContext<CourseDataContextType | undefined>(
  undefined,
);

// Props needed by the Provider (essentially the same as useCourseData needs)
// We omit courseId here as it might be available differently or passed directly to mutations
type CourseDataProviderProps = Omit<CourseBuilderV2Props, "courseId"> & {
  children: React.ReactNode;
};

// 3. Create the Provider Component
export const CourseDataProvider: React.FC<CourseDataProviderProps> = ({
  children,
  initialLessons,
  finalQuizzes,
  // Pass down callbacks
  onAddLesson,
  onAddTopic,
  onAddQuiz,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveQuiz,
  onTitleChangeLesson,
  onTitleChangeTopic,
  onTitleChangeQuiz,
  // Exclude other props not directly needed by useCourseData
  // availableLessons, availableTopics, availableQuizzes, onReorderItems, etc.
}) => {
  const courseData = useCourseData({
    initialLessons,
    initialFinalQuizzes: finalQuizzes, // Rename to match hook prop
    onAddLesson,
    onAddTopic,
    onAddQuiz,
    onRemoveLesson,
    onRemoveTopic,
    onRemoveQuiz,
    onTitleChangeLesson,
    onTitleChangeTopic,
    onTitleChangeQuiz,
  });

  return (
    <CourseDataContext.Provider value={courseData}>
      {children}
    </CourseDataContext.Provider>
  );
};

// 4. Create the Consumer Hook
export const useCourseDataContext = (): CourseDataContextType => {
  const context = useContext(CourseDataContext);
  if (context === undefined) {
    throw new Error(
      "useCourseDataContext must be used within a CourseDataProvider",
    );
  }
  return context;
};
