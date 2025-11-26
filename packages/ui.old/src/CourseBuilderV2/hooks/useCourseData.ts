import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { Id } from "../../../../../apps/wsa/convex/_generated/dataModel";
import type {
  CourseBuilderV2Props,
  LessonWithTopics,
  Quiz,
  TopicWithQuizzes,
} from "../types";

// Props required by the hook
interface UseCourseDataProps {
  initialLessons: LessonWithTopics[] | null | undefined;
  initialFinalQuizzes: Quiz[] | null | undefined;
  // Pass mutation callbacks
  onAddLesson: CourseBuilderV2Props["onAddLesson"];
  onAddTopic: CourseBuilderV2Props["onAddTopic"];
  onAddQuiz: CourseBuilderV2Props["onAddQuiz"];
  onRemoveLesson: CourseBuilderV2Props["onRemoveLesson"];
  onRemoveTopic: CourseBuilderV2Props["onRemoveTopic"];
  onRemoveQuiz: CourseBuilderV2Props["onRemoveQuiz"];
  onTitleChangeLesson: CourseBuilderV2Props["onTitleChangeLesson"];
  onTitleChangeTopic: CourseBuilderV2Props["onTitleChangeTopic"];
  onTitleChangeQuiz: CourseBuilderV2Props["onTitleChangeQuiz"];
  // Note: Reorder/Attach callbacks are handled by useCourseBuilderDnd hook
}

