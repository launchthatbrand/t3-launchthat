"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";

import type { Id } from "../lib/convexId";
import type { LessonSegment } from "../providers/LmsCourseProvider";
import { useLmsCourseContext } from "../providers/LmsCourseProvider";

const SUPPORTED_POST_TYPES = new Set(["courses", "lessons", "topics"]);

export function CourseProgress({
  post,
  postTypeSlug,
}: PluginFrontendSingleSlotProps) {
  const courseContext = useLmsCourseContext();
  if (!courseContext) {
    return null;
  }

  const {
    postTypeSlug: contextPostType,
    segments,
    courseStructure,
    courseProgress,
    completedLessonIds,
    activeLessonId,
    isCourseStructureLoading,
    isCourseProgressLoading,
  } = courseContext;

  const effectivePostType =
    typeof postTypeSlug === "string" && postTypeSlug.length > 0
      ? postTypeSlug
      : (contextPostType ?? "");

  if (
    !post ||
    !effectivePostType ||
    !SUPPORTED_POST_TYPES.has(effectivePostType)
  ) {
    return null;
  }

  if (isCourseStructureLoading || isCourseProgressLoading) {
    return (
      <div className="bg-card/80 rounded-2xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">
          Loading course progress…
        </p>
      </div>
    );
  }

  if (!courseStructure) {
    return null;
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

  const totalLessons = segments.length;
  const completedLessons = completedLessonIds.size;
  const percentComplete =
    totalLessons > 0
      ? Math.round(
          (Math.min(completedLessons, totalLessons) / totalLessons) * 100,
        )
      : 0;

  const activeLessonTitle = activeLessonId
    ? getSegmentTitle(activeLessonId, segments)
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
                  {segment.topics.length > 0 ? (
                    <p className="text-muted-foreground text-xs">
                      {segment.topics.filter((topic) => topic.completed).length}
                      /{segment.topics.length} topics
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

function getSegmentTitle(
  lessonId: Id<"posts"> | undefined,
  segments: LessonSegment[],
): string | null {
  if (!lessonId) return null;
  const segment = segments.find((entry) => entry.lessonId === lessonId);
  return segment?.title ?? null;
}
