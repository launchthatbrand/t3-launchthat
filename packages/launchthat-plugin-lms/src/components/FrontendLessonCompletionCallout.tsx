"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type { Id } from "../lib/convexId";
import type {
  LmsBuilderLesson,
  LmsBuilderTopic,
  LmsCourseBuilderData,
} from "../types";
import {
  coercePostId,
  deriveCourseId,
  deriveCourseSlug,
  deriveLessonId,
} from "../lib/progressUtils";

const LABEL_MAP: Record<
  string,
  { noun: string; description: string; cta: string }
> = {
  courses: {
    noun: "course",
    description: "Track your overall course progress right from the lesson.",
    cta: "Complete course",
  },
  lessons: {
    noun: "lesson",
    description: "When you’re done learning, tap to mark the lesson complete.",
    cta: "Complete lesson",
  },
  topics: {
    noun: "topic",
    description: "Log topic-level progress without leaving the page.",
    cta: "Complete topic",
  },
  quizzes: {
    noun: "quiz",
    description: "Record manual quiz completions for your own tracking.",
    cta: "Complete quiz",
  },
};

type CourseProgressArgs =
  | {
      courseId: Id<"posts">;
      organizationId?: Id<"organizations">;
    }
  | "skip";

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

type CourseNavEntry =
  | {
      type: "lesson";
      id: Id<"posts">;
      slug: string;
      title: string;
    }
  | {
      type: "topic";
      id: Id<"posts">;
      slug: string;
      title: string;
      lessonSlug: string;
    };

