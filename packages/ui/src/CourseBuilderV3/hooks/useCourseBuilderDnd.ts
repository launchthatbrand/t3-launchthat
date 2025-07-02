import type {
  Active,
  DragCancelEvent,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";

import type { LessonItem, QuizItem, TopicItem } from "../types/content";

// Remove unused import if useCourseBuilderStore is not needed directly here
// import { useCourseBuilderStore } from "../store/useCourseBuilderStore";

// Remove unused type derivation
// type CourseBuilderStoreType = ReturnType<typeof useCourseBuilderStore>;

// Define props with individual actions
interface UseCourseBuilderDndProps {
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];

  // Nested actions
  addTopicToLesson: (lessonId: string, topic: TopicItem) => void;
  addQuizToTopic: (topicId: string, quiz: QuizItem) => void;
  addQuizToLesson: (lessonId: string, quiz: QuizItem) => void;
  reorderQuizzesInTopic: (
    topicId: string,
    activeId: string,
    overId: string,
  ) => void;

  // Unified lesson content reorder action
  reorderLessonContentItems: (
    lessonId: string,
    activeId: string,
    overId: string,
  ) => void;

  // Top-level actions
  addMainContentItem: (item: LessonItem | QuizItem) => void;
  reorderMainContentItems: (activeId: string, overId: string) => void;

  // Add onAttachLesson callback
  onAttachLesson?: (
    lessonId: string,
    courseId: string,
    order: number,
  ) => Promise<void>;
  courseId?: string;
}

interface DropzoneData {
  kind?: string;
  type?: string;
  lessonId?: string;
  topicId?: string;
  parentLessonId?: string;
  parentTopicId?: string;
  order?: number;
}

export const useCourseBuilderDnd = ({
  availableLessons,
  availableTopics,
  availableQuizzes,
  // Destructure nested actions
  addTopicToLesson,
  addQuizToTopic,
  addQuizToLesson,
  reorderQuizzesInTopic,
  // Destructure unified actions
  addMainContentItem,
  reorderMainContentItems,
  reorderLessonContentItems,
  // Add new props
  onAttachLesson,
  courseId,
}: UseCourseBuilderDndProps) => {
  const [activeItem, setActiveItem] = useState<Active | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveItem(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const currentActiveId = active.id as string;
    const currentOverId = over.id as string;
    const currentActiveType = active.data.current?.type as string | undefined;
    const activeData = active.data.current as {
      parentLessonId?: string;
      parentTopicId?: string;
    };

    const overData = over.data.current as DropzoneData;
    const overKind = overData.kind;
    const overType = overData.type;

    if (currentActiveId === currentOverId) return;

    // Handle Dropping Items from Sidebar onto Dropzones
    if (overKind) {
      switch (overKind) {
        case "main-content-root": // Drop on main canvas
          if (currentActiveType === "lesson") {
            const lessonData = availableLessons.find(
              (l) => l.id === currentActiveId,
            );
            if (lessonData) {
              // Get the current order
              const order = overData.order ?? 0;

              // Call onAttachLesson first if available
              if (onAttachLesson && courseId) {
                await onAttachLesson(currentActiveId, courseId, order);
              }

              // Then update the store
              addMainContentItem(lessonData);
            }
          } else if (currentActiveType === "quiz") {
            const quizData = availableQuizzes.find(
              (q) => q.id === currentActiveId,
            );
            if (quizData) addMainContentItem(quizData);
          }
          break;
        case "lesson-content": // Drop into a lesson
          if (overData.lessonId) {
            if (currentActiveType === "topic") {
              const topic = availableTopics.find(
                (t) => t.id === currentActiveId,
              );
              // Call updated action
              if (topic) addTopicToLesson(overData.lessonId, topic);
            }
            if (currentActiveType === "quiz") {
              const quiz = availableQuizzes.find(
                (q) => q.id === currentActiveId,
              );
              // Call updated action
              if (quiz) addQuizToLesson(overData.lessonId, quiz);
            }
          }
          break;
        case "topic-quiz": // Drop into a topic
          if (currentActiveType === "quiz" && overData.topicId) {
            const quiz = availableQuizzes.find((q) => q.id === currentActiveId);
            if (quiz) addQuizToTopic(overData.topicId, quiz);
          }
          break;
      }
      return; // Exit after handling dropzone drop
    }

    // Handle Reordering Existing Items
    if (currentActiveType && overType) {
      // Reorder top-level items (Lessons or top-level Quizzes)
      if (
        (currentActiveType === "lesson" ||
          (currentActiveType === "quiz" &&
            !activeData.parentLessonId &&
            !activeData.parentTopicId)) &&
        (overType === "lesson" ||
          (overType === "quiz" &&
            !overData.parentLessonId &&
            !overData.parentTopicId))
      ) {
        reorderMainContentItems(currentActiveId, currentOverId);
      }
      // Reorder items WITHIN a Lesson (Topics or lesson-level Quizzes)
      else if (
        (currentActiveType === "topic" ||
          (currentActiveType === "quiz" &&
            activeData.parentLessonId &&
            !activeData.parentTopicId)) &&
        (overType === "topic" ||
          (overType === "quiz" &&
            overData.parentLessonId &&
            !overData.parentTopicId)) &&
        activeData.parentLessonId &&
        activeData.parentLessonId === overData.parentLessonId // Must be in the same lesson
      ) {
        reorderLessonContentItems(
          activeData.parentLessonId,
          currentActiveId,
          currentOverId,
        );
      }
      // Reorder quizzes WITHIN a Topic
      else if (
        currentActiveType === "quiz" &&
        overType === "quiz" &&
        activeData.parentTopicId &&
        activeData.parentTopicId === overData.parentTopicId // Must be in the same topic
      ) {
        reorderQuizzesInTopic(
          activeData.parentTopicId,
          currentActiveId,
          currentOverId,
        );
      }
      // NOTE: Explicitly handle other cases like moving from lesson to topic, topic to lesson etc. if needed
    }
  };

  return {
    activeItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
};
