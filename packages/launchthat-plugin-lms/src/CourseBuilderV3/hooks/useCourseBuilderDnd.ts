import type {
  Active,
  DragCancelEvent,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";

import type { CourseBuilderProps, VimeoVideoItem } from "../CourseBuilder";
import type {
  CourseBuilderState,
  Lesson,
  Topic,
} from "../store/useCourseBuilderStore";
import type { LessonItem, QuizItem, TopicItem } from "../types/content";

interface UseCourseBuilderDndProps {
  mainContentItems: CourseBuilderState["mainContentItems"];
  availableLessons: LessonItem[];
  availableTopics: TopicItem[];
  availableQuizzes: QuizItem[];
  addTopicToLesson: (lessonId: string, topic: TopicItem) => void;
  addQuizToTopic: (topicId: string, quiz: QuizItem) => void;
  addQuizToLesson: (lessonId: string, quiz: QuizItem) => void;
  setCourseCertificateId: (certificateId: string | null) => void;
  setLessonCertificateId: (lessonId: string, certificateId: string | null) => void;
  setTopicCertificateId: (topicId: string, certificateId: string | null) => void;
  reorderQuizzesInTopic: (
    topicId: string,
    activeId: string,
    overId: string,
  ) => void;
  reorderLessonContentItems: (
    lessonId: string,
    activeId: string,
    overId: string,
  ) => void;
  addMainContentItem: (item: LessonItem | QuizItem) => void;
  reorderMainContentItems: (activeId: string, overId: string) => void;
  onAttachLesson?: (
    lessonId: string,
    courseId: string,
    order: number,
  ) => Promise<void>;
  courseId?: string;
  onAttachTopic?: CourseBuilderProps["onAttachTopic"];
  onAttachQuizToTopic?: CourseBuilderProps["onAttachQuizToTopic"];
  onAttachQuizToFinal?: CourseBuilderProps["onAttachQuizToFinal"];
  onAttachQuizToLesson?: CourseBuilderProps["onAttachQuizToLesson"];
  onReorderLessons?: CourseBuilderProps["onReorderLessons"];
  onReorderLessonTopics?: CourseBuilderProps["onReorderLessonTopics"];
  onReorderLessonQuizzes?: CourseBuilderProps["onReorderLessonQuizzes"];
  onReorderTopicQuizzes?: CourseBuilderProps["onReorderTopicQuizzes"];
  onAddQuiz?: CourseBuilderProps["onAddQuiz"];
  onSetCourseCertificate?: CourseBuilderProps["onSetCourseCertificate"];
  onSetLessonCertificate?: CourseBuilderProps["onSetLessonCertificate"];
  onSetTopicCertificate?: CourseBuilderProps["onSetTopicCertificate"];
  onCreateLessonFromVimeo?: (video: VimeoVideoItem) => Promise<void>;
  onCreateTopicFromVimeo?: (
    lessonId: string,
    video: VimeoVideoItem,
  ) => Promise<void>;
  onCreateQuizFromVimeo?: (
    context: { lessonId?: string; topicId?: string },
    video: VimeoVideoItem,
  ) => Promise<void>;
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

const reorderIds = (ids: string[], activeId: string, overId: string) => {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) {
    return ids;
  }
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) {
    return ids;
  }
  next.splice(to, 0, moved);
  return next;
};

