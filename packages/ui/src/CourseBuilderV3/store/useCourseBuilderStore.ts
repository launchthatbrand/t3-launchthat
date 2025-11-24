/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// If you see a type error for 'zustand', run: pnpm add -D @types/zustand
import type { StateCreator } from "zustand";
import { create } from "zustand";

import type { LessonItem, QuizItem, TopicItem } from "../types/content";

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

const isLesson = (item: Lesson | Quiz): item is Lesson =>
  item.type === "lesson";

const isTopic = (item: Topic | Quiz): item is Topic => item.type === "topic";

const isQuiz = (item: Topic | Quiz): item is Quiz => item.type === "quiz";

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

  removeLesson: (lessonId: string) => void;
  removeTopicFromLesson: (lessonId: string, topicId: string) => void;
  removeQuizFromLesson: (lessonId: string, quizId: string) => void;
  removeQuizFromTopic: (topicId: string, quizId: string) => void;
  removeFinalQuiz: (quizId: string) => void;

  // Keep top-level actions
  addMainContentItem: (item: LessonItem | QuizItem) => void;
  reorderMainContentItems: (activeId: string, overId: string) => void;

  reset: () => void;
  initialize: (state: Partial<CourseBuilderState>) => void;
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

const courseBuilderStore: StateCreator<CourseBuilderState> = (set) => {
  const store: CourseBuilderState = {
    mainContentItems: [],
    availableLessons: [],
    availableTopics: [],
    availableQuizzes: [],

    initialize: (state: Partial<CourseBuilderState>) =>
      set(() => ({
        mainContentItems: state.mainContentItems ?? [],
        availableLessons: state.availableLessons ?? [],
        availableTopics: state.availableTopics ?? [],
        availableQuizzes: state.availableQuizzes ?? [],
      })),

    addTopicToLesson: (lessonId, topic) =>
      set((state: CourseBuilderState) => {
        if (!state.availableTopics.some((at) => at.id === topic.id)) {
          return state;
        }

        const lessonIndex = state.mainContentItems.findIndex(
          (item) => item.type === "lesson" && item.id === lessonId,
        );
        if (lessonIndex === -1) return state;

        const targetLesson = state.mainContentItems[lessonIndex] as Lesson;
        if (targetLesson.contentItems.some((item) => item.id === topic.id)) {
          return state;
        }

        const newTopic: Topic = { ...topic, quizzes: [], type: "topic" };
        const updatedLesson: Lesson = {
          ...targetLesson,
          contentItems: [...targetLesson.contentItems, newTopic],
        };
        const updatedItems = [...state.mainContentItems];
        updatedItems[lessonIndex] = updatedLesson;

        return {
          ...state,
          mainContentItems: updatedItems,
          availableTopics: state.availableTopics.filter(
            (t) => t.id !== topic.id,
          ),
        };
      }),

    addQuizToTopic: (topicId, quiz) =>
      set((state: CourseBuilderState) => {
        if (!state.availableQuizzes.some((aq) => aq.id === quiz.id)) {
          return state;
        }

        const updatedItems = state.mainContentItems.map((item) => {
          if (item.type === "lesson") {
            const updatedContentItems = item.contentItems.map((contentItem) => {
              if (contentItem.type === "topic" && contentItem.id === topicId) {
                if (!contentItem.quizzes.some((q) => q.id === quiz.id)) {
                  return {
                    ...contentItem,
                    quizzes: [...contentItem.quizzes, quiz],
                  };
                }
              }
              return contentItem;
            });
            return { ...item, contentItems: updatedContentItems };
          }
          return item;
        });

        return {
          ...state,
          mainContentItems: updatedItems,
          availableQuizzes: state.availableQuizzes.filter(
            (q) => q.id !== quiz.id,
          ),
        };
      }),

    addQuizToLesson: (lessonId, quiz) =>
      set((state: CourseBuilderState) => {
        if (!state.availableQuizzes.some((aq) => aq.id === quiz.id)) {
          return state;
        }

        const lessonIndex = state.mainContentItems.findIndex(
          (item) => item.type === "lesson" && item.id === lessonId,
        );
        if (lessonIndex === -1) return state;

        const targetLesson = state.mainContentItems[lessonIndex] as Lesson;
        if (targetLesson.contentItems.some((item) => item.id === quiz.id)) {
          return state;
        }

        const newQuiz: Quiz = { ...quiz, type: "quiz" };
        const updatedLesson: Lesson = {
          ...targetLesson,
          contentItems: [...targetLesson.contentItems, newQuiz],
        };
        const updatedItems = [...state.mainContentItems];
        updatedItems[lessonIndex] = updatedLesson;

        return {
          ...state,
          mainContentItems: updatedItems,
          availableQuizzes: state.availableQuizzes.filter(
            (q) => q.id !== quiz.id,
          ),
        };
      }),

    reorderLessonContentItems: (lessonId, activeId, overId) =>
      set((state: CourseBuilderState) => {
        const updatedItems = state.mainContentItems.map((item) => {
          if (item.type === "lesson" && item.id === lessonId) {
            return {
              ...item,
              contentItems: reorderArray(item.contentItems, activeId, overId),
            };
          }
          return item;
        });
        return { ...state, mainContentItems: updatedItems };
      }),

    reorderQuizzesInTopic: (topicId, activeId, overId) =>
      set((state: CourseBuilderState) => {
        const updatedItems = state.mainContentItems.map((item) => {
          if (item.type === "lesson") {
            const updatedContentItems = item.contentItems.map((contentItem) => {
              if (contentItem.type === "topic" && contentItem.id === topicId) {
                return {
                  ...contentItem,
                  quizzes: reorderArray(contentItem.quizzes, activeId, overId),
                };
              }
              return contentItem;
            });
            return { ...item, contentItems: updatedContentItems };
          }
          return item;
        });
        return { ...state, mainContentItems: updatedItems };
      }),

    addMainContentItem: (item) =>
      set((state: CourseBuilderState) => {
        if (item.type === "lesson") {
          if (!state.availableLessons.some((l) => l.id === item.id)) {
            return state;
          }
          const newLesson: Lesson = {
            ...item,
            contentItems: [],
            type: "lesson",
          };
          return {
            ...state,
            mainContentItems: [...state.mainContentItems, newLesson],
            availableLessons: state.availableLessons.filter(
              (l) => l.id !== item.id,
            ),
          };
        } else if (item.type === "quiz") {
          if (!state.availableQuizzes.some((q) => q.id === item.id)) {
            return state;
          }
          const newQuiz: Quiz = { ...item, type: "quiz" };
          return {
            ...state,
            mainContentItems: [...state.mainContentItems, newQuiz],
            availableQuizzes: state.availableQuizzes.filter(
              (q) => q.id !== item.id,
            ),
          };
        }
        return state;
      }),

    reorderMainContentItems: (activeId, overId) =>
      set((state: CourseBuilderState) => ({
        ...state,
        mainContentItems: reorderArray(
          state.mainContentItems,
          activeId,
          overId,
        ),
      })),

    removeLesson: (lessonId) =>
      set((state: CourseBuilderState) => {
        const lessonIndex = state.mainContentItems.findIndex(
          (item) => item.type === "lesson" && item.id === lessonId,
        );
        if (lessonIndex === -1) {
          return state;
        }
        const lesson = state.mainContentItems[lessonIndex] as Lesson;
        const remainingItems = state.mainContentItems.filter(
          (item) => item.id !== lessonId,
        );

        const lessonAsItem: LessonItem = {
          id: lesson.id,
          title: lesson.title,
          type: "lesson",
        };

        const lessonTopics = lesson.contentItems.filter(
          (item): item is Topic => item.type === "topic",
        );
        const lessonQuizzes = lesson.contentItems.filter(
          (item): item is Quiz => item.type === "quiz",
        );

        return {
          ...state,
          mainContentItems: remainingItems,
          availableLessons: [
            ...state.availableLessons.filter((l) => l.id !== lessonId),
            lessonAsItem,
          ],
          availableTopics: [
            ...state.availableTopics.filter(
              (topic) => !lessonTopics.some((lt) => lt.id === topic.id),
            ),
            ...lessonTopics.map((topic) => ({
              id: topic.id,
              title: topic.title,
              type: "topic" as const,
            })),
          ],
          availableQuizzes: [
            ...state.availableQuizzes.filter(
              (quiz) => !lessonQuizzes.some((lq) => lq.id === quiz.id),
            ),
            ...lessonQuizzes.map((quiz) => ({
              id: quiz.id,
              title: quiz.title,
              type: "quiz" as const,
            })),
          ],
        };
      }),

    removeTopicFromLesson: (lessonId, topicId) =>
      set((state: CourseBuilderState) => {
        let topicToRestore: Topic | undefined;
        const updatedItems = state.mainContentItems.map((item) => {
          if (!isLesson(item) || item.id !== lessonId) {
            return item;
          }
          const remainingContent = item.contentItems.filter((content) => {
            const keep = content.id !== topicId;
            if (!keep && isTopic(content)) {
              topicToRestore = content;
            }
            return keep;
          });
          return {
            ...item,
            contentItems: remainingContent,
          };
        });

        const topicQuizzes =
          topicToRestore?.quizzes.map((quiz) => ({
            id: quiz.id,
            title: quiz.title,
            type: "quiz" as const,
          })) ?? [];

        return {
          ...state,
          mainContentItems: updatedItems,
          availableTopics:
            topicToRestore !== undefined
              ? [
                  ...state.availableTopics.filter(
                    (topic) => topic.id !== topicId,
                  ),
                  {
                    id: topicToRestore.id,
                    title: topicToRestore.title,
                    type: "topic" as const,
                  },
                ]
              : state.availableTopics,
          availableQuizzes:
            topicQuizzes.length > 0
              ? [
                  ...state.availableQuizzes.filter(
                    (quiz) => !topicQuizzes.some((tq) => tq.id === quiz.id),
                  ),
                  ...topicQuizzes,
                ]
              : state.availableQuizzes,
        };
      }),

    removeQuizFromLesson: (lessonId, quizId) =>
      set((state: CourseBuilderState) => {
        let removedQuizTitle: string | undefined;

        const updatedItems = state.mainContentItems.map((item) => {
          if (!isLesson(item) || item.id !== lessonId) {
            return item;
          }

          const updatedContentItems = item.contentItems.filter((content) => {
            const keep = content.id !== quizId;
            if (!keep && isQuiz(content)) {
              removedQuizTitle = content.title;
            }
            return keep;
          });

          return {
            ...item,
            contentItems: updatedContentItems,
          };
        });

        return {
          ...state,
          mainContentItems: updatedItems,
          availableQuizzes: [
            ...state.availableQuizzes.filter((quiz) => quiz.id !== quizId),
            {
              id: quizId,
              title: removedQuizTitle ?? "Quiz",
              type: "quiz" as const,
            },
          ],
        };
      }),

    removeQuizFromTopic: (topicId, quizId) =>
      set((state: CourseBuilderState) => {
        let removedQuizTitle: string | undefined;
        const updatedItems = state.mainContentItems.map((item) => {
          if (!isLesson(item)) {
            return item;
          }

          const updatedContentItems = item.contentItems.map((contentItem) => {
            if (isTopic(contentItem) && contentItem.id === topicId) {
              const quizzes = contentItem.quizzes.filter((quiz) => {
                const keep = quiz.id !== quizId;
                if (!keep) {
                  removedQuizTitle = quiz.title;
                }
                return keep;
              });
              return {
                ...contentItem,
                quizzes,
              };
            }
            return contentItem;
          });

          return { ...item, contentItems: updatedContentItems };
        });

        return {
          ...state,
          mainContentItems: updatedItems,
          availableQuizzes: [
            ...state.availableQuizzes.filter((quiz) => quiz.id !== quizId),
            {
              id: quizId,
              title: removedQuizTitle ?? "Quiz",
              type: "quiz" as const,
            },
          ],
        };
      }),

    removeFinalQuiz: (quizId) =>
      set((state: CourseBuilderState) => {
        const quiz = state.mainContentItems.find(
          (item) => item.type === "quiz" && item.id === quizId,
        ) as Quiz | undefined;
        if (!quiz) {
          return state;
        }
        return {
          ...state,
          mainContentItems: state.mainContentItems.filter(
            (item) => item.id !== quizId,
          ),
          availableQuizzes: [
            ...state.availableQuizzes.filter((q) => q.id !== quizId),
            {
              id: quiz.id,
              title: quiz.title,
              type: "quiz" as const,
            },
          ],
        };
      }),

    reset: () =>
      set(() => ({
        mainContentItems: [],
        availableLessons: [],
        availableTopics: [],
        availableQuizzes: [],
      })),
  };
  return store;
};

export const useCourseBuilderStore =
  create<CourseBuilderState>(courseBuilderStore);
