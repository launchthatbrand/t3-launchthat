"use client";

import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsCourseStructureItem,
} from "../types";
import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";

import { CourseBuilder } from "@acme/ui";
import type { Id } from "../lib/convexId";
import { api } from "@portal/convexspec";
import { toast } from "@acme/ui/toast";

interface CourseBuilderScreenProps {
  courseId?: Id<"posts">;
  organizationId?: Id<"organizations">;
}

const sortByOrder = (
  a: { order?: number | null },
  b: { order?: number | null },
) => (a.order ?? 0) - (b.order ?? 0);

export const CourseBuilderScreen = ({
  courseId,
  organizationId,
}: CourseBuilderScreenProps) => {
  const courseData = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    courseId
      ? ({
          courseId,
          organizationId: organizationId ?? undefined,
        } as {
          courseId: Id<"posts">;
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsCourseBuilderData | null | undefined;

  const availableLessons = useQuery(
    api.plugins.lms.queries.getAvailableLessons,
    courseId
      ? ({
          courseId,
          organizationId: organizationId ?? undefined,
        } as {
          courseId: Id<"posts">;
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderLesson[] | undefined;

  const availableTopics = useQuery(
    api.plugins.lms.queries.getAvailableTopics,
    courseId
      ? ({
          organizationId: organizationId ?? undefined,
        } as {
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderTopic[] | undefined;

  const availableQuizzes = useQuery(
    api.plugins.lms.queries.getAvailableQuizzes,
    courseId
      ? ({
          organizationId: organizationId ?? undefined,
        } as {
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderQuiz[] | undefined;

  const addLessonToCourse = useMutation(
    api.plugins.lms.mutations.addLessonToCourse,
  );
  const reorderLessonsInCourse = useMutation(
    api.plugins.lms.mutations.reorderLessonsInCourse,
  );
  const attachTopicToLesson = useMutation(
    api.plugins.lms.mutations.attachTopicToLesson,
  );
  const reorderTopicsInLesson = useMutation(
    api.plugins.lms.mutations.reorderTopicsInLesson,
  );
  const attachQuizToLesson = useMutation(
    api.plugins.lms.mutations.attachQuizToLesson,
  );

  const builderInitialState = useMemo(() => {
    if (!courseData) return undefined;

    const lessonsById = new Map(
      courseData.attachedLessons.map((lesson) => [lesson._id, lesson]),
    );
    const structure = courseData.course.courseStructure ?? [];
    const seenLessonIds = new Set<string>();
    const orderedLessons = structure
      .map((item: LmsCourseStructureItem) => {
        const lesson = lessonsById.get(item.lessonId);
        if (lesson) {
          seenLessonIds.add(lesson._id);
        }
        return lesson;
      })
      .filter((lesson): lesson is LmsBuilderLesson => Boolean(lesson));
    const orphanLessons = courseData.attachedLessons.filter(
      (lesson) => !seenLessonIds.has(lesson._id),
    );
    const allLessons = [...orderedLessons, ...orphanLessons];

    const lessonItems = allLessons.map((lesson) => {
      const topics =
        (courseData.attachedTopics ?? [])
          .filter((topic) => topic.lessonId === lesson._id)
          .sort(sortByOrder)
          .map((topic) => ({
            id: topic._id,
            title: topic.title ?? "Untitled topic",
            type: "topic" as const,
            quizzes: [],
          })) ?? [];

      const lessonQuizzes =
        (courseData.attachedQuizzes ?? [])
          .filter(
            (quiz) =>
              quiz.lessonId === lesson._id && (quiz.isFinal ?? false) === false,
          )
          .sort(sortByOrder)
          .map((quiz) => ({
            id: quiz._id,
            title: quiz.title ?? "Untitled quiz",
            type: "quiz" as const,
          })) ?? [];

      return {
        id: lesson._id,
        title: lesson.title ?? "Untitled lesson",
        type: "lesson" as const,
        contentItems: [...topics, ...lessonQuizzes],
      };
    });

    const finalQuizzes =
      (courseData.attachedQuizzes ?? [])
        .filter((quiz) => (quiz.lessonId == null || quiz.isFinal) ?? false)
        .sort(sortByOrder)
        .map((quiz) => ({
          id: quiz._id,
          title: quiz.title ?? "Untitled quiz",
          type: "quiz" as const,
        })) ?? [];

    const normalizeLesson = (lesson: LmsBuilderLesson) => ({
      id: lesson._id,
      title: lesson.title ?? "Untitled lesson",
      type: "lesson" as const,
    });

    const normalizeTopic = (topic: LmsBuilderTopic) => ({
      id: topic._id,
      title: topic.title ?? "Untitled topic",
      type: "topic" as const,
      description: topic.excerpt,
    });

    const normalizeQuiz = (quiz: LmsBuilderQuiz) => ({
      id: quiz._id,
      title: quiz.title ?? "Untitled quiz",
      type: "quiz" as const,
    });

    return {
      mainContentItems: [...lessonItems, ...finalQuizzes],
      availableLessons: (availableLessons ?? []).map(normalizeLesson),
      availableTopics: (availableTopics ?? []).map(normalizeTopic),
      availableQuizzes: (availableQuizzes ?? []).map(normalizeQuiz),
    };
  }, [courseData, availableLessons, availableTopics, availableQuizzes]);

  const handleAttachLesson = useCallback(
    async (lessonId: string, _course?: string, _order?: number) => {
      if (!courseId) return;
      try {
        await addLessonToCourse({
          courseId: courseId as Id<"posts">,
          lessonId: lessonId as Id<"posts">,
        });
        toast.success("Lesson added to course.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add lesson.");
      }
    },
    [addLessonToCourse, courseId],
  );

  const handleAttachTopic = useCallback(
    async (topicId: string, lessonId: string, _order?: number) => {
      try {
        await attachTopicToLesson({
          lessonId: lessonId as Id<"posts">,
          topicId: topicId as Id<"posts">,
          order: 0,
        });
        toast.success("Topic attached.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to attach topic.");
      }
    },
    [attachTopicToLesson],
  );

  const handleAttachQuizToLesson = useCallback(
    async (lessonId: string, quizId: string, _order?: number) => {
      try {
        await attachQuizToLesson({
          lessonId: lessonId as Id<"posts">,
          quizId: quizId as Id<"posts">,
          order: 0,
          isFinal: false,
        });
        toast.success("Quiz attached.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to attach quiz.");
      }
    },
    [attachQuizToLesson],
  );

  const handleReorderLessons = useCallback(
    async (orderedLessonIds: string[]) => {
      if (!courseId) return;
      try {
        await reorderLessonsInCourse({
          courseId: courseId as Id<"posts">,
          orderedLessonIds: orderedLessonIds as Id<"posts">[],
        });
        toast.success("Lessons reordered.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to reorder lessons.");
      }
    },
    [courseId, reorderLessonsInCourse],
  );

  const handleReorderLessonTopics = useCallback(
    async (lessonId: string, orderedTopicIds: string[]) => {
      try {
        await reorderTopicsInLesson({
          lessonId: lessonId as Id<"posts">,
          orderedTopicIds: orderedTopicIds as Id<"posts">[],
        });
        toast.success("Topics reordered.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to reorder topics.");
      }
    },
    [reorderTopicsInLesson],
  );

  if (!courseId) {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        Save your course first to access the builder.
      </div>
    );
  }

  if (
    courseData === undefined ||
    builderInitialState === undefined ||
    availableLessons === undefined ||
    availableTopics === undefined ||
    availableQuizzes === undefined
  ) {
    return <div>Loading course data…</div>;
  }

  if (courseData === null) {
    return <div>Course not found.</div>;
  }

  return (
    <CourseBuilder
      courseStructure={{
        id: courseData.course._id,
        title: courseData.course.title ?? "Course",
        modules: [],
      }}
      initialState={builderInitialState}
      onAttachLesson={handleAttachLesson}
      onAttachTopic={(topicId, lessonId) =>
        handleAttachTopic(topicId, lessonId)
      }
      onAttachQuizToLesson={handleAttachQuizToLesson}
      onReorderLessons={handleReorderLessons}
      onReorderLessonTopics={handleReorderLessonTopics}
    />
  );
};