export function FrontendLessonCompletionCallout({
  postTypeSlug,
  post,
  postMeta,
  pluginName,
  organizationId,
}: PluginFrontendSingleSlotProps) {
  const config = LABEL_MAP[postTypeSlug];
  const [isCompleting, setIsCompleting] = useState(false);
  const markLessonCompletion = useMutation(
    api.plugins.lms.mutations.setLessonCompletionStatus,
  );
  const markTopicCompletion = useMutation(
    api.plugins.lms.mutations.setTopicCompletionStatus,
  );

  if (!config || !post) {
    return null;
  }

  const postRecord = post as Record<string, unknown>;
  const metaRecord = (postMeta ?? {}) as Record<string, unknown>;

  const courseId = deriveCourseId(postTypeSlug, postRecord, metaRecord);
  const courseSlugValue = deriveCourseSlug(
    postTypeSlug,
    postRecord,
    metaRecord,
  );
  const rawPostSlug =
    typeof (post as { slug?: unknown }).slug === "string"
      ? ((post as { slug: string }).slug ?? "")
      : undefined;
  const lessonSlug =
    postTypeSlug === "lessons"
      ? (rawPostSlug ??
        (typeof metaRecord.lessonSlug === "string"
          ? metaRecord.lessonSlug
          : undefined))
      : typeof metaRecord.lessonSlug === "string"
        ? metaRecord.lessonSlug
        : undefined;
  const topicSlug =
    postTypeSlug === "topics"
      ? (rawPostSlug ??
        (typeof metaRecord.topicSlug === "string"
          ? metaRecord.topicSlug
          : undefined))
      : typeof metaRecord.topicSlug === "string"
        ? metaRecord.topicSlug
        : undefined;
  const lessonId =
    deriveLessonId(postTypeSlug, postRecord, metaRecord) ??
    (postTypeSlug === "lessons" ? coercePostId(postRecord._id) : undefined);
  const rawTopicId =
    coercePostId(metaRecord.topicId ?? metaRecord.topic_id) ??
    (postTypeSlug === "topics" ? coercePostId(postRecord._id) : undefined);
  const normalizedOrganizationId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;

  const progressArgs = useMemo<CourseProgressArgs>(() => {
    if (!courseId) {
      return "skip";
    }
    if (normalizedOrganizationId) {
      return { courseId, organizationId: normalizedOrganizationId };
    }
    return { courseId };
  }, [courseId, normalizedOrganizationId]);

  const courseStructureArgs = useMemo<CourseStructureArgs>(() => {
    if (courseId) {
      return normalizedOrganizationId
        ? { courseId, organizationId: normalizedOrganizationId }
        : { courseId };
    }
    if (courseSlugValue) {
      return normalizedOrganizationId
        ? {
            courseSlug: courseSlugValue,
            organizationId: normalizedOrganizationId,
          }
        : { courseSlug: courseSlugValue };
    }
    return "skip";
  }, [courseId, courseSlugValue, normalizedOrganizationId]);

  const courseProgress = useQuery(
    api.plugins.lms.queries.getCourseProgressForViewer,
    progressArgs === "skip" ? "skip" : progressArgs,
  );

  const courseStructure = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    courseStructureArgs === "skip" ? "skip" : courseStructureArgs,
  );

  const title =
    typeof (post as { title?: unknown }).title === "string"
      ? ((post as { title: string }).title ?? config.noun)
      : config.noun;

  const navEntries = useMemo<CourseNavEntry[]>(() => {
    if (!courseStructure) {
      return [];
    }
    const lessonsById = new Map<Id<"posts">, LmsBuilderLesson>();
    courseStructure.attachedLessons.forEach((lesson) => {
      lessonsById.set(lesson._id as Id<"posts">, lesson as LmsBuilderLesson);
    });
    const topicsByLesson = new Map<Id<"posts">, LmsBuilderTopic[]>();
    courseStructure.attachedTopics.forEach((topic) => {
      if (!topic.lessonId) return;
      const lessonTopics = topicsByLesson.get(topic.lessonId) ?? [];
      lessonTopics.push(topic as LmsBuilderTopic);
      topicsByLesson.set(topic.lessonId as Id<"posts">, lessonTopics);
    });
    const entries: CourseNavEntry[] = [];
    for (const item of courseStructure.course.courseStructure) {
      const lesson = lessonsById.get(item.lessonId as Id<"posts">);
      if (!lesson) continue;
      const normalizedLessonSlug =
        typeof lesson.slug === "string" && lesson.slug.length > 0
          ? lesson.slug
          : (lesson._id as string);
      entries.push({
        type: "lesson",
        id: lesson._id as Id<"posts">,
        slug: normalizedLessonSlug,
        title: lesson.title ?? "Lesson",
      });
      const lessonTopics = [
        ...(topicsByLesson.get(item.lessonId as Id<"posts">) ?? []),
      ].sort(sortByOrderThenTitle);
      lessonTopics.forEach((topic) => {
        const topicSlug =
          typeof topic.slug === "string" && topic.slug.length > 0
            ? topic.slug
            : (topic._id as string);
        entries.push({
          type: "topic",
          id: topic._id as Id<"posts">,
          slug: topicSlug,
          lessonSlug: normalizedLessonSlug,
          title: topic.title ?? "Topic",
        });
      });
    }
    return entries;
  }, [courseStructure]);
  const derivedTopicId = useMemo<Id<"posts"> | undefined>(() => {
    if (rawTopicId || postTypeSlug !== "topics") {
      return rawTopicId;
    }
    if (!topicSlug) {
      return undefined;
    }
    const match = navEntries.find(
      (entry) =>
        entry.type === "topic" &&
        entry.slug.toLowerCase() === topicSlug.toLowerCase(),
    );
    return match?.id;
  }, [navEntries, postTypeSlug, rawTopicId, topicSlug]);

  const derivedLessonId = useMemo<Id<"posts"> | undefined>(() => {
    if (lessonId || postTypeSlug !== "lessons") {
      return lessonId;
    }
    if (!lessonSlug) {
      return undefined;
    }
    const match = navEntries.find(
      (entry) =>
        entry.type === "lesson" &&
        entry.slug.toLowerCase() === lessonSlug.toLowerCase(),
    );
    return match?.id;
  }, [lessonId, lessonSlug, navEntries, postTypeSlug]);

  const completedLessonSet = new Set(courseProgress?.completedLessonIds ?? []);
  const completedTopicSet = new Set(courseProgress?.completedTopicIds ?? []);
  const isLessonCompleted =
    postTypeSlug === "lessons" && derivedLessonId
      ? completedLessonSet.has(derivedLessonId)
      : false;
  const isTopicCompleted =
    postTypeSlug === "topics" && derivedTopicId
      ? completedTopicSet.has(derivedTopicId)
      : false;
  const isCompleted = isLessonCompleted || isTopicCompleted;

  const handleComplete = async () => {
    if (!courseId) {
      toast.error("Missing course reference", {
        description:
          "Please attach this lesson or topic to a course to log progress.",
      });
      return;
    }
    setIsCompleting(true);
    try {
      if (postTypeSlug === "lessons" && derivedLessonId) {
        await markLessonCompletion({
          courseId,
          lessonId: derivedLessonId,
          completed: !isLessonCompleted,
        });
      } else if (postTypeSlug === "topics" && derivedTopicId) {
        await markTopicCompletion({
          topicId: derivedTopicId,
          lessonId: derivedLessonId ?? undefined,
          courseId,
          completed: !isTopicCompleted,
        });
      } else {
        toast.info("Coming soon", {
          description:
            "Course and quiz completion tracking will be added shortly.",
        });
        return;
      }
      toast.success(
        isCompleted
          ? `${config.noun.replace(/^\w/, (c) => c.toUpperCase())} marked incomplete`
          : `${config.noun.replace(/^\w/, (c) => c.toUpperCase())} completed`,
        {
          description: `"${title}" updated via ${pluginName}.`,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update progress.";
      toast.error("Progress update failed", { description: message });
    } finally {
      setIsCompleting(false);
    }
  };

  const buttonDisabled =
    isCompleting ||
    progressArgs === "skip" ||
    (postTypeSlug === "lessons" && !derivedLessonId) ||
    (postTypeSlug === "topics" && !derivedTopicId);

  const currentEntryIndex = useMemo(() => {
    if (!navEntries.length) {
      return -1;
    }
    if (postTypeSlug === "topics") {
      if (derivedTopicId) {
        const idx = navEntries.findIndex(
          (entry) => entry.type === "topic" && entry.id === derivedTopicId,
        );
        if (idx >= 0) {
          return idx;
        }
      }
      if (topicSlug) {
        const slugIdx = navEntries.findIndex(
          (entry) =>
            entry.type === "topic" &&
            entry.slug.toLowerCase() === topicSlug.toLowerCase(),
        );
        if (slugIdx >= 0) {
          return slugIdx;
        }
      }
      return -1;
    }
    if (derivedLessonId) {
      const idx = navEntries.findIndex(
        (entry) => entry.type === "lesson" && entry.id === derivedLessonId,
      );
      if (idx >= 0) {
        return idx;
      }
    }
    if (lessonSlug) {
      const slugIdx = navEntries.findIndex(
        (entry) =>
          entry.type === "lesson" &&
          entry.slug.toLowerCase() === lessonSlug.toLowerCase(),
      );
      if (slugIdx >= 0) {
        return slugIdx;
      }
    }
    return -1;
  }, [
    derivedLessonId,
    derivedTopicId,
    lessonSlug,
    navEntries,
    postTypeSlug,
    topicSlug,
  ]);

  const prevEntry =
    currentEntryIndex > 0 ? navEntries[currentEntryIndex - 1] : undefined;
  const nextEntry =
    currentEntryIndex >= 0 && currentEntryIndex < navEntries.length - 1
      ? navEntries[currentEntryIndex + 1]
      : undefined;

  const coursePathSegment =
    courseSlugValue ??
    courseStructure?.course.slug ??
    (courseId ? (courseId as string) : undefined);

  const buildEntryHref = (entry: CourseNavEntry): string | undefined => {
    if (!coursePathSegment) {
      return undefined;
    }
    if (entry.type === "lesson") {
      return `/course/${coursePathSegment}/lesson/${entry.slug}`;
    }
    if (!entry.lessonSlug) {
      return undefined;
    }
    return `/course/${coursePathSegment}/lesson/${entry.lessonSlug}/topic/${entry.slug}`;
  };

  const prevHref = prevEntry ? buildEntryHref(prevEntry) : undefined;
  const nextHref = nextEntry ? buildEntryHref(nextEntry) : undefined;

  return (
    <div className="bg-card/70 rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="tracking-wide uppercase">
              LMS
            </Badge>
            <span className="text-muted-foreground text-sm font-medium">
              Learner progress
            </span>
          </div>
          <p className="text-foreground text-sm">{config.description}</p>
        </div>
        <Button
          type="button"
          onClick={handleComplete}
          disabled={buttonDisabled}
          className="whitespace-nowrap"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isCompleting
            ? "Updating…"
            : isCompleted
              ? "Mark incomplete"
              : config.cta}
        </Button>
      </div>
      {(prevHref || nextHref) && (
        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {prevHref ? (
            <Link
              href={prevHref}
              className="group border-border/60 text-muted-foreground hover:border-border hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-left">
                <span className="text-muted-foreground block text-xs tracking-wide uppercase">
                  Previous {prevEntry?.type}
                </span>
                <span className="text-foreground line-clamp-2 font-medium">
                  {prevEntry?.title}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              className="group border-border/60 text-muted-foreground hover:border-border hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition"
            >
              <span className="text-right">
                <span className="text-muted-foreground block text-xs tracking-wide uppercase">
                  Next {nextEntry?.type}
                </span>
                <span className="text-foreground line-clamp-2 font-medium">
                  {nextEntry?.title}
                </span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function sortByOrderThenTitle<
  T extends { order?: number | null; title?: string | null },
>(a: T, b: T) {
  const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder === bOrder) {
    return (a.title ?? "").localeCompare(b.title ?? "");
  }
  return aOrder - bOrder;
}
