import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";

import type { Id } from "../../../../../apps/wsa/convex/_generated/dataModel";
import type {
  CourseBuilderV2Props,
  DraggableItemData,
  LessonWithTopics,
  Quiz,
  TopicWithQuizzes,
} from "../types";

// Define the props the hook needs
interface UseCourseBuilderDndProps {
  courseId: Id<"courses">;
  lessons: LessonWithTopics[];
  setLessons: React.Dispatch<React.SetStateAction<LessonWithTopics[]>>;
  finalQuizzes: Quiz[];
  setFinalQuizzes: React.Dispatch<React.SetStateAction<Quiz[]>>;
  // Pass necessary callbacks from parent props
  onAttachLesson: CourseBuilderV2Props["onAttachLesson"];
  onAttachTopic: CourseBuilderV2Props["onAttachTopic"];
  onAttachQuizToTopic: CourseBuilderV2Props["onAttachQuizToTopic"];
  onAttachQuizToFinal: CourseBuilderV2Props["onAttachQuizToFinal"];
  onReorderItems: CourseBuilderV2Props["onReorderItems"];
}

export const useCourseBuilderDnd = ({
  courseId,
  lessons,
  setLessons,
  finalQuizzes,
  setFinalQuizzes,
  onAttachLesson,
  onAttachTopic,
  onAttachQuizToTopic,
  onAttachQuizToFinal,
  onReorderItems,
}: UseCourseBuilderDndProps) => {
  const [activeDragData, setActiveDragData] =
    useState<DraggableItemData | null>(null);
  // Consider moving isAttaching state here if only DND uses it
  const [isAttaching, setIsAttaching] = useState(false);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const currentData = active.data.current;
    // Robust check for valid DraggableItemData structure
    if (
      currentData &&
      typeof currentData === "object" &&
      typeof currentData.type === "string" &&
      currentData.item !== undefined &&
      currentData.item !== null
    ) {
      const potentialDragData = currentData as Partial<DraggableItemData>;
      if (potentialDragData.type && potentialDragData.item) {
        setActiveDragData(potentialDragData as DraggableItemData);
      } else {
        setActiveDragData(null);
      }
    } else {
      setActiveDragData(null);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    console.log(
      `[DragOver] Active: ${active.id} (${active.data.current?.type})`,
      `Over: ${over?.id} (${over?.data.current?.type})`,
    );
    if (!over || active.id === over.id) return;
    // console.log("Drag Over:", active.id, "over", over.id);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeDataLocal = activeDragData;
      // Log initial drag end data
      console.log(
        `[DragEnd] Active: ${active.id} (${active.data.current?.type})`,
        `Over: ${over?.id} (${over?.data.current?.type})`,
        "Active Data Local:",
        activeDataLocal,
        "Over Data:",
        over?.data.current,
      );

      setActiveDragData(null);

      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (!over || !activeDataLocal || !activeDataLocal.item) {
        // Linter might complain, but this check is standard and necessary
        return;
      }

      const item = activeDataLocal.item;
      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);
      const overData = over.data.current as Partial<
        DraggableItemData & { lessonId?: Id<"lessons">; topicId?: Id<"topics"> }
      >;

      //setIsAttaching(false); // Resetting here might be premature

      // Case 1: Sidebar Lesson -> Course Drop Zone
      if (
        activeDataLocal.type === "sidebarLesson" &&
        overIdStr === "course-drop-zone"
      ) {
        console.log(
          "[DragEnd] Matched Case 1: Attach Sidebar Lesson to Course",
        );
        const lessonId = item._id as Id<"lessons">;
        setIsAttaching(true);
        try {
          // Optimistic UI update
          setLessons((prev) => [...prev, item as LessonWithTopics]);
          await onAttachLesson(lessonId, courseId, lessons.length);
          toast.success("Lesson attached successfully!");
        } catch (error) {
          toast.error(
            `Failed to attach lesson. ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          setLessons((prev) => prev.filter((l) => l._id !== lessonId)); // Revert
        } finally {
          setIsAttaching(false);
        }
        return;
      }

      // Case 2: Sidebar Topic -> Lesson Drop Zone
      if (
        activeDataLocal.type === "sidebarTopic" &&
        overData?.type === "topicDropZone"
      ) {
        console.log("[DragEnd] Matched Case 2: Attach Sidebar Topic to Lesson");
        const itemFromEvent = active.data.current?.item as
          | TopicWithQuizzes
          | undefined;
        if (!itemFromEvent) return;
        const topicId = itemFromEvent._id;

        // Primarily rely on the drop zone's data for the target lesson ID
        const targetLessonId = overData?.lessonId as Id<"lessons"> | undefined;

        if (targetLessonId) {
          const targetLesson = lessons.find((l) => l._id === targetLessonId);
          const targetOrder = targetLesson?.topics?.length ?? 0;
          setIsAttaching(true);
          try {
            setLessons((prev) =>
              prev.map((l) =>
                l._id === targetLessonId
                  ? {
                      ...l,
                      topics: [...(l.topics ?? []), itemFromEvent],
                    }
                  : l,
              ),
            );
            await onAttachTopic(topicId, targetLessonId, targetOrder);
            toast.success("Topic attached successfully!");
          } catch (error) {
            toast.error(
              `Failed to attach topic. ${error instanceof Error ? error.message : "Unknown error"}`,
            );
            setLessons((prev) =>
              prev.map((l) =>
                l._id === targetLessonId
                  ? {
                      ...l,
                      topics: (l.topics ?? []).filter((t) => t._id !== topicId),
                    }
                  : l,
              ),
            ); // Revert
          } finally {
            setIsAttaching(false);
          }
        } else {
          toast.error("Could not determine target lesson for topic.");
        }
        return;
      }

      // Case 3: Dropping a Quiz
      const isActiveQuiz = activeDataLocal.type === "quiz";
      const isSidebarQuiz = activeDataLocal.type === "sidebarQuiz";
      const droppedQuiz = item as Quiz;

      if (isActiveQuiz || isSidebarQuiz) {
        const quizId = droppedQuiz._id;
        // Define originals needed for revert BEFORE try block
        const originalLessonsForRevert = lessons.map((l) => ({
          ...l,
          topics:
            l.topics?.map((t) => ({ ...t, quizzes: [...(t.quizzes ?? [])] })) ??
            [],
        }));
        const originalFinalQuizzesForRevert = [...finalQuizzes];

        // Case 3a: Drop onto Final Quizzes Zone
        if (overIdStr === "final-quizzes-zone") {
          console.log("[DragEnd] Matched Case 3a: Attach Quiz to Final Zone");
          const order = finalQuizzes.length;
          // Use already defined originals for revert
          setIsAttaching(true);
          try {
            // Optimistic Update: Add to final, remove from original topic if moving
            setFinalQuizzes((current) =>
              current.some((q) => q._id === quizId)
                ? current
                : [...current, droppedQuiz],
            );
            if (isActiveQuiz && activeDataLocal.parentId) {
              const sourceTopicId = activeDataLocal.parentId;
              setLessons((currentLessons) =>
                currentLessons.map((lesson) => ({
                  ...lesson,
                  topics: (lesson.topics ?? []).map((topic) =>
                    topic._id === sourceTopicId
                      ? {
                          ...topic,
                          quizzes: (topic.quizzes ?? []).filter(
                            (q) => q._id !== quizId,
                          ),
                        }
                      : topic,
                  ),
                })),
              );
            }
            await onAttachQuizToFinal(quizId, courseId, order);
            toast.success("Quiz attached to final successfully!");
          } catch (err) {
            // Use error variable
            toast.error(
              `Failed to attach quiz to final. ${err instanceof Error ? err.message : "Unknown error"}`,
            );
            // Revert optimistic update
            setFinalQuizzes(originalFinalQuizzesForRevert);
            setLessons(originalLessonsForRevert);
          } finally {
            setIsAttaching(false);
          }
          return;
        }

        // Case 3b: Drop onto a Topic Zone
        if (overData?.type === "topic") {
          console.log(
            "[DragEnd] Matched Case 3b: Attach/Reorder Quiz on Topic",
          );
          // Optional chain needed
          const targetTopicId =
            overData.topicId ?? // No optional chain needed after guard
            (overIdStr.startsWith("topic-")
              ? (overIdStr.replace("topic-", "") as Id<"topics">)
              : undefined);
          if (targetTopicId) {
            let targetTopic: TopicWithQuizzes | undefined;
            let parentLessonId: Id<"lessons"> | undefined;
            lessons.forEach((lesson) => {
              const foundTopic = lesson.topics?.find(
                (t) => t._id === targetTopicId,
              );
              if (foundTopic) {
                targetTopic = foundTopic;
                parentLessonId = lesson._id;
              }
            });
            const targetOrder = targetTopic?.quizzes?.length ?? 0;
            // Use already defined originals for revert
            setIsAttaching(true);
            try {
              if (isActiveQuiz && activeDataLocal.parentId === targetTopicId) {
                await onReorderItems(activeIdStr, overIdStr, targetTopicId);
                setLessons((currentLessons) => {
                  const lessonIdx = currentLessons.findIndex(
                    (l) => l._id === parentLessonId,
                  );
                  if (lessonIdx === -1) return currentLessons;
                  const topicIdx = currentLessons[lessonIdx]?.topics?.findIndex(
                    (t) => t._id === targetTopicId,
                  );
                  if (topicIdx === undefined || topicIdx === -1)
                    return currentLessons;
                  const currentQuizzes =
                    currentLessons[lessonIdx]?.topics?.[topicIdx]?.quizzes ??
                    [];
                  const oldIdx = currentQuizzes.findIndex(
                    (q) => `quiz-${q._id}` === activeIdStr,
                  );
                  const newIdx = currentQuizzes.findIndex(
                    (q) => `quiz-${q._id}` === overIdStr,
                  );
                  if (oldIdx === -1 || newIdx === -1) return currentLessons;

                  const reorderedQuizzes = arrayMove(
                    currentQuizzes,
                    oldIdx,
                    newIdx,
                  );
                  const newLessons = [...currentLessons];
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  newLessons[lessonIdx]!.topics![topicIdx]!.quizzes =
                    reorderedQuizzes;
                  return newLessons;
                });
                toast.success("Quiz reordered successfully!");
              } else {
                // Attaching/Moving quiz
                await onAttachQuizToTopic(quizId, targetTopicId, targetOrder);
                setLessons((currentLessons) => {
                  let newLessonsState = [...currentLessons];
                  const sourceTopicId = isActiveQuiz
                    ? activeDataLocal.parentId
                    : undefined;

                  // Remove from original position if moving
                  if (sourceTopicId) {
                    newLessonsState = newLessonsState.map((lesson) => ({
                      ...lesson,
                      topics: (lesson.topics ?? []).map((topic) =>
                        topic._id === sourceTopicId
                          ? {
                              ...topic,
                              quizzes: (topic.quizzes ?? []).filter(
                                (q) => q._id !== quizId,
                              ),
                            }
                          : topic,
                      ),
                    }));
                  }
                  // Remove from final quizzes if moving from there
                  setFinalQuizzes((currentFinal) =>
                    currentFinal.filter((q) => q._id !== quizId),
                  );

                  // Add to new position
                  newLessonsState = newLessonsState.map((lesson) =>
                    lesson._id === parentLessonId
                      ? {
                          ...lesson,
                          topics: (lesson.topics ?? []).map((topic) => {
                            if (topic._id === targetTopicId) {
                              const newQuizzes = [...(topic.quizzes ?? [])];
                              const insertIndex = Math.max(
                                0,
                                Math.min(targetOrder, newQuizzes.length),
                              );
                              newQuizzes.splice(insertIndex, 0, droppedQuiz);
                              return { ...topic, quizzes: newQuizzes };
                            }
                            return topic;
                          }),
                        }
                      : lesson,
                  );
                  return newLessonsState;
                });
                toast.success("Quiz attached to topic successfully!");
              }
            } catch (err) {
              // Use error variable
              toast.error(
                `Failed quiz operation. ${err instanceof Error ? err.message : "Unknown error"}`,
              );
              setLessons(originalLessonsForRevert);
              setFinalQuizzes(originalFinalQuizzesForRevert); // Revert final quizzes
            } finally {
              setIsAttaching(false);
            }
          } else {
            toast.error("Could not determine target topic for quiz.");
          }
          return;
        }
      }

      // Case 4: Reordering Lessons or Topics
      if (
        activeIdStr !== overIdStr &&
        !activeIdStr.startsWith("sidebar-") &&
        !overIdStr.startsWith("sidebar-")
      ) {
        const isActiveLesson = activeDataLocal.type === "lesson";
        const isOverLesson = overData?.type === "lesson"; // Optional chain needed
        const isActiveTopic = activeDataLocal.type === "topic";
        const isOverTopic = overData?.type === "topic"; // Optional chain needed

        // Reordering Lessons
        if (isActiveLesson && isOverLesson) {
          console.log("[DragEnd] Matched Case 4a: Reorder Lessons");
          const originalLessons = lessons.map((l) => ({
            ...l,
            topics:
              l.topics?.map((t) => ({
                ...t,
                quizzes: [...(t.quizzes ?? [])],
              })) ?? [],
          }));
          setIsAttaching(true);
          try {
            await onReorderItems(activeIdStr, overIdStr);
            setLessons((currentItems) => {
              const oldIndex = currentItems.findIndex(
                (item) => `lesson-${item._id}` === activeIdStr,
              );
              const newIndex = currentItems.findIndex(
                (item) => `lesson-${item._id}` === overIdStr,
              );
              return oldIndex !== -1 && newIndex !== -1
                ? arrayMove(currentItems, oldIndex, newIndex)
                : currentItems;
            });
            toast.success("Lesson reordered successfully!");
          } catch (err) {
            // Use error variable
            toast.error(
              `Failed to reorder lesson. ${err instanceof Error ? err.message : "Unknown error"}`,
            );
            setLessons(originalLessons);
          } finally {
            setIsAttaching(false);
          }
          return;
        }

        // Reordering Topics within the same Lesson
        if (isActiveTopic && (isOverTopic || isOverLesson)) {
          console.log("[DragEnd] Matched Case 4b: Reorder Topics");
          // Safely determine targetLessonId
          let targetLessonId: Id<"lessons"> | undefined;
          if (overData) {
            // Guard needed
            if (isOverLesson) {
              // Dropping onto a Lesson container, target is the lesson itself
              targetLessonId =
                overData.lessonId ??
                (overIdStr.replace("lesson-", "") as Id<"lessons">);
            } else if (isOverTopic) {
              // Dropping onto another Topic, target is that topic's parent lesson
              targetLessonId = overData.parentId as Id<"lessons"> | undefined; // Parent of a topic is a lesson
            }
          }
          const sourceLessonId = activeDataLocal.parentId as
            | Id<"lessons">
            | undefined; // Parent of a topic is a lesson

          if (sourceLessonId === targetLessonId && targetLessonId) {
            const originalLessons = lessons.map((l) => ({
              ...l,
              topics:
                l.topics?.map((t) => ({
                  ...t,
                  quizzes: [...(t.quizzes ?? [])],
                })) ?? [],
            }));
            setIsAttaching(true);
            try {
              await onReorderItems(activeIdStr, overIdStr, targetLessonId);
              setLessons((currentLessons) => {
                const lessonIndex = currentLessons.findIndex(
                  (l) => l._id === targetLessonId,
                );
                if (lessonIndex === -1) return currentLessons;
                const currentTopics = currentLessons[lessonIndex]?.topics ?? [];
                const oldTopicIndex = currentTopics.findIndex(
                  (t) => `topic-${t._id}` === activeIdStr,
                );
                // Handle dropping onto lesson (end of list) or another topic
                const newTopicIndex = isOverTopic
                  ? currentTopics.findIndex(
                      (t) => `topic-${t._id}` === overIdStr,
                    )
                  : currentTopics.length;

                if (oldTopicIndex !== -1 && newTopicIndex !== -1) {
                  const reorderedTopics = arrayMove(
                    currentTopics,
                    oldTopicIndex,
                    newTopicIndex,
                  );
                  const newLessons = [...currentLessons];
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  newLessons[lessonIndex]!.topics = reorderedTopics;
                  return newLessons;
                }
                return currentLessons;
              });
              toast.success("Topic reordered successfully!");
            } catch (err) {
              // Use error variable
              toast.error(
                `Failed to reorder topic. ${err instanceof Error ? err.message : "Unknown error"}`,
              );
              setLessons(originalLessons);
            } finally {
              setIsAttaching(false);
            }
          } else {
            console.log(
              "Preventing topic move between different lessons for now.",
            );
          }
          return;
        }
      }
    },
    [
      activeDragData,
      lessons,
      setLessons, // Add state setters to dependency array
      finalQuizzes,
      setFinalQuizzes, // Add state setters to dependency array
      onAttachLesson,
      onAttachTopic,
      onAttachQuizToTopic,
      onAttachQuizToFinal,
      onReorderItems,
      courseId,
      // Removed setActiveDragData as it's internal state now
    ],
  );

  return {
    activeDragData,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isAttaching, // Return attaching state if needed by UI
  };
};
