"use client";

import "../filters/registerFrontendFilters";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import type { CourseSettings } from "../constants/courseSettings";
import type { Id } from "../lib/convexId";
import type {
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsPostId,
} from "../types";
import {
  DEFAULT_COURSE_SETTINGS,
  LMS_COURSE_SETTINGS_META_KEY,
} from "../constants/courseSettings";
import {
  coercePostId,
  coerceString,
  deriveCourseId,
  deriveCourseSlug,
  deriveLessonId,
} from "../lib/progressUtils";

type CourseProgressRecord = {
  completedLessonIds: LmsPostId[];
  completedTopicIds: LmsPostId[];
  courseId: LmsPostId;
  lastAccessedId?: LmsPostId;
  lastAccessedType?: "lesson" | "topic";
  lastAccessedAt?: number;
  startedAt?: number;
  updatedAt?: number;
  completedAt?: number;
  userId?: Id<"users">;
} | null;

export type CourseNavEntry =
  | {
      type: "lesson";
      id: LmsPostId;
      slug?: string;
      title: string;
    }
  | {
      type: "topic";
      id: LmsPostId;
      slug?: string;
      title: string;
      lessonId?: LmsPostId;
      lessonSlug?: string;
    }
  | {
      type: "quiz";
      id: LmsPostId;
      slug?: string;
      title: string;
      isFinal?: boolean;
    }
  | {
      type: "certificate";
      id: LmsPostId;
      slug?: string;
      title: string;
      scope: "course" | "lesson" | "topic";
      lessonId?: LmsPostId;
      lessonSlug?: string;
      topicId?: LmsPostId;
      topicSlug?: string;
    };

export interface LessonSegment {
  lessonId: LmsPostId;
  lessonSlug?: string;
  title: string;
  completed: boolean;
  topics: Array<{
    id: LmsPostId;
    title: string;
    completed: boolean;
    slug?: string;
  }>;
}

export interface LmsCourseContextValue {
  postTypeSlug?: string;
  courseId?: LmsPostId;
  courseSlug?: string;
  lessonId?: LmsPostId;
  lessonSlug?: string;
  topicId?: LmsPostId;
  topicSlug?: string;
  quizId?: LmsPostId;
  quizSlug?: string;
  organizationId?: Id<"organizations">;
  courseStructure?: LmsCourseBuilderData | null;
  courseProgress?: CourseProgressRecord;
  isCourseStructureLoading: boolean;
  isCourseProgressLoading: boolean;
  courseSettings: CourseSettings;
  requiresLinearProgression: boolean;
  isLinearBlocked: boolean;
  blockingLessonTitle?: string | null;
  segments: LessonSegment[];
  navEntries: CourseNavEntry[];
  currentEntry: CourseNavEntry | null;
  previousEntry: CourseNavEntry | null;
  nextEntry: CourseNavEntry | null;
  completedLessonIds: Set<LmsPostId>;
  completedTopicIds: Set<LmsPostId>;
  activeLessonId?: LmsPostId;
}

const LmsCourseContext = createContext<LmsCourseContextValue | null>(null);

export function useLmsCourseContext() {
  return useContext(LmsCourseContext);
}

interface LmsCourseProviderProps {
  children: ReactNode;
  post?: Record<string, unknown>;
  postTypeSlug?: string | null;
  postMeta?: Record<string, unknown>;
  organizationId?: Id<"organizations">;
}

type CourseStructureArgs =
  | {
      courseId: LmsPostId;
      organizationId?: Id<"organizations">;
    }
  | {
      courseSlug: string;
      organizationId?: Id<"organizations">;
    }
  | "skip";

type CourseProgressArgs =
  | {
      courseId: LmsPostId;
      organizationId?: Id<"organizations">;
    }
  | "skip";

const LMS_POST_SLUGS = new Set([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
]);

const LMS_COURSE_ENROLLMENT_TAG_IDS_META_KEY = "lms.enrollmentTagIdsJson";

