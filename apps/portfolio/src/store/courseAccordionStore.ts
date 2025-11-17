import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CourseAccordionState {
  expandedLessons: string[];
  toggleLesson: (lessonId: string) => void;
  expandedTopics: string[];
  toggleTopic: (topicId: string) => void;
  expandedQuizzes: string[];
  toggleQuiz: (quizId: string) => void;
}

export const useCourseAccordionStore = create<CourseAccordionState>()(
  persist(
    (set) => ({
      expandedLessons: [],
      toggleLesson: (lessonId) =>
        set((state) => ({
          expandedLessons: state.expandedLessons.includes(lessonId)
            ? state.expandedLessons.filter((id) => id !== lessonId)
            : [...state.expandedLessons, lessonId],
        })),
      expandedTopics: [],
      toggleTopic: (topicId) =>
        set((state) => ({
          expandedTopics: state.expandedTopics.includes(topicId)
            ? state.expandedTopics.filter((id) => id !== topicId)
            : [...state.expandedTopics, topicId],
        })),
      expandedQuizzes: [],
      toggleQuiz: (quizId) =>
        set((state) => ({
          expandedQuizzes: state.expandedQuizzes.includes(quizId)
            ? state.expandedQuizzes.filter((id) => id !== quizId)
            : [...state.expandedQuizzes, quizId],
        })),
    }),
    {
      name: "course-accordion-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // use localStorage for persistence
    },
  ),
);
