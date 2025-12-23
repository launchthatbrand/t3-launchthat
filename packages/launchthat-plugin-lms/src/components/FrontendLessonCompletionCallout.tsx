"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { NoiseBackground } from "@acme/ui/noise-background";
import { toast } from "@acme/ui/toast";

import type { Id } from "../lib/convexId";
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
    description: "",
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

  if (!config || !post) {
    return null;
  }

  const courseId = courseContext?.courseId;
  const courseSlug = courseContext?.courseSlug;
  const resolvedCourseSlug = courseSlug ?? "";
  const lessonId = courseContext?.lessonId;
  const lessonSlug = courseContext?.lessonSlug;
  const topicId = courseContext?.topicId;
  const topicSlug = courseContext?.topicSlug;
  const completedLessonIds =
    courseContext?.completedLessonIds ?? new Set<Id<"posts">>();
  const completedTopicIds =
    courseContext?.completedTopicIds ?? new Set<Id<"posts">>();
  const navEntries = courseContext?.navEntries ?? [];
  const previousEntry = courseContext?.previousEntry ?? null;
  const nextEntry = courseContext?.nextEntry ?? null;
  const courseProgress = courseContext?.courseProgress ?? null;
  const isCourseProgressLoading =
    courseContext?.isCourseProgressLoading ?? false;
  const requiresLinearProgression =
    courseContext?.requiresLinearProgression ?? false;
  const isLinearBlocked = courseContext?.isLinearBlocked ?? false;
  const blockingLessonTitle = courseContext?.blockingLessonTitle ?? null;

  const isCourseContextReady =
    courseContext !== null &&
    courseContext !== undefined &&
    Boolean(courseId) &&
    Boolean(courseSlug);

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

  const attachedCertificates =
    courseContext?.courseStructure?.attachedCertificates ?? [];
  const resolvedCertificate = useMemo(() => {
    const structure = courseContext?.courseStructure;
    if (!structure) return null;

    const findById = (id: string | undefined) => {
      if (!id) return null;
      return attachedCertificates.find((cert) => cert._id === id) ?? null;
    };

    if (postTypeSlug === "courses") {
      return findById(structure.course.certificateId);
    }
    if (postTypeSlug === "lessons" && lessonId) {
      const lesson = (structure.attachedLessons ?? []).find(
        (l) => l._id === lessonId,
      );
      return findById(lesson?.certificateId);
    }
    if (postTypeSlug === "topics" && topicId) {
      const topic = (structure.attachedTopics ?? []).find(
        (t) => t._id === topicId,
      );
      return findById(topic?.certificateId);
    }
    return null;
  }, [
    attachedCertificates,
    courseContext?.courseStructure,
    lessonId,
    postTypeSlug,
    topicId,
  ]);

  const isCourseCompleted = useMemo(() => {
    if (postTypeSlug !== "courses") return false;
    const segments = courseContext?.segments ?? [];
    if (!segments.length) return false;
    return segments.every((segment) =>
      completedLessonIds.has(segment.lessonId),
    );
  }, [completedLessonIds, courseContext?.segments, postTypeSlug]);

  const isCertificateUnlocked =
    postTypeSlug === "courses"
      ? isCourseCompleted
      : postTypeSlug === "lessons"
        ? isLessonCompleted
        : postTypeSlug === "topics"
          ? isTopicCompleted
          : false;

  const certificateHref = resolvedCertificate
    ? `/certificate/${resolvedCertificate.slug ?? resolvedCertificate._id}`
    : null;

  const linearBlockMessage = isLinearBlocked
    ? `Complete ${blockingLessonTitle ?? "the previous lesson"} to continue.`
    : null;

  const canonicalLessonPath =
    typeof lessonSlug === "string" && lessonSlug.length > 0
      ? `/course/${courseSlug}/lesson/${lessonSlug}`
      : null;
  const canonicalTopicPath =
    canonicalLessonPath && typeof topicSlug === "string" && topicSlug.length > 0
      ? `${canonicalLessonPath}/topic/${topicSlug}`
      : null;

  const buttonDisabled =
    isCompleting ||
    isCourseProgressLoading ||
    !isAuthenticatedProgress ||
    (postTypeSlug === "lessons" && !lessonId) ||
    (postTypeSlug === "topics" && !topicId) ||
    isLinearBlocked;

  if (!isCourseContextReady) {
    return null;
  }

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
            Course completion
          </Badge>
          <p className="text-foreground mt-1 text-sm font-medium">
            {config.description}
          </p>
        </div>
        <NoiseBackground
          containerClassName="w-full rounded-full p-1"
          gradientColors={[
            "rgb(255, 100, 150)",
            "rgb(100, 150, 255)",
            "rgb(255, 200, 100)",
          ]}
          noiseIntensity={0.18}
          speed={0.08}
          animating={!buttonDisabled}
        >
          <Button
            onClick={handleComplete}
            disabled={buttonDisabled}
            variant={isCompleted ? "secondary" : "default"}
            size={"lg"}
            className={[
              "h-12 w-full shrink-0 rounded-full border text-base font-semibold transition",
              isCompleted
                ? "bg-background/70 text-foreground border-border/60 hover:bg-background"
                : "bg-background/70 text-foreground border-border/60 hover:bg-background",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isCompleted ? `Mark ${config.noun} incomplete` : config.cta}
          </Button>
        </NoiseBackground>
      </div>
      {resolvedCertificate ? (
        <div className="bg-muted/20 mt-3 hidden flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-3 md:flex">
          <div>
            <p className="text-sm font-medium">
              Certificate: {resolvedCertificate.title ?? "Untitled certificate"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isCertificateUnlocked
                ? "Unlocked"
                : "Complete this section to unlock your certificate."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!certificateHref || !isCertificateUnlocked}
            asChild={Boolean(certificateHref && isCertificateUnlocked)}
          >
            {certificateHref && isCertificateUnlocked ? (
              <Link href={certificateHref}>View certificate</Link>
            ) : (
              <span>View certificate</span>
            )}
          </Button>
        </div>
      ) : null}
      {!isAuthenticatedProgress ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Sign in to track your personal progress for this course.
        </p>
      ) : null}
      {linearBlockMessage ? (
        <p className="text-destructive mt-3 text-sm">{linearBlockMessage}</p>
      ) : null}
    </div>
  );
}