const safeParseStringArray = (value: unknown): string[] => {
  if (typeof value !== "string" || value.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string" && v.trim())
      : [];
  } catch {
    return [];
  }
};

export function LmsCourseProvider({
  children,
  post,
  postTypeSlug,
  postMeta,
  organizationId,
}: LmsCourseProviderProps) {
  const postRecord = (post ?? {}) as Record<string, unknown>;
  const metaRecord = (postMeta ?? {}) as Record<string, unknown>;
  const resolvedPostTypeSlug =
    postTypeSlug ??
    (typeof postRecord.postTypeSlug === "string"
      ? (postRecord.postTypeSlug as string)
      : undefined);

  if (!resolvedPostTypeSlug || !LMS_POST_SLUGS.has(resolvedPostTypeSlug)) {
    return <>{children}</>;
  }

  const normalizedOrganizationId = organizationId
    ? (organizationId as Id<"organizations">)
    : undefined;

  const courseId = deriveCourseId(resolvedPostTypeSlug, postRecord, metaRecord);
  console.log("[LmsCourseProvider] Course ID:", courseId);
  const courseSlug = deriveCourseSlug(
    resolvedPostTypeSlug,
    postRecord,
    metaRecord,
  );
  const lessonId = deriveLessonId(resolvedPostTypeSlug, postRecord, metaRecord);
  const topicId =
    resolvedPostTypeSlug === "topics"
      ? coercePostId(postRecord._id)
      : coercePostId(metaRecord.topicId ?? metaRecord.topic_id);
  const rawPostSlug =
    typeof postRecord.slug === "string"
      ? (postRecord.slug as string)
      : undefined;
  const lessonSlug =
    resolvedPostTypeSlug === "lessons"
      ? (rawPostSlug ?? coerceString(metaRecord.lessonSlug))
      : coerceString(metaRecord.lessonSlug);
  const topicSlug =
    resolvedPostTypeSlug === "topics"
      ? (rawPostSlug ?? coerceString(metaRecord.topicSlug))
      : coerceString(metaRecord.topicSlug);
  const quizId =
    resolvedPostTypeSlug === "quizzes"
      ? coercePostId(postRecord._id)
      : coercePostId(metaRecord.quizId ?? metaRecord.quiz_id);
  const quizSlug =
    resolvedPostTypeSlug === "quizzes"
      ? (rawPostSlug ?? coerceString(metaRecord.quizSlug))
      : coerceString(metaRecord.quizSlug);

  const certificateId =
    resolvedPostTypeSlug === "certificates"
      ? coercePostId(postRecord._id)
      : coercePostId(metaRecord.certificateId ?? metaRecord.certificate_id);
  const certificateSlug =
    resolvedPostTypeSlug === "certificates"
      ? rawPostSlug
      : coerceString(metaRecord.certificateSlug ?? metaRecord.certificate_slug);

  const courseStructureArgs = useMemo<CourseStructureArgs>(() => {
    if (courseId) {
      return normalizedOrganizationId
        ? { courseId, organizationId: normalizedOrganizationId }
        : { courseId };
    }
    if (courseSlug) {
      return normalizedOrganizationId
        ? { courseSlug, organizationId: normalizedOrganizationId }
        : { courseSlug };
    }
    return "skip";
  }, [courseId, courseSlug, normalizedOrganizationId]);

  const rawCourseStructure = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    courseStructureArgs === "skip" ? "skip" : courseStructureArgs,
  );
  const isCourseStructureLoading =
    courseStructureArgs !== "skip" && rawCourseStructure === undefined;
  const courseStructure = (rawCourseStructure ??
    null) as LmsCourseBuilderData | null;

  const resolvedCourseId = useMemo<LmsPostId | undefined>(() => {
    if (courseId) {
      return courseId;
    }
    const structureCourseId = courseStructure?.course?._id;
    return structureCourseId ?? undefined;
  }, [courseId, courseStructure]);

  const resolvedCourseSlug = useMemo<string | undefined>(() => {
    if (courseSlug) {
      return courseSlug;
    }
    const structureSlug = courseStructure?.course?.slug;
    return structureSlug ?? undefined;
  }, [courseSlug, courseStructure]);

  const courseProgressArgs = useMemo<CourseProgressArgs>(() => {
    if (!resolvedCourseId) {
      return "skip";
    }
    return normalizedOrganizationId
      ? { courseId: resolvedCourseId, organizationId: normalizedOrganizationId }
      : { courseId: resolvedCourseId };
  }, [normalizedOrganizationId, resolvedCourseId]);

  const rawCourseProgress = useQuery(
    api.plugins.lms.queries.getCourseProgressForViewer,
    courseProgressArgs === "skip" ? "skip" : courseProgressArgs,
  );
  const isCourseProgressLoading =
    courseProgressArgs !== "skip" && rawCourseProgress === undefined;
  const courseProgress = (rawCourseProgress ?? null) as CourseProgressRecord;
  const viewerUserId = courseProgress?.userId ? String(courseProgress.userId) : null;

  const courseMeta = useQuery(
    api.plugins.lms.posts.queries.getPostMeta,
    resolvedCourseId && normalizedOrganizationId
      ? { postId: String(resolvedCourseId), organizationId: String(normalizedOrganizationId) }
      : "skip",
  ) as unknown as Array<{ key: string; value?: unknown }> | undefined;

  // ---- Enrollment sync (CRM tag → LMS enrollment) ----
  // Runs client-side on LMS pages so we can safely call mutations.
  const crmEnabled = useQuery((api as any).core.options.get, {
    metaKey: "plugin_crm_enabled",
    type: "site",
    orgId: normalizedOrganizationId ? String(normalizedOrganizationId) : null,
  }) as { metaValue?: unknown } | null | undefined;
  const isCrmEnabled = Boolean(crmEnabled?.metaValue);

  const enrollmentTagIds = useMemo(() => {
    const raw = Array.isArray(courseMeta)
      ? courseMeta.find((m) => m?.key === LMS_COURSE_ENROLLMENT_TAG_IDS_META_KEY)
          ?.value
      : undefined;
    return safeParseStringArray(raw);
  }, [courseMeta]);

  const userMarketingTags = useQuery(
    (api as any).plugins.crm.marketingTags.queries.getUserMarketingTags,
    isCrmEnabled && viewerUserId && normalizedOrganizationId
      ? { userId: viewerUserId, organizationId: String(normalizedOrganizationId) }
      : "skip",
  ) as any[] | undefined;

  const tagKeySet = useMemo(() => {
    const keys: string[] = Array.isArray(userMarketingTags)
      ? userMarketingTags.flatMap((assignment: any) => {
          const tag = assignment?.marketingTag;
          const out: string[] = [];
          const slug = tag?.slug as unknown;
          const id = tag?._id as unknown;
          if (typeof slug === "string") out.push(slug);
          if (typeof id === "string") out.push(id);
          return out;
        })
      : [];
    return new Set(keys);
  }, [userMarketingTags]);

  const shouldBeEnrolledByTag =
    viewerUserId && enrollmentTagIds.length > 0
      ? enrollmentTagIds.some((id) => tagKeySet.has(id))
      : null;

  const enrollment = useQuery(
    (api as any).plugins.lms.enrollments.queries.getEnrollment,
    viewerUserId && resolvedCourseId
      ? { courseId: String(resolvedCourseId), userId: String(viewerUserId) }
      : "skip",
  ) as { status?: unknown } | null | undefined;

  const upsertEnrollment = useMutation(
    (api as any).plugins.lms.enrollments.mutations.upsertEnrollment,
  ) as (args: any) => Promise<null>;

  useEffect(() => {
    if (!viewerUserId) return;
    if (!resolvedCourseId) return;
    if (!isCrmEnabled) return;
    if (enrollmentTagIds.length === 0) return;
    if (shouldBeEnrolledByTag === null) return;
    if (enrollment === undefined) return; // loading

    const currentStatus =
      enrollment && typeof enrollment.status === "string"
        ? enrollment.status
        : null;
    const desiredStatus = shouldBeEnrolledByTag ? "active" : "revoked";

    if (currentStatus === desiredStatus) return;

    void upsertEnrollment({
      organizationId: normalizedOrganizationId ? String(normalizedOrganizationId) : undefined,
      courseId: String(resolvedCourseId),
      userId: String(viewerUserId),
      status: desiredStatus,
      source: "crm_tag",
    });
  }, [
    enrollment,
    enrollmentTagIds.length,
    isCrmEnabled,
    normalizedOrganizationId,
    resolvedCourseId,
    shouldBeEnrolledByTag,
    upsertEnrollment,
    viewerUserId,
  ]);

  const courseSettings = useMemo<CourseSettings>(() => {
    const raw = Array.isArray(courseMeta)
      ? courseMeta.find((m) => m?.key === LMS_COURSE_SETTINGS_META_KEY)?.value
      : undefined;
    if (typeof raw === "string" && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw) as Partial<CourseSettings>;
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_COURSE_SETTINGS, ...parsed };
        }
      } catch {
        // ignore invalid JSON
      }
    }
    return DEFAULT_COURSE_SETTINGS;
  }, [courseMeta]);

  const completedLessonIds = useMemo(
    () => new Set(courseProgress?.completedLessonIds ?? []),
    [courseProgress?.completedLessonIds],
  );
  const completedTopicIds = useMemo(
    () => new Set(courseProgress?.completedTopicIds ?? []),
    [courseProgress?.completedTopicIds],
  );

  const segments = useMemo<LessonSegment[]>(() => {
    if (!courseStructure?.attachedLessons) {
      return [];
    }
    const topicMap = new Map<LmsPostId, LmsBuilderTopic[]>();
    (courseStructure.attachedTopics ?? []).forEach((topic) => {
      if (!topic.lessonId) {
        return;
      }
      const list = topicMap.get(topic.lessonId) ?? [];
      list.push(topic);
      topicMap.set(topic.lessonId, list);
    });
    return courseStructure.attachedLessons
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((lesson) => ({
        lessonId: lesson._id,
        lessonSlug: lesson.slug,
        title: lesson.title ?? "Untitled Lesson",
        completed: completedLessonIds.has(lesson._id),
        topics: (topicMap.get(lesson._id) ?? []).map((topic) => ({
          id: topic._id,
          title: topic.title ?? "Untitled Topic",
          completed: completedTopicIds.has(topic._id),
          slug: topic.slug,
        })),
      }));
  }, [completedLessonIds, completedTopicIds, courseStructure]);

  const navEntries = useMemo<CourseNavEntry[]>(() => {
    if (!courseStructure?.attachedLessons) {
      return [];
    }
    const entries: CourseNavEntry[] = [];
    const topicMap = new Map<LmsPostId, LmsBuilderTopic[]>();
    (courseStructure.attachedTopics ?? []).forEach((topic) => {
      if (!topic.lessonId) return;
      const list = topicMap.get(topic.lessonId) ?? [];
      list.push(topic);
      topicMap.set(topic.lessonId, list);
    });
    const attachedQuizzes = (courseStructure.attachedQuizzes ??
      []) as LmsBuilderQuiz[];
    const quizzesByKey = new Map<string, LmsBuilderQuiz[]>();
    attachedQuizzes.forEach((quiz) => {
      const key =
        quiz.lessonId && quiz.topicId
          ? `lesson:${quiz.lessonId}:topic:${quiz.topicId}`
          : quiz.lessonId
            ? `lesson:${quiz.lessonId}`
            : "course";
      const list = quizzesByKey.get(key) ?? [];
      list.push(quiz);
      quizzesByKey.set(key, list);
    });

    const certificatesById = new Map<string, { _id: LmsPostId; slug?: string; title?: string }>();
    (courseStructure.attachedCertificates ?? []).forEach((cert) => {
      certificatesById.set(String(cert._id), {
        _id: cert._id,
        slug: cert.slug ?? undefined,
        title: cert.title ?? undefined,
      });
    });

    courseStructure.attachedLessons
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((lesson) => {
        entries.push({
          type: "lesson",
          id: lesson._id,
          slug: lesson.slug,
          title: lesson.title ?? "Untitled Lesson",
        });
        const lessonTopics = topicMap.get(lesson._id) ?? [];
        lessonTopics
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((topic) => {
            entries.push({
              type: "topic",
              id: topic._id,
              slug: topic.slug,
              title: topic.title ?? "Untitled Topic",
              lessonId: lesson._id,
              lessonSlug: lesson.slug,
            });
            const topicQuizzes =
              quizzesByKey.get(`lesson:${lesson._id}:topic:${topic._id}`) ?? [];
            topicQuizzes
              .sort(
                (a, b) =>
                  (a.order ?? Number.MAX_SAFE_INTEGER) -
                  (b.order ?? Number.MAX_SAFE_INTEGER),
              )
              .forEach((quiz) => {
                entries.push({
                  type: "quiz",
                  id: quiz._id,
                  slug: quiz.slug,
                  title: quiz.title ?? "Untitled Quiz",
                  isFinal: quiz.isFinal ?? false,
                });
              });

            if (topic.certificateId) {
              const cert = certificatesById.get(String(topic.certificateId));
              if (cert) {
                entries.push({
                  type: "certificate",
                  id: cert._id,
                  slug: cert.slug,
                  title: cert.title ?? "Certificate",
                  scope: "topic",
                  lessonId: lesson._id,
                  lessonSlug: lesson.slug,
                  topicId: topic._id,
                  topicSlug: topic.slug,
                });
              }
            }
          });
        const lessonQuizzes = quizzesByKey.get(`lesson:${lesson._id}`) ?? [];
        lessonQuizzes
          .sort(
            (a, b) =>
              (a.order ?? Number.MAX_SAFE_INTEGER) -
              (b.order ?? Number.MAX_SAFE_INTEGER),
          )
          .forEach((quiz) => {
            entries.push({
              type: "quiz",
              id: quiz._id,
              slug: quiz.slug,
              title: quiz.title ?? "Untitled Quiz",
              isFinal: quiz.isFinal ?? false,
            });
          });

        if (lesson.certificateId) {
          const cert = certificatesById.get(String(lesson.certificateId));
          if (cert) {
            entries.push({
              type: "certificate",
              id: cert._id,
              slug: cert.slug,
              title: cert.title ?? "Certificate",
              scope: "lesson",
              lessonId: lesson._id,
              lessonSlug: lesson.slug,
            });
          }
        }
      });
    (quizzesByKey.get("course") ?? [])
      .sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER),
      )
      .forEach((quiz) => {
        entries.push({
          type: "quiz",
          id: quiz._id,
          slug: quiz.slug,
          title: quiz.title ?? "Untitled Quiz",
          isFinal: quiz.isFinal ?? false,
        });
      });

    if (courseStructure.course?.certificateId) {
      const cert = certificatesById.get(String(courseStructure.course.certificateId));
      if (cert) {
        entries.push({
          type: "certificate",
          id: cert._id,
          slug: cert.slug,
          title: cert.title ?? "Certificate",
          scope: "course",
        });
      }
    }
    return entries;
  }, [courseStructure]);

  const currentEntry = useMemo<CourseNavEntry | null>(() => {
    if (!navEntries.length) {
      return null;
    }
    if (resolvedPostTypeSlug === "topics" && topicId) {
      return (
        navEntries.find(
          (entry) =>
            entry.type === "topic" &&
            (entry.id === topicId ||
              (topicSlug && entry.slug && entry.slug === topicSlug)),
        ) ?? null
      );
    }
    if (resolvedPostTypeSlug === "quizzes" && quizId) {
      return (
        navEntries.find(
          (entry) =>
            entry.type === "quiz" &&
            (entry.id === quizId ||
              (quizSlug && entry.slug && entry.slug === quizSlug)),
        ) ?? null
      );
    }
    if (resolvedPostTypeSlug === "certificates" && certificateId) {
      return (
        navEntries.find(
          (entry) =>
            entry.type === "certificate" &&
            (entry.id === certificateId ||
              (certificateSlug &&
                entry.slug &&
                entry.slug === certificateSlug)),
        ) ?? null
      );
    }
    if (lessonId) {
      return (
        navEntries.find(
          (entry) =>
            entry.type === "lesson" &&
            (entry.id === lessonId ||
              (lessonSlug && entry.slug && entry.slug === lessonSlug)),
        ) ?? null
      );
    }
    return null;
  }, [
    certificateId,
    certificateSlug,
    lessonId,
    lessonSlug,
    navEntries,
    resolvedPostTypeSlug,
    topicId,
    topicSlug,
  ]);

  const currentEntryIndex = useMemo(() => {
    if (!currentEntry) {
      return -1;
    }
    return navEntries.findIndex((entry) => entry === currentEntry);
  }, [currentEntry, navEntries]);

  const previousEntry: CourseNavEntry | null =
    currentEntryIndex > 0 ? (navEntries[currentEntryIndex - 1] ?? null) : null;
  const nextEntry: CourseNavEntry | null =
    currentEntryIndex >= 0 && currentEntryIndex < navEntries.length - 1
      ? (navEntries[currentEntryIndex + 1] ?? null)
      : null;

  const requiresLinearProgression = courseSettings.progressionMode === "linear";

  const firstIncompleteLesson = useMemo(() => {
    if (!requiresLinearProgression) {
      return null;
    }
    return segments.find((segment) => !segment.completed) ?? null;
  }, [requiresLinearProgression, segments]);

  const activeLessonId =
    resolvedPostTypeSlug === "topics"
      ? (lessonId ??
        (currentEntry?.type === "topic" ? currentEntry.lessonId : undefined))
      : resolvedPostTypeSlug === "lessons"
        ? (lessonId ??
          (currentEntry?.type === "lesson" ? currentEntry.id : undefined))
      : resolvedPostTypeSlug === "certificates"
        ? (lessonId ??
          (currentEntry?.type === "certificate" ? currentEntry.lessonId : undefined))
        : undefined;

  const isLinearBlocked =
    requiresLinearProgression &&
    firstIncompleteLesson !== null &&
    activeLessonId !== undefined &&
    firstIncompleteLesson.lessonId !== activeLessonId;

  const value: LmsCourseContextValue = {
    postTypeSlug: resolvedPostTypeSlug,
    courseId: resolvedCourseId,
    courseSlug: resolvedCourseSlug,
    lessonId,
    lessonSlug,
    topicId,
    topicSlug,
    organizationId: normalizedOrganizationId,
    courseStructure: courseStructure ?? null,
    courseProgress,
    isCourseStructureLoading,
    isCourseProgressLoading,
    courseSettings,
    requiresLinearProgression,
    isLinearBlocked,
    blockingLessonTitle: firstIncompleteLesson?.title ?? null,
    segments,
    navEntries,
    currentEntry,
    previousEntry,
    nextEntry,
    completedLessonIds,
    completedTopicIds,
    activeLessonId,
    quizId,
    quizSlug,
  };

  return (
    <LmsCourseContext.Provider value={value}>
      {children}
    </LmsCourseContext.Provider>
  );
}
