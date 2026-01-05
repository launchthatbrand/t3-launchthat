"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";

import type { VimeoVideoItem } from "../CourseBuilderV3/CourseBuilder";
import type { Id } from "../lib/convexId";
import type {
  LmsBuilderCertificate,
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
  const lmsQueries = api.plugins.lms.queries as any;
  const lmsMutations = api.plugins.lms.mutations as any;

  const [vimeoSearch, setVimeoSearch] = useState("");
  const [vimeoCursor, setVimeoCursor] = useState<string | null>(null);
  const [vimeoVideos, setVimeoVideos] = useState<NormalizedVimeoVideo[]>([]);

  const courseData = useQuery(
    lmsQueries.getCourseStructureWithItems,
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
    lmsQueries.getAvailableLessons,
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
    lmsQueries.getAvailableTopics,
    courseId
      ? ({
          organizationId: organizationId ?? undefined,
        } as {
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderTopic[] | undefined;

  const availableQuizzes = useQuery(
    lmsQueries.getAvailableQuizzes,
    courseId
      ? ({
          organizationId: organizationId ?? undefined,
        } as {
          organizationId?: Id<"organizations">;
        })
      : "skip",
  ) as LmsBuilderQuiz[] | undefined;

  const availableCertificates = useQuery(
    lmsQueries.listCertificates,
    organizationId
      ? ({
          organizationId: organizationId ?? undefined,
        } as { organizationId?: Id<"organizations"> })
      : "skip",
  ) as LmsBuilderCertificate[] | undefined;

  const addLessonToCourse = useMutation(lmsMutations.addLessonToCourse);
  const reorderLessonsInCourse = useMutation(
    lmsMutations.reorderLessonsInCourse,
  );
  const attachTopicToLesson = useMutation(lmsMutations.attachTopicToLesson);
  const reorderTopicsInLesson = useMutation(lmsMutations.reorderTopicsInLesson);
  const attachQuizToLesson = useMutation(lmsMutations.attachQuizToLesson);
  const attachFinalQuizToCourse = useMutation(
    lmsMutations.attachFinalQuizToCourse,
  );
  const removeLessonFromCourse = useMutation(
    lmsMutations.removeLessonFromCourseStructure,
  );
  const removeTopicFromLesson = useMutation(lmsMutations.removeTopicFromLesson);
  const removeQuizFromLesson = useMutation(lmsMutations.removeQuizFromLesson);
  const removeFinalQuizFromCourse = useMutation(
    lmsMutations.removeFinalQuizFromCourse,
  );
  const createLessonFromVimeo = useMutation(lmsMutations.createLessonFromVimeo);

  const setCourseCertificate = useMutation(lmsMutations.setCourseCertificate);
  const setLessonCertificate = useMutation(lmsMutations.setLessonCertificate);
  const setTopicCertificate = useMutation(lmsMutations.setTopicCertificate);
  const createTopicFromVimeo = useMutation(lmsMutations.createTopicFromVimeo);
  const createQuizFromVimeo = useMutation(lmsMutations.createQuizFromVimeo);
  const startVimeoSync = useMutation(
    api.plugins.vimeo.mutations.startVimeoSync,
  );
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

    const normalizeCertificate = (certificate: LmsBuilderCertificate) => ({
      id: certificate._id,
      title: certificate.title ?? "Untitled certificate",
      type: "certificate" as const,
      editUrl: buildEditUrl("certificates", certificate._id),
    });

    const lessonCertificateIds: Record<string, string | null> =
      Object.fromEntries(
        (courseData.attachedLessons ?? []).map((lesson) => [
          lesson._id,
          lesson.certificateId ?? null,
        ]),
      );

    const topicCertificateIds: Record<string, string | null> =
      Object.fromEntries(
        (courseData.attachedTopics ?? []).map((topic) => [
          topic._id,
          topic.certificateId ?? null,
        ]),
      );

    return {
      mainContentItems: [...lessonItems, ...finalQuizzes],
      availableLessons: (availableLessons ?? []).map(normalizeLesson),
      availableTopics: (availableTopics ?? []).map(normalizeTopic),
      availableQuizzes: (availableQuizzes ?? []).map(normalizeQuiz),
      availableCertificates: (availableCertificates ?? []).map(
        normalizeCertificate,
      ),

      courseCertificateId: courseData.course.certificateId ?? null,
      lessonCertificateIds,
      topicCertificateIds,
    };
  }, [
    courseData,
    availableLessons,
    availableTopics,
    availableQuizzes,
    availableCertificates,
  ]);

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

  const createThumbnailAttachment = useAction(
    api.plugins.lms.actions.createVideoThumbnailAttachment,
  ) as (args: {
    sourceUrl: string;
    organizationId?: Id<"organizations">;
  }) => Promise<{
    mediaItemId: Id<"mediaItems">;
    url: string;
    title?: string;
    mimeType?: string;
    width?: number;
    height?: number;
  }>;

  const updateLmsPost = useMutation(
    api.plugins.lms.posts.mutations.updatePost as any,
  ) as (args: {
    id: string;
    meta?: Record<string, string | number | boolean | null>;
  }) => Promise<void>;

  const handleAutoAttachVimeoThumbnail = useCallback(
    async (postId: string, video: VimeoVideoItem) => {
      if (!organizationId) return;

      // Prefer the public Vimeo page URL for oEmbed.
      const sourceUrl = `https://vimeo.com/${video.videoId}`;

      try {
        const result = await createThumbnailAttachment({
          sourceUrl,
          organizationId: organizationId ?? undefined,
        });

        const attachmentEntry = {
          mediaItemId: result.mediaItemId,
          url: result.url,
          title: result.title ?? undefined,
          mimeType: result.mimeType ?? undefined,
          width: result.width ?? undefined,
          height: result.height ?? undefined,
        };

        // Mimic the Lexical oEmbed auto-thumbnail behavior:
        // - Only auto-set attachments for Vimeo-created posts (builder flow).
        // - Record the source URL for idempotency / "safe overwrite" semantics elsewhere.
        await updateLmsPost({
          id: postId,
          meta: {
            __core_attachments: JSON.stringify([attachmentEntry]),
            lmsAutoThumbnailSourceUrl: sourceUrl,
          },
        });
      } catch (error) {
        // Thumbnail creation is a best-effort enhancement; don't block course building.
        console.error("[CourseBuilder] Failed to auto-attach Vimeo thumbnail", {
          postId,
          videoId: video.videoId,
          error,
        });
      }
    },
    [createThumbnailAttachment, organizationId, updateLmsPost],
  );

  const handleCreateLessonFromVimeo = useCallback(
    async (video: VimeoVideoItem) => {
      if (!courseId || !organizationId) return;
      try {
        const result = await createLessonFromVimeo({
          courseId: courseId as Id<"posts">,
          organizationId: organizationId as Id<"organizations">,
          video,
        });
        if (result?.lessonId) {
          await handleAutoAttachVimeoThumbnail(result.lessonId, video);
        }
        toast.success("Lesson created from Vimeo video.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create lesson from Vimeo video.");
      }
    },
    [
      courseId,
      createLessonFromVimeo,
      handleAutoAttachVimeoThumbnail,
      organizationId,
    ],
  );

  const handleCreateTopicFromVimeo = useCallback(
    async (lessonId: string, video: VimeoVideoItem) => {
      if (!organizationId) return;
      try {
        const result = await createTopicFromVimeo({
          lessonId: lessonId as Id<"posts">,
          organizationId: organizationId as Id<"organizations">,
          video,
        });
        if (result?.topicId) {
          await handleAutoAttachVimeoThumbnail(result.topicId, video);
        }
        toast.success("Topic created from Vimeo video.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create topic from Vimeo video.");
      }
    },
    [createTopicFromVimeo, handleAutoAttachVimeoThumbnail, organizationId],
  );

  const handleCreateQuizFromVimeo = useCallback(
    async (
      context: { lessonId?: string; topicId?: string },
      video: VimeoVideoItem,
    ) => {
      if (!organizationId) return;
      try {
        const result = await createQuizFromVimeo({
          targetLessonId: context.lessonId
            ? (context.lessonId as Id<"posts">)
            : undefined,
          targetTopicId: context.topicId
            ? (context.topicId as Id<"posts">)
            : undefined,
          organizationId: organizationId as Id<"organizations">,
          video,
        });
        if (result?.quizId) {
          await handleAutoAttachVimeoThumbnail(result.quizId, video);
        }
        toast.success("Quiz created from Vimeo video.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create quiz from Vimeo video.");
      }
    },
    [createQuizFromVimeo, handleAutoAttachVimeoThumbnail, organizationId],
  );

  const isVimeoEnabled = Boolean(vimeoEnabledOption?.metaValue);
  const vimeoSyncStatus = useQuery(
    api.plugins.vimeo.syncState.getVimeoSyncStatus,
    isVimeoEnabled && organizationId
      ? ({ organizationId: organizationId as Id<"organizations"> } as const)
      : "skip",
  );

  const shouldLoadVimeo = Boolean(isVimeoEnabled && organizationId);
  const vimeoPage = useQuery(
    api.plugins.vimeo.queries.listVideos,
    shouldLoadVimeo
      ? ({
          organizationId: organizationId as Id<"organizations">,
          paginationOpts: { cursor: vimeoCursor, numItems: 60 },
          search:
            vimeoSearch.trim().length > 0 ? vimeoSearch.trim() : undefined,
        } as const)
      : "skip",
  );

  const isLoadingVimeoVideos = shouldLoadVimeo && vimeoPage === undefined;
  const hasMoreVimeoVideos = Boolean(
    vimeoPage && !vimeoPage.isDone && vimeoPage.continueCursor,
  );

  useEffect(() => {
    // Reset pagination when search changes.
    setVimeoCursor(null);
    setVimeoVideos([]);
  }, [vimeoSearch]);

  useEffect(() => {
    if (!shouldLoadVimeo) {
      setVimeoVideos([]);
      return;
    }

    if (!vimeoPage) {
      return;
    }

    type VimeoVideoRow = {
      videoId: string;
      title: string;
      description?: string | null;
      embedUrl?: string | null;
      thumbnailUrl?: string | null;
    };

    const normalized = (vimeoPage.page ?? []).map((row: VimeoVideoRow) => ({
      videoId: row.videoId,
      title: row.title,
      description: row.description ?? undefined,
      embedUrl: row.embedUrl ?? undefined,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
    })) as NormalizedVimeoVideo[];

    setVimeoVideos((prev) => {
      if (!vimeoCursor) {
        return normalized;
      }
      const seen = new Set(prev.map((v) => v.videoId));
      const merged = [...prev];
      for (const next of normalized) {
        if (!seen.has(next.videoId)) {
          merged.push(next);
          seen.add(next.videoId);
        }
      }
      return merged;
    });
  }, [shouldLoadVimeo, vimeoCursor, vimeoPage]);

  const handleLoadMoreVimeo = useCallback(() => {
    if (!vimeoPage || vimeoPage.isDone) return;
    const next = vimeoPage.continueCursor;
    if (!next) return;
    setVimeoCursor(next);
  }, [vimeoPage]);

  const handleStartVimeoSync = useCallback(async () => {
    if (!organizationId) return;
    try {
      const result = await startVimeoSync({
        organizationId: organizationId as Id<"organizations">,
      });
      toast.success("Vimeo sync started", {
        description: `Workflow ${result.workflowId.slice(0, 8)}…`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to start Vimeo sync.");
    }
  }, [organizationId, startVimeoSync]);

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
    availableQuizzes === undefined ||
    availableCertificates === undefined
  ) {
    return <div>Loading course data…</div>;
  }

  if (courseData === null) {
    return <div>Course not found.</div>;
  }

  return (
    <div className="space-y-6">
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
        vimeoSearch={isVimeoEnabled ? vimeoSearch : undefined}
        onVimeoSearchChange={isVimeoEnabled ? setVimeoSearch : undefined}
        hasMoreVimeoVideos={isVimeoEnabled ? hasMoreVimeoVideos : undefined}
        onLoadMoreVimeoVideos={isVimeoEnabled ? handleLoadMoreVimeo : undefined}
        vimeoSyncStatus={isVimeoEnabled ? (vimeoSyncStatus ?? null) : undefined}
        onStartVimeoSync={isVimeoEnabled ? handleStartVimeoSync : undefined}
        onCreateLessonFromVimeo={handleCreateLessonFromVimeo}
        onCreateTopicFromVimeo={handleCreateTopicFromVimeo}
        onCreateQuizFromVimeo={handleCreateQuizFromVimeo}
        onSetCourseCertificate={async (resolvedCourseId, certificateId) => {
          await setCourseCertificate({
            courseId: resolvedCourseId,
            certificateId,
          });
        }}
        onSetLessonCertificate={async (lessonId, certificateId) => {
          await setLessonCertificate({ lessonId, certificateId });
        }}
        onSetTopicCertificate={async (topicId, certificateId) => {
          await setTopicCertificate({ topicId, certificateId });
        }}
      />
    </div>
  );
};
