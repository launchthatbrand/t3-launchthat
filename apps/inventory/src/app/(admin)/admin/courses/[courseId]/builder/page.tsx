"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React, { useCallback } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { CourseBuilder } from "@acme/ui/CourseBuilderV3";

// Assuming LessonWithTopics might be needed, though CourseBuilderV2 uses it internally
// You might need to import Doc if used explicitly elsewhere, or define types matching Convex schema
// import type { Doc } from "@convex-config/_generated/dataModel";
// import type { LessonWithTopics } from "@acme/ui/CourseBuilderV2"; // If exported

// Remove placeholder type definition
// type LessonItem = { ... };

// Remove dummy data and functions
// const dummyLessons: LessonItem[] = [];
// const handleAddLesson = async () => { ... };
// ... other handle functions ...

// --- Type definitions for ItemType (if not imported/defined elsewhere)
// Assuming these types align with your Convex schema or callback expectations
type ItemType = "lesson" | "topic" | "quiz";

function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  // Comment out all data fetching hooks and callbacks
  /* 
  const { courseId } = React.use(params);
  const convexCourseId = courseId as Id<"courses">;

  // --- Hooks Called First ---
  const courseData = useQuery(
    api.courses.getCourseStructure,
    convexCourseId ? { courseId: convexCourseId } : "skip",
  );

  // Fetch available items for the sidebar
  const availableLessonsData = useQuery(
    api.courses.getAvailableLessons,
    convexCourseId ? { courseId: convexCourseId } : "skip",
  );
  const availableTopicsData = useQuery(
    api.courses.getAvailableTopics,
    {},
  );
  const availableQuizzesData = useQuery(
    api.courses.getAvailableQuizzes,
    {},
  );

  const addLesson = useMutation(api.courses.addLesson);
  const addTopic = useMutation(api.courses.addTopic);
  const addQuiz = useMutation(api.courses.addQuiz);
  const removeLesson = useMutation(api.courses.removeLesson);
  const removeTopic = useMutation(api.courses.removeTopic);
  const removeQuiz = useMutation(api.courses.removeQuiz);
  const updateLessonTitle = useMutation(api.courses.updateLessonTitle);
  const updateTopicTitle = useMutation(api.courses.updateTopicTitle);
  const updateQuizTitle = useMutation(api.courses.updateQuizTitle);
  const reorderItems = useMutation(api.courses.reorderItems);
  const attachLesson = useMutation(api.courses.attachLessonToCourse);

  // Uncomment the original callbacks that use the mutations
  const handleAddLesson = useCallback( ... );
  const handleAddTopic = useCallback( ... );
  const handleAddQuiz = useCallback( ... );
  const handleRemoveItem = useCallback( ... );
  const handleTitleChange = useCallback( ... );
  const handleReorderItems = useCallback( ... );
  const handleAttachLesson = useCallback( ... );
  const handleAttachTopic = useCallback( ... );
  const handleAttachQuizToTopic = useCallback( ... );
  const handleAttachQuizToFinal = useCallback( ... );
  */

  // Render CourseBuilder without props to use defaults
  return (
    <div className="h-full w-full">
      <CourseBuilder />
    </div>
  );
}

export default CourseBuilderPage;
