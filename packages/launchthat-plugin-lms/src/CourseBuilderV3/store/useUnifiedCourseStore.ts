// @ts-nocheck

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Universal ID type that works across frontend and backend
export type UniversalId = string;

// Type converters for backend compatibility
export const toConvexId = (id: UniversalId): unknown => id;
export const fromConvexId = (id: unknown): UniversalId => id as string;

// Core content interfaces
export interface CourseLesson {
  id: UniversalId;
  title: string;
  order: number;
  topics: CourseTopic[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseTopic {
  id: UniversalId;
  title: string;
  contentType: string;
  order: number;
  quizzes: CourseQuiz[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseQuiz {
  id: UniversalId;
  title: string;
  order: number;
  questions: unknown[]; // To be refined based on quiz structure
  createdAt: Date;
  updatedAt: Date;
}

// Available items for drag-and-drop
export interface AvailableLesson {
  id: UniversalId;
  title: string;
  type: "lesson";
  topics: CourseTopic[];
}

export interface AvailableTopic {
  id: UniversalId;
  title: string;
  type: "topic";
  contentType: string;
  quizzes: CourseQuiz[];
}

export interface AvailableQuiz {
  id: UniversalId;
  title: string;
  type: "quiz";
  questions: unknown[];
}

// UI state types
export interface DraggedItem {
  id: UniversalId;
  type: "lesson" | "topic" | "quiz";
  title: string;
  sourceType: "available" | "course";
}

// Optimistic update tracking
export interface OptimisticUpdate {
  id: string;
  type: "add" | "remove" | "update" | "reorder";
  target: string; // ID of the affected item
  payload: any;
  timestamp: Date;
  status: "pending" | "confirmed" | "failed";
  rollbackData?: any;
}

// Quiz attachment target
export type QuizTarget =
  | { type: "topic"; topicId: string }
  | { type: "final"; courseId: string };

// ============================================================================
// UNIFIED COURSE STATE INTERFACE
// ============================================================================

export interface UnifiedCourseState {
  // Core course data
  courseId: string;
  title: string;
  description?: string;

  // Course structure (ordered list of lessons)
  lessons: CourseLesson[];

  // Available items for drag-and-drop
  availableItems: {
    lessons: AvailableLesson[];
    topics: AvailableTopic[];
    quizzes: AvailableQuiz[];
  };

  // UI state
  ui: {
    isDragging: boolean;
    draggedItem?: DraggedItem;
    selectedItems: string[];
    expandedSections: Set<string>;
  };

  // Synchronization state
  sync: {
    isLoading: boolean;
    isSaving: boolean;
    hasUnsyncedChanges: boolean;
    lastSyncedAt: Date | null;
    optimisticUpdates: OptimisticUpdate[];
  };
}

// ============================================================================
// ACTION INTERFACES
// ============================================================================

export interface StructureActions {
  addLesson: (
    lesson: Partial<CourseLesson>,
    position?: number,
  ) => Promise<void>;
  removeLesson: (lessonId: string) => Promise<void>;
  reorderLessons: (fromIndex: number, toIndex: number) => Promise<void>;
  updateLesson: (
    lessonId: string,
    updates: Partial<CourseLesson>,
  ) => Promise<void>;
}

export interface ContentActions {
  attachLesson: (lessonId: string, position?: number) => Promise<void>;
  detachLesson: (lessonId: string) => Promise<void>;
  addTopic: (lessonId: string, topic: Partial<CourseTopic>) => Promise<void>;
  addQuiz: (target: QuizTarget, quiz: Partial<CourseQuiz>) => Promise<void>;
}

export interface UIActions {
  setDragging: (isDragging: boolean, item?: DraggedItem) => void;
  selectItems: (itemIds: string[]) => void;
  toggleSection: (sectionId: string) => void;
  clearSelection: () => void;
}

export interface SyncActions {
  forceSyncWithBackend: () => Promise<void>;
  retryFailedUpdates: () => Promise<void>;
  clearOptimisticUpdates: () => void;
  setLoadingState: (isLoading: boolean) => void;
  setSavingState: (isSaving: boolean) => void;
  markSynced: () => void;
}

export interface UnifiedActions {
  structure: StructureActions;
  content: ContentActions;
  ui: UIActions;
  sync: SyncActions;
}

// ============================================================================
// COMPLETE STORE INTERFACE
// ============================================================================

export interface UnifiedCourseStore extends UnifiedCourseState {
  actions: UnifiedActions;

  // Core store actions
  initialize: (
    courseId: string,
    initialData?: Partial<UnifiedCourseState>,
  ) => void;
  reset: () => void;

  // State queries
  getLessonById: (lessonId: string) => CourseLesson | undefined;
  getTopicById: (topicId: string) => CourseTopic | undefined;
  getQuizById: (quizId: string) => CourseQuiz | undefined;
  hasUnsyncedChanges: () => boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const reorderArray = <T>(
  array: T[],
  fromIndex: number,
  toIndex: number,
): T[] => {
  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): UnifiedCourseState => ({
  courseId: "",
  title: "",
  description: undefined,
  lessons: [],
  availableItems: {
    lessons: [],
    topics: [],
    quizzes: [],
  },
  ui: {
    isDragging: false,
    draggedItem: undefined,
    selectedItems: [],
    expandedSections: new Set<string>(),
  },
  sync: {
    isLoading: false,
    isSaving: false,
    hasUnsyncedChanges: false,
    lastSyncedAt: null,
    optimisticUpdates: [],
  },
});

// ============================================================================
// ZUSTAND STORE CREATION
// ============================================================================

export const useUnifiedCourseStore = create<UnifiedCourseStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...createInitialState(),

        // ================================================================
        // CORE STORE ACTIONS
        // ================================================================

        initialize: (
          courseId: string,
          initialData?: Partial<UnifiedCourseState>,
        ) => {
          set((state) => {
            state.courseId = courseId;
            if (initialData) {
              Object.assign(state, initialData);
            }
            state.sync.lastSyncedAt = new Date();
            state.sync.hasUnsyncedChanges = false;
          });
        },

        reset: () => {
          set(() => createInitialState());
        },

        // ================================================================
        // STATE QUERIES
        // ================================================================

        getLessonById: (lessonId: string) => {
          return get().lessons.find((lesson) => lesson.id === lessonId);
        },

        getTopicById: (topicId: string) => {
          const lessons = get().lessons;
          for (const lesson of lessons) {
            const topic = lesson.topics.find((topic) => topic.id === topicId);
            if (topic) return topic;
          }
          return undefined;
        },

        getQuizById: (quizId: string) => {
          const lessons = get().lessons;
          for (const lesson of lessons) {
            for (const topic of lesson.topics) {
              const quiz = topic.quizzes.find((quiz) => quiz.id === quizId);
              if (quiz) return quiz;
            }
          }
          return undefined;
        },

        hasUnsyncedChanges: () => {
          return get().sync.hasUnsyncedChanges;
        },

        // ================================================================
        // ACTIONS OBJECT
        // ================================================================

        actions: {
          // Structure Actions
          structure: {
            addLesson: async (
              lesson: Partial<CourseLesson>,
              position?: number,
            ) => {
              const newLesson: CourseLesson = {
                id: lesson.id || generateId(),
                title: lesson.title || "New Lesson",
                order: lesson.order || get().lessons.length,
                topics: lesson.topics || [],
                createdAt: lesson.createdAt || new Date(),
                updatedAt: new Date(),
              };

              set((state) => {
                if (position !== undefined) {
                  state.lessons.splice(position, 0, newLesson);
                } else {
                  state.lessons.push(newLesson);
                }
                state.sync.hasUnsyncedChanges = true;
              });

              // TODO: Add backend mutation call here
              // This will be implemented in Task 1.6 (Optimistic Updates)
            },

            removeLesson: async (lessonId: string) => {
              set((state) => {
                const index = state.lessons.findIndex((l) => l.id === lessonId);
                if (index !== -1) {
                  state.lessons.splice(index, 1);
                  state.sync.hasUnsyncedChanges = true;
                }
              });

              // TODO: Add backend mutation call here
            },

            reorderLessons: async (fromIndex: number, toIndex: number) => {
              set((state) => {
                state.lessons = reorderArray(state.lessons, fromIndex, toIndex);
                // Update order fields
                state.lessons.forEach((lesson, index) => {
                  lesson.order = index;
                  lesson.updatedAt = new Date();
                });
                state.sync.hasUnsyncedChanges = true;
              });

              // TODO: Add backend mutation call here
            },

            updateLesson: async (
              lessonId: string,
              updates: Partial<CourseLesson>,
            ) => {
              set((state) => {
                const lesson = state.lessons.find((l) => l.id === lessonId);
                if (lesson) {
                  Object.assign(lesson, updates);
                  lesson.updatedAt = new Date();
                  state.sync.hasUnsyncedChanges = true;
                }
              });

              // TODO: Add backend mutation call here
            },
          },

          // Content Actions
          content: {
            attachLesson: async (lessonId: string, position?: number) => {
              const availableLesson = get().availableItems.lessons.find(
                (l) => l.id === lessonId,
              );
              if (!availableLesson) return;

              const courseLesson: CourseLesson = {
                ...availableLesson,
                order: position !== undefined ? position : get().lessons.length,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              set((state) => {
                // Add to course lessons
                if (position !== undefined) {
                  state.lessons.splice(position, 0, courseLesson);
                } else {
                  state.lessons.push(courseLesson);
                }

                // Remove from available lessons
                state.availableItems.lessons =
                  state.availableItems.lessons.filter((l) => l.id !== lessonId);

                state.sync.hasUnsyncedChanges = true;
              });

              // TODO: Add backend mutation call here
            },

            detachLesson: async (lessonId: string) => {
              const lesson = get().getLessonById(lessonId);
              if (!lesson) return;

              const availableLesson: AvailableLesson = {
                id: lesson.id,
                title: lesson.title,
                type: "lesson",
                topics: lesson.topics,
              };

              set((state) => {
                // Remove from course lessons
                state.lessons = state.lessons.filter((l) => l.id !== lessonId);

                // Add back to available lessons
                state.availableItems.lessons.push(availableLesson);

                state.sync.hasUnsyncedChanges = true;
              });

              // TODO: Add backend mutation call here
            },

            addTopic: async (lessonId: string, topic: Partial<CourseTopic>) => {
              const newTopic: CourseTopic = {
                id: topic.id || generateId(),
                title: topic.title || "New Topic",
                contentType: topic.contentType || "text",
                order: topic.order || 0,
                quizzes: topic.quizzes || [],
                createdAt: topic.createdAt || new Date(),
                updatedAt: new Date(),
              };

              set((state) => {
                const lesson = state.lessons.find((l) => l.id === lessonId);
                if (lesson) {
                  lesson.topics.push(newTopic);
                  lesson.updatedAt = new Date();
                  state.sync.hasUnsyncedChanges = true;
                }
              });

              // TODO: Add backend mutation call here
            },

            addQuiz: async (target: QuizTarget, quiz: Partial<CourseQuiz>) => {
              const newQuiz: CourseQuiz = {
                id: quiz.id || generateId(),
                title: quiz.title || "New Quiz",
                order: quiz.order || 0,
                questions: quiz.questions || [],
                createdAt: quiz.createdAt || new Date(),
                updatedAt: new Date(),
              };

              set((state) => {
                if (target.type === "topic") {
                  const topic = get().getTopicById(target.topicId);
                  if (topic) {
                    topic.quizzes.push(newQuiz);
                    topic.updatedAt = new Date();
                  }
                }
                // Handle final quiz case here
                state.sync.hasUnsyncedChanges = true;
              });

              // TODO: Add backend mutation call here
            },
          },

          // UI Actions
          ui: {
            setDragging: (isDragging: boolean, item?: DraggedItem) => {
              set((state) => {
                state.ui.isDragging = isDragging;
                state.ui.draggedItem = item;
              });
            },

            selectItems: (itemIds: string[]) => {
              set((state) => {
                state.ui.selectedItems = itemIds;
              });
            },

            toggleSection: (sectionId: string) => {
              set((state) => {
                if (state.ui.expandedSections.has(sectionId)) {
                  state.ui.expandedSections.delete(sectionId);
                } else {
                  state.ui.expandedSections.add(sectionId);
                }
              });
            },

            clearSelection: () => {
              set((state) => {
                state.ui.selectedItems = [];
              });
            },
          },

          // Sync Actions
          sync: {
            forceSyncWithBackend: async () => {
              set((state) => {
                state.sync.isLoading = true;
              });

              try {
                // TODO: Implement backend sync in Task 1.4
                set((state) => {
                  state.sync.lastSyncedAt = new Date();
                  state.sync.hasUnsyncedChanges = false;
                });
              } catch (error) {
                console.error("Failed to sync with backend:", error);
              } finally {
                set((state) => {
                  state.sync.isLoading = false;
                });
              }
            },

            retryFailedUpdates: async () => {
              const failedUpdates = get().sync.optimisticUpdates.filter(
                (update) => update.status === "failed",
              );

              for (const update of failedUpdates) {
                // TODO: Implement retry logic in Task 1.6
                console.log("Retrying failed update:", update);
              }
            },

            clearOptimisticUpdates: () => {
              set((state) => {
                state.sync.optimisticUpdates = [];
              });
            },

            setLoadingState: (isLoading: boolean) => {
              set((state) => {
                state.sync.isLoading = isLoading;
              });
            },

            setSavingState: (isSaving: boolean) => {
              set((state) => {
                state.sync.isSaving = isSaving;
              });
            },

            markSynced: () => {
              set((state) => {
                state.sync.lastSyncedAt = new Date();
                state.sync.hasUnsyncedChanges = false;
              });
            },
          },
        },
      })),
    ),
    {
      name: "unified-course-store",
    },
  ),
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

// Hook to get just the state without actions
export const useUnifiedCourseState = () => {
  return useUnifiedCourseStore((state) => ({
    courseId: state.courseId,
    title: state.title,
    description: state.description,
    lessons: state.lessons,
    availableItems: state.availableItems,
    ui: state.ui,
    sync: state.sync,
  }));
};

// Hook to get just the actions
export const useUnifiedCourseActions = () => {
  return useUnifiedCourseStore((state) => state.actions);
};

// Hook to get specific action categories
export const useStructureActions = () => {
  return useUnifiedCourseStore((state) => state.actions.structure);
};

export const useContentActions = () => {
  return useUnifiedCourseStore((state) => state.actions.content);
};

export const useUIActions = () => {
  return useUnifiedCourseStore((state) => state.actions.ui);
};

export const useSyncActions = () => {
  return useUnifiedCourseStore((state) => state.actions.sync);
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Expose store to window for debugging
  (window as any).unifiedCourseStore = useUnifiedCourseStore;
}