export const useCourseBuilderDnd = ({
  mainContentItems,
  availableLessons,
  availableTopics,
  availableQuizzes,
  addTopicToLesson,
  addQuizToTopic,
  addQuizToLesson,
  setCourseCertificateId,
  setLessonCertificateId,
  setTopicCertificateId,
  reorderQuizzesInTopic,
  addMainContentItem,
  reorderMainContentItems,
  reorderLessonContentItems,
  onAttachLesson,
  courseId,
  onAttachTopic,
  onAttachQuizToTopic,
  onAttachQuizToFinal,
  onAttachQuizToLesson,
  onReorderLessons,
  onReorderLessonTopics,
  onReorderLessonQuizzes,
  onReorderTopicQuizzes,
  onAddQuiz,
  onSetCourseCertificate,
  onSetLessonCertificate,
  onSetTopicCertificate,
  onCreateLessonFromVimeo,
  onCreateTopicFromVimeo,
  onCreateQuizFromVimeo,
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
      vimeoVideo?: VimeoVideoItem;
      fromVimeo?: boolean;
      vimeoContentType?: "lesson" | "topic" | "quiz";
      label?: string;
    };
    const isVimeoItem =
      Boolean(activeData?.fromVimeo) && Boolean(activeData?.vimeoVideo);

    const overData = over.data.current as DropzoneData;
    const overKind = overData.kind;
    const overType = overData.type;

    console.log("[CourseBuilderDnd] dragEnd", {
      activeId: currentActiveId,
      overId: currentOverId,
      currentActiveType,
      overKind,
      overType,
      activeData,
      overData,
    });

    if (currentActiveId === currentOverId) {
      console.log("[CourseBuilderDnd] Same source/target, abort");
      return;
    }

    if (overKind) {
      switch (overKind) {
        case "main-content-root": {
          if (currentActiveType === "certificate") {
            if (!courseId) break;
            if (isVimeoItem) break;
            await onSetCourseCertificate?.(courseId, currentActiveId);
            setCourseCertificateId(currentActiveId);
            break;
          }
          if (currentActiveType === "lesson") {
            if (isVimeoItem && activeData?.vimeoVideo) {
              if (onCreateLessonFromVimeo) {
                await onCreateLessonFromVimeo(activeData.vimeoVideo);
              }
            } else {
              const lessonData = availableLessons.find(
                (l) => l.id === currentActiveId,
              );
              if (lessonData) {
                const order = overData.order ?? 0;
                if (onAttachLesson && courseId) {
                  await onAttachLesson(currentActiveId, courseId, order);
                }
                addMainContentItem(lessonData);
              }
            }
          } else if (currentActiveType === "quiz") {
            if (isVimeoItem) {
              // Final quizzes from Vimeo are not supported yet.
              // Users should drop onto a lesson or topic.
            } else {
              const availableQuiz = availableQuizzes.find(
                (q) => q.id === currentActiveId,
              );
              const fallbackQuiz =
                availableQuiz ??
                ({
                  id: currentActiveId,
                  title:
                    (activeData?.label as string | undefined) ??
                    "Untitled quiz",
                  type: "quiz",
                } as QuizItem);
              if (courseId && onAttachQuizToFinal) {
                console.log("[CourseBuilderDnd] Attaching final quiz", {
                  quizId: fallbackQuiz.id,
                  courseId,
                });
                await onAttachQuizToFinal(fallbackQuiz.id, courseId, 0);
              } else if (onAddQuiz && courseId) {
                console.log(
                  "[CourseBuilderDnd] Using onAddQuiz for final quiz",
                  {
                    courseId,
                  },
                );
                await onAddQuiz({
                  isFinalQuiz: true,
                  courseId,
                  order: 0,
                });
              } else {
                console.warn(
                  "[CourseBuilderDnd] No handler available for final quiz attachment",
                );
              }
              addMainContentItem(fallbackQuiz);
            }
          }
          break;
        }
        case "lesson-content": {
          if (!overData.lessonId) break;
          const targetLessonId = overData.lessonId;
          if (currentActiveType === "certificate") {
            if (isVimeoItem) break;
            await onSetLessonCertificate?.(targetLessonId, currentActiveId);
            setLessonCertificateId(targetLessonId, currentActiveId);
            break;
          }
          if (currentActiveType === "topic") {
            if (
              isVimeoItem &&
              activeData?.vimeoVideo &&
              onCreateTopicFromVimeo
            ) {
              await onCreateTopicFromVimeo(
                targetLessonId,
                activeData.vimeoVideo,
              );
            } else {
              const topic = availableTopics.find(
                (t) => t.id === currentActiveId,
              );
              if (topic) {
                if (onAttachTopic) {
                  await onAttachTopic(topic.id, targetLessonId, 0);
                }
                addTopicToLesson(targetLessonId, topic);
              }
            }
          }
          if (currentActiveType === "quiz") {
            if (
              isVimeoItem &&
              activeData?.vimeoVideo &&
              onCreateQuizFromVimeo
            ) {
              await onCreateQuizFromVimeo(
                { lessonId: targetLessonId },
                activeData.vimeoVideo,
              );
              console.log(
                "[CourseBuilderDnd] Created quiz from Vimeo for lesson",
                targetLessonId,
              );
            } else {
              const availableQuiz = availableQuizzes.find(
                (q) => q.id === currentActiveId,
              );
              const fallbackQuiz =
                availableQuiz ??
                ({
                  id: currentActiveId,
                  title:
                    (activeData?.label as string | undefined) ??
                    "Untitled quiz",
                  type: "quiz",
                } as QuizItem);
              if (onAttachQuizToLesson) {
                console.log(
                  "[CourseBuilderDnd] Attaching quiz to lesson via callback",
                  { lessonId: targetLessonId, quizId: fallbackQuiz.id },
                );
                await onAttachQuizToLesson(targetLessonId, fallbackQuiz.id, 0);
              } else if (onAddQuiz) {
                console.log("[CourseBuilderDnd] Using onAddQuiz fallback", {
                  lessonId: targetLessonId,
                });
                await onAddQuiz({ lessonId: targetLessonId, order: 0 });
              } else {
                console.warn(
                  "[CourseBuilderDnd] No quiz attachment callbacks available",
                );
              }
              addQuizToLesson(targetLessonId, fallbackQuiz);
            }
          }
          break;
        }
        case "topic-quiz": {
          if (currentActiveType === "certificate" && overData.topicId) {
            if (isVimeoItem) break;
            await onSetTopicCertificate?.(overData.topicId, currentActiveId);
            setTopicCertificateId(overData.topicId, currentActiveId);
            break;
          }
          if (currentActiveType === "quiz" && overData.topicId) {
            if (
              isVimeoItem &&
              activeData?.vimeoVideo &&
              onCreateQuizFromVimeo
            ) {
              await onCreateQuizFromVimeo(
                { topicId: overData.topicId },
                activeData.vimeoVideo,
              );
            } else {
              const quiz = availableQuizzes.find(
                (q) => q.id === currentActiveId,
              );
              if (quiz) {
                if (onAttachQuizToTopic) {
                  await onAttachQuizToTopic(quiz.id, overData.topicId, 0);
                }
                addQuizToTopic(overData.topicId, quiz);
              }
            }
          }
          break;
        }
      }
      return;
    }

    if (currentActiveType && overType) {
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
        if (
          onReorderLessons &&
          currentActiveType === "lesson" &&
          overType === "lesson"
        ) {
          const lessonIds = mainContentItems
            .filter((item) => item.type === "lesson")
            .map((item) => item.id);
          const nextOrder = reorderIds(
            lessonIds,
            currentActiveId,
            currentOverId,
          );
          await onReorderLessons(nextOrder);
        }
      } else if (
        (currentActiveType === "topic" ||
          (currentActiveType === "quiz" &&
            activeData.parentLessonId &&
            !activeData.parentTopicId)) &&
        (overType === "topic" ||
          (overType === "quiz" &&
            overData.parentLessonId &&
            !overData.parentTopicId)) &&
        activeData.parentLessonId &&
        activeData.parentLessonId === overData.parentLessonId
      ) {
        reorderLessonContentItems(
          activeData.parentLessonId,
          currentActiveId,
          currentOverId,
        );
        const lesson = mainContentItems.find(
          (item) =>
            item.type === "lesson" && item.id === activeData.parentLessonId,
        ) as Lesson | undefined;
        if (lesson) {
          if (currentActiveType === "topic" && onReorderLessonTopics) {
            const topicIds = lesson.contentItems
              .filter((item) => item.type === "topic")
              .map((item) => item.id);
            const nextOrder = reorderIds(
              topicIds,
              currentActiveId,
              currentOverId,
            );
            await onReorderLessonTopics(lesson.id, nextOrder);
          } else if (currentActiveType === "quiz" && onReorderLessonQuizzes) {
            const quizIds = lesson.contentItems
              .filter((item) => item.type === "quiz")
              .map((item) => item.id);
            const nextOrder = reorderIds(
              quizIds,
              currentActiveId,
              currentOverId,
            );
            await onReorderLessonQuizzes(lesson.id, nextOrder);
          }
        }
      } else if (
        currentActiveType === "quiz" &&
        overType === "quiz" &&
        activeData.parentTopicId &&
        activeData.parentTopicId === overData.parentTopicId
      ) {
        reorderQuizzesInTopic(
          activeData.parentTopicId,
          currentActiveId,
          currentOverId,
        );
        if (onReorderTopicQuizzes) {
          const topic = (
            mainContentItems.find(
              (item) =>
                item.type === "lesson" &&
                (item as Lesson).contentItems.some(
                  (content) =>
                    content.type === "topic" &&
                    content.id === activeData.parentTopicId,
                ),
            ) as Lesson | undefined
          )?.contentItems.find(
            (content) =>
              content.type === "topic" &&
              content.id === activeData.parentTopicId,
          ) as Topic | undefined;
          if (topic) {
            const quizIds = (topic.quizzes ?? []).map((quiz) => quiz.id);
            const nextOrder = reorderIds(
              quizIds,
              currentActiveId,
              currentOverId,
            );
            await onReorderTopicQuizzes(topic.id, nextOrder);
          }
        }
      }
    }
  };

  return {
    activeItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
};
