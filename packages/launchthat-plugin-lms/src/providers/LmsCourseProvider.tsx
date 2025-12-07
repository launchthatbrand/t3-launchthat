"use client";

import "../filters/registerFrontendFilters";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import type { CourseSettings } from "../constants/courseSettings";
import type { Id } from "../lib/convexId";
import type {
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
} from "../types";
import {
  buildCourseSettingsOptionKey,
  DEFAULT_COURSE_SETTINGS,
} from "../constants/courseSettings";
import {
  coercePostId,
  coerceString,
  deriveCourseId,
  deriveCourseSlug,
  deriveLessonId,
} from "../lib/progressUtils";

type CourseProgressRecord = {
  completedLessonIds: Id<"posts">[];
  completedTopicIds: Id<"posts">[];
  courseId: Id<"posts">;
  lastAccessedId?: Id<"posts">;
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
      id: Id<"posts">;
      slug?: string;
      title: string;
    }
  | {
      type: "topic";
      id: Id<"posts">;
      slug?: string;
      title: string;
      lessonId?: Id<"posts">;
      lessonSlug?: string;
    }
  | {
      type: "quiz";
      id: Id<"posts">;
      slug?: string;
      title: string;
      isFinal?: boolean;
    };

export interface LessonSegment {
  lessonId: Id<"posts">;
  lessonSlug?: string;
  title: string;
  completed: boolean;
  topics: Array<{
    id: Id<"posts">;
    title: string;
    completed: boolean;
    slug?: string;
  }>;
}

export interface LmsCourseContextValue {
  postTypeSlug?: string;
  courseId?: Id<"posts">;
  courseSlug?: string;
  lessonId?: Id<"posts">;
  lessonSlug?: string;
  topicId?: Id<"posts">;
  topicSlug?: string;
  quizId?: Id<"posts">;
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
  completedLessonIds: Set<Id<"posts">>;
  completedTopicIds: Set<Id<"posts">>;
  activeLessonId?: Id<"posts">;
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
      courseId: Id<"posts">;
      organizationId?: Id<"organizations">;
    }
  | {
      courseSlug: string;
      organizationId?: Id<"organizations">;
    }
  | "skip";

type CourseProgressArgs =
  | {
      courseId: Id<"posts">;
      organizationId?: Id<"organizations">;
    }
  | "skip";

const LMS_POST_SLUGS = new Set(["courses", "lessons", "topics", "quizzes"]);

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

  const resolvedCourseId = useMemo<Id<"posts"> | undefined>(() => {
    if (courseId) {
      return courseId;
    }
    const structureCourseId = courseStructure?.course?._id;
    return structureCourseId ? (structureCourseId as Id<"posts">) : undefined;
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

  const courseSettingsOptionKey =
    resolvedCourseId !== undefined
      ? buildCourseSettingsOptionKey(String(resolvedCourseId))
      : null;

  const courseSettingsOption = useQuery(
    api.core.options.get,
    courseSettingsOptionKey && normalizedOrganizationId
      ? {
          metaKey: courseSettingsOptionKey,
          type: "site" as const,
          orgId: normalizedOrganizationId,
        }
      : "skip",
  );

  const courseSettings = useMemo<CourseSettings>(() => {
    if (
      courseSettingsOption &&
      courseSettingsOption.metaValue &&
      typeof courseSettingsOption.metaValue === "object"
    ) {
      return {
        ...DEFAULT_COURSE_SETTINGS,
        ...(courseSettingsOption.metaValue as Partial<CourseSettings>),
      };
    }
    return DEFAULT_COURSE_SETTINGS;
  }, [courseSettingsOption]);

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
    const topicMap = new Map<Id<"posts">, LmsBuilderTopic[]>();
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
    const topicMap = new Map<Id<"posts">, LmsBuilderTopic[]>();
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
