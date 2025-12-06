"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type { CourseNavEntry } from "../providers/LmsCourseProvider";
import { useLmsCourseContext } from "../providers/LmsCourseProvider";

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

export function FrontendLessonCompletionCallout({
  postTypeSlug,
  post,
  pluginName,
}: PluginFrontendSingleSlotProps) {
  const config = LABEL_MAP[postTypeSlug];
  const courseContext = useLmsCourseContext();
  const [isCompleting, setIsCompleting] = useState(false);
  const markLessonCompletion = useMutation(
    api.plugins.lms.mutations.setLessonCompletionStatus,
  );
  const markTopicCompletion = useMutation(
    api.plugins.lms.mutations.setTopicCompletionStatus,
  );

  if (!config || !post || !courseContext) {
    return null;
  }

  const {
    courseId,
    courseSlug,
    lessonId,
    lessonSlug,
    topicId,
    topicSlug,
    completedLessonIds,
    completedTopicIds,
    navEntries,
    previousEntry,
    nextEntry,
    courseProgress,
    isCourseProgressLoading,
    requiresLinearProgression,
    isLinearBlocked,
    blockingLessonTitle,
  } = courseContext;

  if (!courseId || !courseSlug) {
    return null;
  }

  const title =
    typeof (post as { title?: unknown }).title === "string"
      ? ((post as { title: string }).title ?? config.noun)
      : config.noun;

  const isLessonCompleted =
    postTypeSlug === "lessons" && lessonId
      ? completedLessonIds.has(lessonId)
      : false;
  const isTopicCompleted =
    postTypeSlug === "topics" && topicId
      ? completedTopicIds.has(topicId)
      : false;
  const isCompleted = isLessonCompleted || isTopicCompleted;
  const isAuthenticatedProgress = courseProgress !== null;

  const previousHref = useMemo(
    () => buildEntryHref(previousEntry, courseSlug),
    [courseSlug, previousEntry],
  );
  const nextHref = useMemo(
    () => buildEntryHref(nextEntry, courseSlug),
    [courseSlug, nextEntry],
  );
  const previousLabel = buildEntryLabel(previousEntry);
  const nextLabel = buildEntryLabel(nextEntry);

  const linearBlockMessage = isLinearBlocked
    ? `Complete ${blockingLessonTitle ?? "the previous lesson"} to continue.`
    : null;

  const canonicalLessonPath =
    typeof lessonSlug === "string" && lessonSlug.length > 0
      ? `/course/${courseSlug}/lesson/${lessonSlug}`
      : null;
  const canonicalTopicPath =
    canonicalLessonPath &&
    typeof topicSlug === "string" &&
    topicSlug.length > 0
      ? `${canonicalLessonPath}/topic/${topicSlug}`
      : null;

  const buttonDisabled =
    isCompleting ||
    isCourseProgressLoading ||
    !isAuthenticatedProgress ||
    (postTypeSlug === "lessons" && !lessonId) ||
    (postTypeSlug === "topics" && !topicId) ||
    isLinearBlocked;

  const handleComplete = async () => {
    if (!courseId) {
      toast.error("Missing course reference", {
        description:
          "Please attach this lesson or topic to a course to log progress.",
      });
      return;
    }
    if (!isAuthenticatedProgress) {
      toast.info("Sign in required", {
        description: "Please sign in to record your progress.",
      });
      return;
    }
    setIsCompleting(true);
    try {
      if (postTypeSlug === "lessons" && lessonId) {
        await markLessonCompletion({
          courseId,
          lessonId,
          completed: !isLessonCompleted,
        });
      } else if (postTypeSlug === "topics" && topicId) {
        await markTopicCompletion({
          topicId,
          lessonId: lessonId ?? undefined,
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

  return (
    <div className="bg-card/80 rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="outline" className="text-xs tracking-wide uppercase">
            Course progress
          </Badge>
          <p className="text-foreground mt-1 text-sm font-medium">
            {config.description}
          </p>
        </div>
        <Button
          onClick={handleComplete}
          disabled={buttonDisabled}
          variant={isCompleted ? "secondary" : "default"}
          className="flex-shrink-0"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isCompleted ? `Mark ${config.noun} incomplete` : config.cta}
        </Button>
      </div>
      {!isAuthenticatedProgress ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Sign in to track your personal progress for this course.
        </p>
      ) : null}
      {linearBlockMessage ? (
        <p className="text-destructive mt-3 text-sm">{linearBlockMessage}</p>
      ) : null}
      <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-xs">
        <p className="text-muted-foreground">Permalink</p>
        {canonicalTopicPath || canonicalLessonPath ? (
          <Link
            href={canonicalTopicPath ?? canonicalLessonPath ?? "#"}
            className="text-primary break-all underline"
          >
            {canonicalTopicPath ?? canonicalLessonPath}
          </Link>
        ) : (
          <span className="text-muted-foreground">Unavailable</span>
        )}
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2">
        <NavLink direction="Previous" href={previousHref} label={previousLabel} />
        <NavLink direction="Next" href={nextHref} label={nextLabel} />
      </div>
    </div>
  );
}

function NavLink({
  direction,
  href,
  label,
}: {
  direction: "Previous" | "Next";
  href: string | null;
  label: string | null;
}) {
  if (!href || !label) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-3">
        <p className="text-muted-foreground text-xs">{direction}</p>
        <p className="text-muted-foreground font-medium">None available</p>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border bg-background p-3 transition hover:border-primary/60 hover:shadow-sm"
    >
      <p className="text-muted-foreground text-xs">{direction}</p>
      <p className="text-foreground font-semibold">{label}</p>
      <div className="mt-2 flex items-center text-muted-foreground text-xs">
        {direction === "Previous" ? (
          <ArrowLeft className="mr-1 h-3 w-3" />
        ) : (
          <ArrowRight className="mr-1 h-3 w-3" />
        )}
        <span>{direction === "Previous" ? "Go back" : "Go forward"}</span>
      </div>
    </Link>
  );
}

function buildEntryHref(
  entry: CourseNavEntry | null,
  courseSlug: string,
): string | null {
  if (!entry) {
    return null;
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

function buildEntryLabel(entry: CourseNavEntry | null) {
  if (!entry) {
    return null;
  }
  return entry.title;
}