// Return value of the hook
interface UseCourseDataReturn {
  lessons: LessonWithTopics[];
  finalQuizzes: Quiz[];
  // Simple combined loading state for now
  isMutating: boolean;
  // Wrapped mutation functions
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

export const useCourseData = ({
  initialLessons,
  initialFinalQuizzes,
  onAddLesson,
  onAddTopic,
  onAddQuiz,
  onRemoveLesson,
  onRemoveTopic,
  onRemoveQuiz,
  onTitleChangeLesson,
  onTitleChangeTopic,
  onTitleChangeQuiz,
}: UseCourseDataProps): UseCourseDataReturn => {
  const [lessons, setLessons] = useState<LessonWithTopics[]>(
    initialLessons ?? [],
  );
  const [finalQuizzes, setFinalQuizzes] = useState<Quiz[]>(
    initialFinalQuizzes ?? [],
  );
  const [isMutating, setIsMutating] = useState(false);

  // Sync state with initial props
  useEffect(() => {
    setLessons(initialLessons ?? []);
  }, [initialLessons]);

  useEffect(() => {
    setFinalQuizzes(initialFinalQuizzes ?? []);
  }, [initialFinalQuizzes]);

  // --- Wrapped Mutation Functions --- //

  const addLesson = useCallback(
    async (courseId: Id<"courses">) => {
      setIsMutating(true);
      // No reliable optimistic update without knowing the new lesson ID/data
      try {
        const order = lessons.length;
        await onAddLesson(courseId, order);
        toast.success("Lesson added successfully!");
        // Note: Requires parent component to refetch/update initialLessons prop
      } catch (error) {
        console.error("Error adding lesson:", error);
        toast.error(
          `Failed to add lesson. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsMutating(false);
      }
    },
    [lessons.length, onAddLesson],
  ); // Removed courseId as it's assumed stable within context

  const addTopic = useCallback(
    async (lessonId: Id<"lessons">) => {
      setIsMutating(true);
      // No reliable optimistic update without knowing the new topic ID/data
      try {
        const parentLesson = lessons.find((l) => l._id === lessonId);
        const order = parentLesson?.topics?.length ?? 0;
        await onAddTopic(lessonId, order);
        toast.success("Topic added successfully!");
        // Note: Requires parent component to refetch/update initialLessons prop
      } catch (error) {
        console.error("Error adding topic:", error);
        toast.error(
          `Failed to add topic. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, onAddTopic],
  );

  const addQuiz = useCallback(
    async (context: Parameters<typeof onAddQuiz>[0]) => {
      setIsMutating(true);
      // No reliable optimistic update without knowing the new quiz ID/data
      try {
        let order = 0;
        if ("topicId" in context) {
          let parentTopic: TopicWithQuizzes | undefined;
          lessons.forEach((l) => {
            const found = l.topics?.find((t) => t._id === context.topicId);
            if (found) parentTopic = found;
          });
          order = parentTopic?.quizzes?.length ?? 0;
          await onAddQuiz({ topicId: context.topicId, order });
          toast.success("Quiz added to topic successfully!");
        } else {
          order = finalQuizzes.length;
          await onAddQuiz({
            isFinalQuiz: true,
            courseId: context.courseId,
            order,
          });
          toast.success("Final quiz added successfully!");
        }
        // Note: Requires parent component to refetch/update initial* props
      } catch (error) {
        console.error("Error adding quiz:", error);
        toast.error(
          `Failed to add quiz. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, finalQuizzes.length, onAddQuiz],
  );

  const removeLesson = useCallback(
    async (lessonId: Id<"lessons">) => {
      const originalLessons = lessons;
      setIsMutating(true);
      // Optimistic update
      setLessons((prev) => prev.filter((l) => l._id !== lessonId));
      try {
        await onRemoveLesson(lessonId);
        toast.success("Lesson removed successfully!");
      } catch (error) {
        console.error("Error removing lesson:", error);
        toast.error(
          `Failed to remove lesson. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setLessons(originalLessons); // Revert
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, onRemoveLesson],
  );

  const removeTopic = useCallback(
    async (topicId: Id<"topics">) => {
      const originalLessons = lessons.map((l) => ({
        ...l,
        topics: [...(l.topics ?? [])],
      }));
      setIsMutating(true);
      // Optimistic update
      setLessons((prev) =>
        prev.map((l) => ({
          ...l,
          topics: (l.topics ?? []).filter((t) => t._id !== topicId),
        })),
      );
      try {
        await onRemoveTopic(topicId);
        toast.success("Topic removed successfully!");
      } catch (error) {
        console.error("Error removing topic:", error);
        toast.error(
          `Failed to remove topic. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setLessons(originalLessons); // Revert
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, onRemoveTopic],
  );

  const removeQuiz = useCallback(
    async (quizId: Id<"quizzes">) => {
      const originalLessons = lessons.map((l) => ({
        ...l,
        topics:
          l.topics?.map((t) => ({ ...t, quizzes: [...(t.quizzes ?? [])] })) ??
          [],
      }));
      const originalFinalQuizzes = [...finalQuizzes];
      setIsMutating(true);
      // Optimistic update (remove from both lessons and final quizzes)
      setLessons((prev) =>
        prev.map((l) => ({
          ...l,
          topics: (l.topics ?? []).map((t) => ({
            ...t,
            quizzes: (t.quizzes ?? []).filter((q) => q._id !== quizId),
          })),
        })),
      );
      setFinalQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      try {
        await onRemoveQuiz(quizId);
        toast.success("Quiz removed successfully!");
      } catch (error) {
        console.error("Error removing quiz:", error);
        toast.error(
          `Failed to remove quiz. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setLessons(originalLessons); // Revert
        setFinalQuizzes(originalFinalQuizzes); // Revert
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, finalQuizzes, onRemoveQuiz],
  );

  const changeLessonTitle = useCallback(
    async (lessonId: Id<"lessons">, newTitle: string) => {
      const originalLessons = lessons;
      setIsMutating(true);
      // Optimistic update
      setLessons((prev) =>
        prev.map((l) => (l._id === lessonId ? { ...l, title: newTitle } : l)),
      );
      try {
        await onTitleChangeLesson(lessonId, newTitle);
        toast.success("Lesson title updated!");
      } catch (error) {
        console.error("Error updating lesson title:", error);
        toast.error(
          `Failed to update lesson title. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setLessons(originalLessons); // Revert
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, onTitleChangeLesson],
  );

  const changeTopicTitle = useCallback(
    async (topicId: Id<"topics">, newTitle: string) => {
      const originalLessons = lessons.map((l) => ({
        ...l,
        topics: [...(l.topics ?? [])],
      }));
      setIsMutating(true);
      // Optimistic update
      setLessons((prev) =>
        prev.map((l) => ({
          ...l,
          topics: (l.topics ?? []).map((t) =>
            t._id === topicId ? { ...t, title: newTitle } : t,
          ),
        })),
      );
      try {
        await onTitleChangeTopic(topicId, newTitle);
        toast.success("Topic title updated!");
      } catch (error) {
        console.error("Error updating topic title:", error);
        toast.error(
          `Failed to update topic title. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setLessons(originalLessons); // Revert
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, onTitleChangeTopic],
  );

  const changeQuizTitle = useCallback(
    async (quizId: Id<"quizzes">, newTitle: string) => {
      const originalLessons = lessons.map((l) => ({
        ...l,
        topics:
          l.topics?.map((t) => ({ ...t, quizzes: [...(t.quizzes ?? [])] })) ??
          [],
      }));
      const originalFinalQuizzes = [...finalQuizzes];
      setIsMutating(true);
      // Optimistic update
      setLessons((prev) =>
        prev.map((l) => ({
          ...l,
          topics: (l.topics ?? []).map((t) => ({
            ...t,
            quizzes: (t.quizzes ?? []).map((q) =>
              q._id === quizId ? { ...q, title: newTitle } : q,
            ),
          })),
        })),
      );
      setFinalQuizzes((prev) =>
        prev.map((q) => (q._id === quizId ? { ...q, title: newTitle } : q)),
      );
      try {
        await onTitleChangeQuiz(quizId, newTitle);
        toast.success("Quiz title updated!");
      } catch (error) {
        console.error("Error updating quiz title:", error);
        toast.error(
          `Failed to update quiz title. ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setLessons(originalLessons); // Revert
        setFinalQuizzes(originalFinalQuizzes); // Revert
      } finally {
        setIsMutating(false);
      }
    },
    [lessons, finalQuizzes, onTitleChangeQuiz],
  );

  return {
    lessons,
    finalQuizzes,
    isMutating,
    addLesson,
    addTopic,
    addQuiz,
    removeLesson,
    removeTopic,
    removeQuiz,
    changeLessonTitle,
    changeTopicTitle,
    changeQuizTitle,
  };
};
