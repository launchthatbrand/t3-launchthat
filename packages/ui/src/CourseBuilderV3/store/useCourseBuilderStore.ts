// If you see a type error for 'zustand', run: pnpm add -D @types/zustand
import { create, StateCreator } from "zustand";

import type { LessonItem, QuizItem, TopicItem } from "../types/content";
import {
  mockAvailableLessons,
  mockAvailableQuizzes,
  mockAvailableTopics,
} from "../mockData";

// Import mock data for initial state

export interface Quiz {
  id: string;
  title: string;
  type: "quiz"; // Add type discriminator
}

export interface Topic {
  id: string;
  title: string;
  quizzes: Quiz[];
  type: "topic"; // Add type for consistency if needed later
}

export interface Lesson {
  id: string;
  title: string;
  contentItems: (Topic | Quiz)[]; // Unified content array
  type: "lesson";
}

export interface CourseBuilderState {
  mainContentItems: (Lesson | Quiz)[];
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];

  // Keep nested topic actions
  addQuizToTopic: (topicId: string, quiz: Quiz) => void;
  reorderQuizzesInTopic: (
    topicId: string,
    activeId: string,
    overId: string,
  ) => void;

  // Update lesson content actions
  addTopicToLesson: (lessonId: string, topic: TopicItem) => void;
  addQuizToLesson: (lessonId: string, quiz: QuizItem) => void;

  // Remove old lesson reorder actions
  // reorderTopicsInLesson: (lessonId: string, activeId: string, overId: string) => void;
  // reorderQuizzesInLesson: (lessonId: string, activeId: string, overId: string) => void;
  // Add new unified lesson content reorder action
  reorderLessonContentItems: (
    lessonId: string,
    activeId: string,
    overId: string,
  ) => void;

  // Keep top-level actions
  addMainContentItem: (item: LessonItem | QuizItem) => void;
  reorderMainContentItems: (activeId: string, overId: string) => void;

  reset: () => void;
}

// Helper function for reordering arrays
const reorderArray = <T extends { id: string }>(
  array: T[],
  activeId: string,
  overId: string,
): T[] => {
  const oldIndex = array.findIndex((item) => item.id === activeId);
  const newIndex = array.findIndex((item) => item.id === overId);

  if (oldIndex !== -1 && newIndex !== -1 && array[oldIndex]) {
    const newArray = [...array];
    const [movedItem] = newArray.splice(oldIndex, 1);
    if (movedItem) {
      newArray.splice(newIndex, 0, movedItem);
      return newArray;
    }
  }
  return array; // Return original if indices are invalid or item not found
};

