"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AnimatedTooltip } from "@acme/ui/animated-tooltip";
import { Badge } from "@acme/ui/badge";
import { DottedGlowBackground } from "@acme/ui/dotted-glow-background";
import { NoiseBackground } from "@acme/ui/noise-background";

import type { Id } from "../lib/convexId";
import type { LessonSegment } from "../providers/LmsCourseProvider";
import type { LmsCourseBuilderData } from "../types";
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

  const resolvedCourseSlug =
    courseContext.courseSlug ??
    courseStructure.course.slug ??
    courseStructure.course._id ??
    "";

  const previousHref = buildEntryHref(
    courseContext.previousEntry ?? null,
    resolvedCourseSlug,
  );
  const nextHref = buildEntryHref(
    courseContext.nextEntry ?? null,
    resolvedCourseSlug,
  );

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
        <div className="flex items-center gap-2">
          <div className="relative z-30">
            <NoiseBackground
              containerClassName="w-fit rounded-full p-1 overflow-visible h-auto"
              gradientColors={[
                "rgb(255, 100, 150)",
                "rgb(100, 150, 255)",
                "rgb(255, 200, 100)",
              ]}
              noiseIntensity={0.18}
              speed={0.08}
            >
              <div className="inline-flex rounded-full">
                <NavArrowWithPreview
                  direction="previous"
                  href={previousHref}
                  entry={courseContext.previousEntry ?? null}
                  courseStructure={courseStructure}
                  ariaLabel="Go to previous lesson"
                  segmentClassName="h-6 md:h-10 w-10 md:w-16 rounded-l-full rounded-r-none"
                />
                <NavArrowWithPreview
                  direction="next"
                  href={nextHref}
                  entry={courseContext.nextEntry ?? null}
                  courseStructure={courseStructure}
                  ariaLabel="Go to next lesson"
                  segmentClassName="-ml-px h-6 md:h-10 w-10 md:w-16 rounded-l-none rounded-r-full"
                />
              </div>
            </NoiseBackground>
          </div>
          <span className="text-muted-foreground text-sm font-semibold">
            {percentComplete}%
          </span>
        </div>
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

function NavArrowWithPreview({
  direction,
  href,
  ariaLabel,
  entry,
  courseStructure,
  segmentClassName,
}: {
  direction: "previous" | "next";
  href: string | null;
  ariaLabel: string;
  entry: import("../providers/LmsCourseProvider").CourseNavEntry | null;
  courseStructure: LmsCourseBuilderData;
  segmentClassName: string;
}) {
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;
  const preview = getNavEntryPreview(entry, courseStructure);

  const baseClassName =
    "bg-background/70 text-foreground hover:bg-background inline-flex items-center justify-center border transition";
  const className = [
    baseClassName,
    segmentClassName,
    href
      ? "border-border/60 hover:border-primary/60"
      : "border-border/40 opacity-50 pointer-events-none",
  ].join(" ");

  if (!href || !preview) {
    return (
      <span className={className} aria-label={ariaLabel}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <AnimatedTooltip
      items={[
        {
          id: `${direction}-${preview.id}`,
          name: preview.title,
          image: preview.imageUrl ?? undefined,
          designation: preview.subtitle,
        },
      ]}
      itemWrapperClassName="group relative z-40"
      tooltipClassName="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 p-0"
      renderTooltipContent={(item) => (
        <div className="bg-background/95 w-36 overflow-hidden rounded-xl border shadow-lg backdrop-blur">
          <div className="bg-muted/40 relative aspect-16/10 w-full overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                No image
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-muted-foreground text-xs">
              {direction === "previous" ? "Previous" : "Next"}
            </p>
            <p className="text-foreground line-clamp-2 text-sm font-semibold">
              {item.name}
            </p>
            {item.designation ? (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                {item.designation}
              </p>
            ) : null}
          </div>
        </div>
      )}
      renderTrigger={() => (
        <Link href={href} className={className} aria-label={ariaLabel}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    />
  );
}

function buildEntryHref(
  entry: import("../providers/LmsCourseProvider").CourseNavEntry | null,
  courseSlug: string,
): string | null {
  if (!entry) {
    return null;
  }
  if (entry.type === "certificate") {
    const certificateSlug =
      typeof entry.slug === "string" && entry.slug.length > 0
        ? entry.slug
        : (entry.id as string);
    if (entry.scope === "course") {
      return `/course/${courseSlug}/certificate/${certificateSlug}`;
    }
    const lessonSlug = entry.lessonSlug;
    if (!lessonSlug) {
      return null;
    }
    if (entry.scope === "lesson") {
      return `/course/${courseSlug}/lesson/${lessonSlug}/certificate/${certificateSlug}`;
    }
    const topicSlug = entry.topicSlug;
    if (!topicSlug) {
      return null;
    }
    return `/course/${courseSlug}/lesson/${lessonSlug}/topic/${topicSlug}/certificate/${certificateSlug}`;
  }
  if (entry.type === "quiz") {
    const quizSlug =
      typeof entry.slug === "string" && entry.slug.length > 0
        ? entry.slug
        : (entry.id as string);
    return `/course/${courseSlug}/quiz/${quizSlug}`;
  }
  if (entry.type === "lesson") {
    const lessonSlug =
      typeof entry.slug === "string" && entry.slug.length > 0
        ? entry.slug
        : (entry.id as string);
    return `/course/${courseSlug}/lesson/${lessonSlug}`;
  }
  const lessonSlug = entry.lessonSlug;
  if (!lessonSlug) {
    return null;
  }
  const topicSlug =
    typeof entry.slug === "string" && entry.slug.length > 0
      ? entry.slug
      : (entry.id as string);
  return `/course/${courseSlug}/lesson/${lessonSlug}/topic/${topicSlug}`;
}

function getNavEntryPreview(
  entry: import("../providers/LmsCourseProvider").CourseNavEntry | null,
  courseStructure: LmsCourseBuilderData,
): {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
} | null {
  if (!entry) return null;

  if (entry.type === "certificate") {
    return {
      id: String(entry.id),
      title: entry.title,
      subtitle: "Certificate",
      imageUrl: courseStructure.course.firstAttachmentUrl ?? null,
    };
  }

  if (entry.type === "lesson") {
    const lesson = courseStructure.attachedLessons.find(
      (l) => l._id === entry.id,
    );
    return {
      id: String(entry.id),
      title: entry.title,
      subtitle: "Lesson",
      imageUrl: lesson?.firstAttachmentUrl ?? null,
    };
  }

  if (entry.type === "topic") {
    const topic = courseStructure.attachedTopics.find(
      (t) => t._id === entry.id,
    );
    const lesson = entry.lessonId
      ? courseStructure.attachedLessons.find((l) => l._id === entry.lessonId)
      : undefined;
    return {
      id: String(entry.id),
      title: entry.title,
      subtitle: "Topic",
      imageUrl: topic?.firstAttachmentUrl ?? lesson?.firstAttachmentUrl ?? null,
    };
  }

  const quiz = courseStructure.attachedQuizzes.find((q) => q._id === entry.id);
  return {
    id: String(entry.id),
    title: entry.title,
    subtitle: entry.isFinal ? "Final quiz" : "Quiz",
    imageUrl: quiz?.firstAttachmentUrl ?? null,
  };
}
