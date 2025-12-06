"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";

import type { Id } from "../lib/convexId";
import type { LmsBuilderLesson } from "../types";
import {
  deriveCourseId,
  deriveCourseSlug,
  deriveLessonId,
} from "../lib/progressUtils";

const SUPPORTED_POST_TYPES = new Set(["courses", "lessons", "topics"]);

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

export function CourseProgress({
  post,
  postTypeSlug,
  postMeta,
  organizationId,
}: PluginFrontendSingleSlotProps) {
  const normalizedPostType =
    typeof postTypeSlug === "string" ? postTypeSlug : "";
  if (
    !post ||
    !normalizedPostType ||
    !SUPPORTED_POST_TYPES.has(normalizedPostType)
  ) {
    return null;
  }

  const postRecord = post as Record<string, unknown>;
  const metaRecord = (postMeta ?? {}) as Record<string, unknown>;

  const normalizedOrganizationId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;

  const courseId = deriveCourseId(normalizedPostType, postRecord, metaRecord);
  const courseSlug = deriveCourseSlug(
    normalizedPostType,
    postRecord,
    metaRecord,
  );

  if (!courseId && !courseSlug) {
    return null;
  }

  const courseArgs = useMemo(() => {
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
  }, [courseId, courseSlug, normalizedOrganizationId]) as CourseStructureArgs;

  const courseData = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    courseArgs === "skip" ? "skip" : courseArgs,
  );

  const shouldSkipCourse = courseArgs === "skip";
  const isCourseLoading = !shouldSkipCourse && courseData === undefined;
  const resolvedCourseId =
    (courseData?.course?._id as Id<"posts"> | undefined) ??
    (courseId as Id<"posts"> | undefined);

  const progressArgs = useMemo<CourseProgressArgs>(() => {
    if (!resolvedCourseId) {
      return "skip";
    }
    if (normalizedOrganizationId) {
      return {
        courseId: resolvedCourseId,
        organizationId: normalizedOrganizationId,
      };
    }
    return { courseId: resolvedCourseId };
  }, [normalizedOrganizationId, resolvedCourseId]);

  const courseProgress = useQuery(
    api.plugins.lms.queries.getCourseProgressForViewer,
    progressArgs === "skip" ? "skip" : progressArgs,
  );

  if (shouldSkipCourse || progressArgs === "skip") {
    return null;
  }

  if (isCourseLoading) {
    return (
      <div className="bg-card/80 rounded-2xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">
          Loading course progress…
        </p>
      </div>
    );
  }

  if (!courseData) {
    return null;
  }

  if (courseProgress === undefined) {
    return (
      <div className="bg-card/80 rounded-2xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">
          Loading course progress…
        </p>
      </div>
    );
  }

  if (courseProgress === null) {
    return (
      <div className="bg-card/80 rounded-2xl border p-4 shadow-sm">
        <Badge variant="outline" className="text-xs tracking-wide uppercase">
          Course progress
        </Badge>
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to track your personal progress for this course.
        </p>
      </div>
    );
  }

  const orderedLessonIds =
    courseData.course?.courseStructure?.map((entry) => entry.lessonId) ?? [];

  const lessonsById = new Map<Id<"posts">, LmsBuilderLesson>();
  courseData.attachedLessons.forEach((lesson) => {
    lessonsById.set(lesson._id, lesson as LmsBuilderLesson);
  });

  const topicsByLesson = new Map<Id<"posts">, Id<"posts">[]>();
  courseData.attachedTopics.forEach((topic) => {
    if (!topic.lessonId) {
      return;
    }
    const list = topicsByLesson.get(topic.lessonId) ?? [];
    list.push(topic._id as Id<"posts">);
    topicsByLesson.set(topic.lessonId, list);
  });

  const completedLessonSet = new Set(courseProgress.completedLessonIds ?? []);
  const completedTopicSet = new Set(courseProgress.completedTopicIds ?? []);

  const segments = orderedLessonIds
    .map((lessonId) => {
      const lesson = lessonsById.get(lessonId as Id<"posts">);
      if (!lesson) {
        return null;
      }
      const topics = topicsByLesson.get(lesson._id) ?? [];
      const completedTopics = topics.filter((topicId) =>
        completedTopicSet.has(topicId),
      ).length;
      return {
        lessonId: lesson._id,
        title: lesson.title,
        completed: completedLessonSet.has(lesson._id),
        topicsTotal: topics.length,
        topicsCompleted: completedTopics,
      };
    })
    .filter(
      (segment): segment is NonNullable<typeof segment> => segment !== null,
    );

  const totalLessons = segments.length;
  const completedLessons = completedLessonSet.size;
  const percentComplete =
    totalLessons > 0
      ? Math.round(
          (Math.min(completedLessons, totalLessons) / totalLessons) * 100,
        )
      : 0;

  const activeLessonId = deriveLessonId(
    normalizedPostType,
    postRecord,
    metaRecord,
  );
  const activeLessonTitle = activeLessonId
    ? (lessonsById.get(activeLessonId as Id<"posts">)?.title ?? null)
    : null;

  return (
    <div className="bg-card/80 rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="outline" className="text-xs tracking-wide uppercase">
            Course progress
          </Badge>
          <p className="text-foreground mt-1 text-sm font-medium">
            {totalLessons > 0
              ? `${completedLessons}/${totalLessons} lessons completed`
              : "No lessons yet"}
          </p>
        </div>
        <span className="text-muted-foreground text-sm font-semibold">
          {percentComplete}%
        </span>
      </div>
      {totalLessons > 0 ? (
        <div className="bg-muted/40 mt-3 flex gap-2 rounded-2xl border p-2">
          {segments.map((segment) => {
            const isActive = activeLessonId === segment.lessonId;
            const completionRatio =
              segment.topicsTotal > 0
                ? Math.min(segment.topicsCompleted / segment.topicsTotal, 1)
                : segment.completed
                  ? 1
                  : 0;
            return (
              <HoverCard key={segment.lessonId} openDelay={75}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-pressed={segment.completed}
                    className={[
                      "relative flex-1 overflow-hidden rounded-xl border transition-all",
                      segment.completed
                        ? "border-primary/40 bg-green-100"
                        : "border-border/50 bg-background/70",
                      isActive ? "ring-primary/70 ring-2" : "ring-transparent",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="relative flex h-6 items-center justify-center text-[0]"></span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="max-w-xs bg-white">
                  <p className="text-foreground text-sm font-medium">
                    {segment.title}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {segment.completed ? "Completed" : "Incomplete"}
                  </p>
                  {segment.topicsTotal > 0 ? (
                    <p className="text-muted-foreground text-xs">
                      {segment.topicsCompleted}/{segment.topicsTotal} topics
                    </p>
                  ) : null}
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      ) : null}
      {activeLessonTitle ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Now viewing:{" "}
          <span className="text-foreground font-medium">
            {activeLessonTitle}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function getLessonTitle(
  lessonId: Id<"posts">,
  lessons: LmsBuilderLesson[],
): string | null {
  const match = lessons.find((lesson) => lesson._id === lessonId);
  return match?.title ?? null;
}