const courseBuilderStore: StateCreator<CourseBuilderState> = (set) => ({
  mainContentItems: [],

  // Initialize available items with type
  availableLessons: mockAvailableLessons.map((l) => ({
    id: l.id,
    title: l.title,
    type: "lesson",
  })),
  availableTopics: mockAvailableTopics.map((t) => ({
    id: t.id,
    title: t.title,
    type: "topic",
  })),
  availableQuizzes: mockAvailableQuizzes.map((q) => ({
    id: q.id,
    title: q.title,
    type: "quiz",
  })),

  addTopicToLesson: (lessonId, topic) =>
    set((state: CourseBuilderState) => {
      // 1. Check availability
      if (!state.availableTopics.some((at) => at.id === topic.id)) {
        return state;
      }

      // 2. Find lesson index
      const lessonIndex = state.mainContentItems.findIndex(
        (item) => item.type === "lesson" && item.id === lessonId,
      );
      if (lessonIndex === -1) return state;

      // 3. Check if topic already exists in the lesson's contentItems
      const targetLesson = state.mainContentItems[lessonIndex] as Lesson;
      if (targetLesson.contentItems.some((item) => item.id === topic.id)) {
        return state;
      }

      // 4. Create updated lesson and items array
      const newTopic: Topic = { ...topic, quizzes: [], type: "topic" }; // Ensure full Topic type
      const updatedLesson: Lesson = {
        ...targetLesson,
        // Add to contentItems instead of topics
        contentItems: [...targetLesson.contentItems, newTopic],
      };
      const updatedItems = [...state.mainContentItems];
      updatedItems[lessonIndex] = updatedLesson;

      // 5. Return new state
      return {
        mainContentItems: updatedItems,
        availableTopics: state.availableTopics.filter((t) => t.id !== topic.id),
      };
    }),

  addQuizToTopic: (topicId, quiz) =>
    set((state: CourseBuilderState) => {
      // 1. Check availability
      if (!state.availableQuizzes.some((aq) => aq.id === quiz.id)) {
        return state;
      }

      let quizAdded = false;
      const updatedItems = state.mainContentItems.map((item) => {
        // Only operate on lessons
        if (item.type === "lesson") {
          let lessonModified = false;
          const updatedContentItems = item.contentItems.map((contentItem) => {
            // Only operate on topics within the lesson
            if (contentItem.type === "topic" && contentItem.id === topicId) {
              // Check if quiz already exists in this topic
              if (!contentItem.quizzes.some((q) => q.id === quiz.id)) {
                quizAdded = true;
                lessonModified = true; // Mark lesson as modified
                // Return updated topic with new quiz
                return {
                  ...contentItem,
                  quizzes: [...contentItem.quizzes, quiz],
                };
              }
            }
            // Return unmodified content item (quiz or other topic)
            return contentItem;
          });

          // If any content item within the lesson was modified, return new lesson object
          if (lessonModified) {
            return { ...item, contentItems: updatedContentItems };
          }
        }
        // Return unmodified item (quiz or lesson that wasn't modified)
        return item;
      });

      // If no quiz was added anywhere, return original state
      if (!quizAdded) {
        return state;
      }

      // Return updated state with filtered available quizzes
      return {
        mainContentItems: updatedItems,
        availableQuizzes: state.availableQuizzes.filter(
          (q) => q.id !== quiz.id,
        ),
      };
    }),

  addQuizToLesson: (lessonId, quiz) =>
    set((state: CourseBuilderState) => {
      // 1. Check availability
      if (!state.availableQuizzes.some((aq) => aq.id === quiz.id)) {
        return state;
      }

      // 2. Find lesson index
      const lessonIndex = state.mainContentItems.findIndex(
        (item) => item.type === "lesson" && item.id === lessonId,
      );
      if (lessonIndex === -1) return state;

      // 3. Check if quiz already exists in the lesson's contentItems
      const targetLesson = state.mainContentItems[lessonIndex] as Lesson;
      if (targetLesson.contentItems.some((item) => item.id === quiz.id)) {
        return state;
      }

      // 4. Create updated lesson and items array
      const newQuiz: Quiz = { ...quiz, type: "quiz" }; // Ensure full Quiz type
      const updatedLesson: Lesson = {
        ...targetLesson,
        // Add to contentItems instead of quizzes
        contentItems: [...targetLesson.contentItems, newQuiz],
      };
      const updatedItems = [...state.mainContentItems];
      updatedItems[lessonIndex] = updatedLesson;

      // 5. Return new state
      return {
        mainContentItems: updatedItems,
        availableQuizzes: state.availableQuizzes.filter(
          (q) => q.id !== quiz.id,
        ),
      };
    }),

  // Implement reorderLessonContentItems
  reorderLessonContentItems: (lessonId, activeId, overId) =>
    set((state: CourseBuilderState) => {
      const updatedItems = state.mainContentItems.map((item) => {
        if (item.type === "lesson" && item.id === lessonId) {
          const reorderedContent = reorderArray(
            item.contentItems,
            activeId,
            overId,
          );
          return { ...item, contentItems: reorderedContent };
        }
        return item;
      });
      return { mainContentItems: updatedItems };
    }),

  // Update reorderQuizzesInTopic to work with contentItems
  reorderQuizzesInTopic: (topicId, activeId, overId) =>
    set((state: CourseBuilderState) => {
      let itemReordered = false;
      const updatedItems = state.mainContentItems.map((item) => {
        if (item.type === "lesson") {
          let lessonModified = false;
          const updatedContentItems = item.contentItems.map((contentItem) => {
            if (contentItem.type === "topic" && contentItem.id === topicId) {
              const originalQuizzes = contentItem.quizzes;
              const reorderedQuizzes = reorderArray(
                originalQuizzes,
                activeId,
                overId,
              );
              // Check if reordering actually changed the array
              if (originalQuizzes !== reorderedQuizzes) {
                itemReordered = true;
                lessonModified = true;
                return { ...contentItem, quizzes: reorderedQuizzes };
              }
            }
            return contentItem;
          });
          // Only update lesson if contentItems actually changed
          if (lessonModified) {
            return { ...item, contentItems: updatedContentItems };
          }
        }
        return item;
      });

      // If no reordering occurred, return original state
      if (!itemReordered) {
        return state;
      }

      return { mainContentItems: updatedItems };
    }),

  // Implement new unified actions
  addMainContentItem: (item) =>
    set((state: CourseBuilderState) => {
      // Check if item already exists in main content
      if (state.mainContentItems.some((existing) => existing.id === item.id)) {
        return state;
      }

      if (item.type === "lesson") {
        // Check availability
        if (!state.availableLessons.some((al) => al.id === item.id)) {
          return state;
        }
        const newLesson: Lesson = {
          id: item.id,
          title: item.title,
          contentItems: [],
          type: "lesson",
        };
        return {
          mainContentItems: [...state.mainContentItems, newLesson],
          availableLessons: state.availableLessons.filter(
            (l) => l.id !== item.id,
          ),
        };
      } else {
        // It must be a quiz if not a lesson, due to input type constraint
        // Check availability
        if (!state.availableQuizzes.some((aq) => aq.id === item.id)) {
          return state;
        }
        const newQuiz: Quiz = {
          id: item.id,
          title: item.title,
          type: "quiz",
        };
        return {
          mainContentItems: [...state.mainContentItems, newQuiz],
          availableQuizzes: state.availableQuizzes.filter(
            (q) => q.id !== item.id,
          ),
        };
      }
    }),

  reorderMainContentItems: (activeId, overId) =>
    set((state: CourseBuilderState) => ({
      mainContentItems: reorderArray(state.mainContentItems, activeId, overId),
    })),

  // Reset needs to initialize contentItems for any mock lessons if applicable
  reset: () =>
    set({
      mainContentItems: [], // Reset top-level items
      // Reset available items (ensure mock data mapping includes type)
      availableLessons: mockAvailableLessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: "lesson",
      })),
      availableTopics: mockAvailableTopics.map((t) => ({
        id: t.id,
        title: t.title,
        type: "topic",
      })),
      availableQuizzes: mockAvailableQuizzes.map((q) => ({
        id: q.id,
        title: q.title,
        type: "quiz",
      })),
    }),
});

export const useCourseBuilderStore =
  create<CourseBuilderState>(courseBuilderStore);
