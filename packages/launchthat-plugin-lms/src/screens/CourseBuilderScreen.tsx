"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";

import type { VimeoVideoItem } from "../CourseBuilderV3/CourseBuilder";
import type { Id } from "../lib/convexId";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsCourseStructureItem,
} from "../types";
import { CourseBuilder } from "../CourseBuilderV3";

interface CourseBuilderScreenProps {
  courseId?: Id<"posts">;
  organizationId?: Id<"organizations">;
}

interface NormalizedVimeoVideo extends VimeoVideoItem {}

const sortByOrder = (
  a: { order?: number | null },
  b: { order?: number | null },
) => (a.order ?? 0) - (b.order ?? 0);

export const CourseBuilderScreen = ({
  courseId,
  organizationId,
}: CourseBuilderScreenProps) => {
  const [vimeoVideos, setVimeoVideos] = useState<NormalizedVimeoVideo[]>([]);
  const [isLoadingVimeoVideos, setIsLoadingVimeoVideos] = useState(false);
  const [hasAttemptedVimeoFetch, setHasAttemptedVimeoFetch] = useState(false);

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
  const attachFinalQuizToCourse = useMutation(
    api.plugins.lms.mutations.attachFinalQuizToCourse,
  );
  const removeLessonFromCourse = useMutation(
    api.plugins.lms.mutations.removeLessonFromCourseStructure,
  );
  const removeTopicFromLesson = useMutation(
    api.plugins.lms.mutations.removeTopicFromLesson,
  );
  const removeQuizFromLesson = useMutation(
    api.plugins.lms.mutations.removeQuizFromLesson,
  );
  const removeFinalQuizFromCourse = useMutation(
    api.plugins.lms.mutations.removeFinalQuizFromCourse,
  );
  const createLessonFromVimeo = useMutation(
    api.plugins.lms.mutations.createLessonFromVimeo,
  );
  const createTopicFromVimeo = useMutation(
    api.plugins.lms.mutations.createTopicFromVimeo,
  );
  const createQuizFromVimeo = useMutation(
    api.plugins.lms.mutations.createQuizFromVimeo,
  );
  const fetchVimeoVideos = useAction(api.vimeo.actions.getCachedVimeoVideos);
  const vimeoEnabledOption = useQuery(
    api.core.options.get,
    organizationId
      ? ({
          metaKey: "plugin_vimeo_enabled",
          type: "site",
          orgId: organizationId,
        } as {
          metaKey: string;
          type: "site";
          orgId: Id<"organizations">;
        })
      : "skip",
  );

  const builderInitialState = useMemo(() => {
    if (!courseData) return undefined;

    const courseSlug = courseData.course.slug ?? undefined;

    const slugOrId = (slug: string | null | undefined, id: string) =>
      slug && slug.length > 0 ? slug : id;

    const buildLessonViewUrl = (lesson: LmsBuilderLesson) => {
      const lessonSegment = slugOrId(lesson.slug, lesson._id);
      if (courseSlug) {
        return `/course/${courseSlug}/lesson/${lessonSegment}`;
      }
      return `/lesson/${lessonSegment}`;
    };

    const buildTopicViewUrl = (
      topic: LmsBuilderTopic,
      parentLesson?: LmsBuilderLesson | null,
    ) => {
      const topicSegment = slugOrId(topic.slug, topic._id);
      if (courseSlug && parentLesson?.slug) {
        return `/course/${courseSlug}/lesson/${parentLesson.slug}/topic/${topicSegment}`;
      }
      return `/topic/${topicSegment}`;
    };

    const buildQuizViewUrl = (
      quiz: LmsBuilderQuiz,
      parentLesson?: LmsBuilderLesson | null,
      parentTopic?: LmsBuilderTopic | null,
    ) => {
      const quizSegment = slugOrId(quiz.slug, quiz._id);
      if (courseSlug && parentLesson?.slug) {
        const lessonBase = `/course/${courseSlug}/lesson/${parentLesson.slug}`;
        if (parentTopic?.slug) {
          return `${lessonBase}/topic/${parentTopic.slug}/quiz/${quizSegment}`;
        }
        return `${lessonBase}/quiz/${quizSegment}`;
      }
      return `/quiz/${quizSegment}`;
    };

    const buildEditUrl = (postType: string, id: string) =>
      `/admin/edit?post_type=${postType}&post_id=${id}`;

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
      const lessonViewUrl = buildLessonViewUrl(lesson);
      const lessonEditUrl = buildEditUrl("lessons", lesson._id);

      const topics =
        (courseData.attachedTopics ?? [])
          .filter((topic) => topic.lessonId === lesson._id)
          .sort(sortByOrder)
          .map((topic) => ({
            id: topic._id,
            title: topic.title ?? "Untitled topic",
            type: "topic" as const,
            quizzes: [],
            viewUrl: buildTopicViewUrl(topic, lesson),
            editUrl: buildEditUrl("topics", topic._id),
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
            viewUrl: buildQuizViewUrl(quiz, lesson, null),
            editUrl: buildEditUrl("quizzes", quiz._id),
          })) ?? [];

      return {
        id: lesson._id,
        title: lesson.title ?? "Untitled lesson",
        type: "lesson" as const,
        viewUrl: lessonViewUrl,
        editUrl: lessonEditUrl,
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
          viewUrl: buildQuizViewUrl(quiz),
          editUrl: buildEditUrl("quizzes", quiz._id),
        })) ?? [];

    const normalizeLesson = (lesson: LmsBuilderLesson) => ({
      id: lesson._id,
      title: lesson.title ?? "Untitled lesson",
      type: "lesson" as const,
      viewUrl: buildLessonViewUrl(lesson),
      editUrl: buildEditUrl("lessons", lesson._id),
    });

    const normalizeTopic = (topic: LmsBuilderTopic) => ({
      id: topic._id,
      title: topic.title ?? "Untitled topic",
      type: "topic" as const,
      description: topic.excerpt,
      viewUrl: buildTopicViewUrl(topic),
      editUrl: buildEditUrl("topics", topic._id),
    });

    const normalizeQuiz = (quiz: LmsBuilderQuiz) => ({
      id: quiz._id,
      title: quiz.title ?? "Untitled quiz",
      type: "quiz" as const,
      viewUrl: buildQuizViewUrl(quiz),
      editUrl: buildEditUrl("quizzes", quiz._id),
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

  const handleAttachFinalQuiz = useCallback(
    async (quizId: string, incomingCourseId?: string, _order?: number) => {
      const resolvedCourseId = (incomingCourseId ?? courseId) as
        | Id<"posts">
        | undefined;
      if (!resolvedCourseId) return;
      try {
        await attachFinalQuizToCourse({
          courseId: resolvedCourseId,
          quizId: quizId as Id<"posts">,
          order: 0,
        });
        toast.success("Final quiz attached.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to attach final quiz.");
      }
    },
    [attachFinalQuizToCourse, courseId],
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

  const handleRemoveLesson = useCallback(
    async (lessonId: string) => {
      if (!courseId) return;
      try {
        await removeLessonFromCourse({
          courseId: courseId as Id<"posts">,
          lessonId: lessonId as Id<"posts">,
        });
        toast.success("Lesson removed.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove lesson.");
      }
    },
    [courseId, removeLessonFromCourse],
  );

  const handleRemoveTopic = useCallback(
    async (topicId: string) => {
      try {
        await removeTopicFromLesson({
          topicId: topicId as Id<"posts">,
        });
        toast.success("Topic removed.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove topic.");
      }
    },
    [removeTopicFromLesson],
  );

  const handleRemoveQuiz = useCallback(
    async (quizId: string) => {
      try {
        await removeQuizFromLesson({
          quizId: quizId as Id<"posts">,
        });
        toast.success("Quiz removed.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove quiz.");
      }
    },
    [removeQuizFromLesson],
  );

  const handleRemoveFinalQuiz = useCallback(
    async (quizId: string) => {
      try {
        await removeFinalQuizFromCourse({
          quizId: quizId as Id<"posts">,
        });
        toast.success("Final quiz removed.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove final quiz.");
      }
    },
    [removeFinalQuizFromCourse],
  );

  const handleCreateLessonFromVimeo = useCallback(
    async (video: VimeoVideoItem) => {
      if (!courseId || !organizationId) return;
      try {
        await createLessonFromVimeo({
          courseId: courseId as Id<"posts">,
          organizationId: organizationId as Id<"organizations">,
          video,
        });
        toast.success("Lesson created from Vimeo video.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create lesson from Vimeo video.");
      }
    },
    [courseId, createLessonFromVimeo, organizationId],
  );

  const handleCreateTopicFromVimeo = useCallback(
    async (lessonId: string, video: VimeoVideoItem) => {
      if (!organizationId) return;
      try {
        await createTopicFromVimeo({
          lessonId: lessonId as Id<"posts">,
          organizationId: organizationId as Id<"organizations">,
          video,
        });
        toast.success("Topic created from Vimeo video.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create topic from Vimeo video.");
      }
    },
    [createTopicFromVimeo, organizationId],
  );

  const handleCreateQuizFromVimeo = useCallback(
    async (
      context: { lessonId?: string; topicId?: string },
      video: VimeoVideoItem,
    ) => {
      if (!organizationId) return;
      try {
        await createQuizFromVimeo({
          targetLessonId: context.lessonId
            ? (context.lessonId as Id<"posts">)
            : undefined,
          targetTopicId: context.topicId
            ? (context.topicId as Id<"posts">)
            : undefined,
          organizationId: organizationId as Id<"organizations">,
          video,
        });
        toast.success("Quiz created from Vimeo video.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create quiz from Vimeo video.");
      }
    },
    [createQuizFromVimeo, organizationId],
  );

  const isVimeoEnabled = Boolean(vimeoEnabledOption?.metaValue);

  useEffect(() => {
    const shouldLoadVimeo = isVimeoEnabled && Boolean(organizationId);
    if (!shouldLoadVimeo || hasAttemptedVimeoFetch) {
      return;
    }
    if (!organizationId) return;
    setHasAttemptedVimeoFetch(true);
    setIsLoadingVimeoVideos(true);
    fetchVimeoVideos({ ownerId: organizationId })
      .then((response) => {
        const dataArray: unknown[] =
          (response as { data?: unknown[] })?.data ?? [];
        const normalized = dataArray
          .map((item) => {
            const record = item as {
              uri?: string;
              name?: string;
              description?: string;
              link?: string;
              pictures?: { sizes?: Array<{ link?: string }> };
            };
            const fallbackId =
              record.uri?.split("/").pop() ?? record.uri ?? record.name;
            if (!fallbackId || !record.name) return null;
            return {
              videoId: fallbackId,
              title: record.name,
              description: record.description ?? undefined,
              embedUrl: record.link ?? undefined,
              thumbnailUrl: record.pictures?.sizes?.[0]?.link ?? undefined,
            };
          })
          .filter(Boolean) as NormalizedVimeoVideo[];
        setVimeoVideos(normalized);
      })
      .catch((error) => {
        console.error("Failed to load Vimeo videos", error);
        setVimeoVideos([]);
      })
      .finally(() => {
        setIsLoadingVimeoVideos(false);
      });
  }, [
    fetchVimeoVideos,
    hasAttemptedVimeoFetch,
    organizationId,
    isVimeoEnabled,
    vimeoEnabledOption,
  ]);

  if (!courseId) {
    return (
      <div className="text-muted-foreground rounded-md border p-6 text-sm">
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
      onAttachTopic={(topicId: string, lessonId: string) =>
        handleAttachTopic(topicId, lessonId)
      }
      onAttachQuizToLesson={handleAttachQuizToLesson}
      onAttachQuizToFinal={handleAttachFinalQuiz}
      onReorderLessons={handleReorderLessons}
      onReorderLessonTopics={handleReorderLessonTopics}
      onRemoveLesson={handleRemoveLesson}
      onRemoveTopic={handleRemoveTopic}
      onRemoveQuiz={handleRemoveQuiz}
      onRemoveFinalQuiz={handleRemoveFinalQuiz}
      availableVimeoVideos={isVimeoEnabled ? vimeoVideos : undefined}
      isLoadingVimeoVideos={isVimeoEnabled ? isLoadingVimeoVideos : undefined}
      onCreateLessonFromVimeo={handleCreateLessonFromVimeo}
      onCreateTopicFromVimeo={handleCreateTopicFromVimeo}
      onCreateQuizFromVimeo={handleCreateQuizFromVimeo}
    />
  );
};
