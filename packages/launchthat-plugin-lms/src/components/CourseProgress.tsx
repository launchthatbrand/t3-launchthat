"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { CheckCircle2 } from "lucide-react";

import { AnimatedTooltip } from "@acme/ui/animated-tooltip";
import { Badge } from "@acme/ui/badge";
import { DottedGlowBackground } from "@acme/ui/components/ui/dotted-glow-background";

import type { Id } from "../lib/convexId";
import type { LessonSegment } from "../providers/LmsCourseProvider";
import { useLmsCourseContext } from "../providers/LmsCourseProvider";

const SUPPORTED_POST_TYPES = new Set(["courses", "lessons", "topics"]);

export function CourseProgress({
  post,
  postTypeSlug,
}: PluginFrontendSingleSlotProps) {
  const courseContext = useLmsCourseContext();

  // Always call hooks in a stable order. If we don't have enough context yet,
  // `useQuery` will be skipped.
  const activeLessonBadges = useQuery(
    api.plugins.lms.queries.getBadgeSummariesForPost,
    courseContext?.activeLessonId
      ? {
          postId: String(courseContext.activeLessonId),
          organizationId: courseContext.organizationId ?? undefined,
        }
      : "skip",
  );

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
  const activeLessonBadgeList = (activeLessonBadges ?? []) as Array<{
    badgeId: string;
    title: string;
    firstAttachmentUrl?: string;
  }>;

  return (
    <div className="bg-card/80 relative rounded-2xl border p-4 shadow-sm">
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={0.7}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />
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
        <div className="relative mt-3 flex gap-2 rounded-2xl border bg-white p-2">
          <AnimatedTooltip
            itemWrapperClassName="group relative flex-1"
            tooltipClassName="absolute -top-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl"
            items={segments.map((segment) => {
              const topicsCompleted = segment.topics.filter(
                (topic) => topic.completed,
              ).length;
              const topicsLabel =
                segment.topics.length > 0
                  ? ` · ${topicsCompleted}/${segment.topics.length} topics`
                  : "";

              return {
                id: segment.lessonId,
                name: segment.title,
                designation: `${segment.completed ? "Completed" : "Incomplete"}${topicsLabel}`,
              };
            })}
            renderTrigger={(item) => {
              const segment = segments.find(
                (entry) => entry.lessonId === String(item.id),
              );
              const isActive =
                segment && activeLessonId === String(segment.lessonId);
              const isCompleted = segment?.completed ?? false;
              return (
                <button
                  type="button"
                  aria-pressed={isCompleted}
                  className={[
                    "relative w-full flex-1 overflow-hidden rounded-xl border transition-all",
                    isCompleted
                      ? "border-primary/40 bg-green-100"
                      : "border-border/50 bg-background/70",
                    isActive ? "ring-primary/70 ring-2" : "ring-transparent",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="relative flex h-3 items-center justify-center text-[0] md:h-4"></span>
                </button>
              );
            }}
          />
        </div>
      ) : null}
      {/* {activeLessonTitle ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Now viewing:{" "}
          <span className="text-foreground font-medium">
            {activeLessonTitle}
          </span>
        </p>
      ) : null} */}
      {activeLessonTitle &&
      activeLessonBadges !== undefined &&
      activeLessonBadgeList.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Awards:</span>
          {activeLessonBadgeList.map((badge) =>
            badge.firstAttachmentUrl ? (
              <span
                key={badge.badgeId}
                className="bg-muted ring-border/60 inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-1"
                title={badge.title}
              >
                <img
                  src={badge.firstAttachmentUrl}
                  alt={badge.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </span>
            ) : (
              <Badge
                key={badge.badgeId}
                variant="secondary"
                className="text-xs"
              >
                {badge.title}
              </Badge>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function getSegmentTitle(
  lessonId: string | undefined,
  segments: LessonSegment[],
) {
  if (!lessonId) return null;
  const segment = segments.find((entry) => entry.lessonId === lessonId);
  return segment?.title ?? null;
}
