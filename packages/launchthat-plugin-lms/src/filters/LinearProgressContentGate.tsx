"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Skeleton } from "@acme/ui/skeleton";

import { useLmsCourseContext } from "../providers/LmsCourseProvider";

interface Props {
  children: ReactNode;
}

export const LinearProgressContentGate = ({ children }: Props) => {
  const courseContext = useLmsCourseContext();

  if (!courseContext) {
    return <CourseContentLoadingState />;
  }

  if (
    courseContext.isCourseStructureLoading ||
    courseContext.isCourseProgressLoading
  ) {
    return <CourseContentLoadingState />;
  }

  const {
    requiresLinearProgression,
    isLinearBlocked,
    blockingLessonTitle,
    postTypeSlug,
    previousEntry,
    completedLessonIds,
    completedTopicIds,
  } = courseContext;

  let blockingMessage: string | null = null;

  if (isLinearBlocked) {
    blockingMessage = blockingLessonTitle ?? "the previous lesson";
  } else if (requiresLinearProgression && postTypeSlug === "topics") {
    // For topics, enforce "complete topics in order within a lesson".
    // We intentionally DO NOT block the first topic in a lesson based on the lesson itself.
    if (previousEntry?.type === "topic") {
      blockingMessage = completedTopicIds.has(previousEntry.id)
        ? null
        : (previousEntry.title ?? "the previous topic");
    }
  } else if (requiresLinearProgression && postTypeSlug === "quizzes") {
    if (previousEntry?.type === "lesson") {
      blockingMessage = completedLessonIds.has(previousEntry.id)
        ? null
        : (previousEntry.title ?? "the previous lesson");
    } else if (previousEntry?.type === "topic") {
      blockingMessage = completedTopicIds.has(previousEntry.id)
        ? null
        : (previousEntry.title ?? "the previous topic");
    }
  }

  if (!requiresLinearProgression || !blockingMessage) {
    return <>{children}</>;
  }

  return (
    <Alert variant="destructive" className="flex items-start gap-3">
      <AlertCircle className="mt-1 h-5 w-5 shrink-0" />
      <div>
        <AlertTitle className="text-base font-semibold">
          Content locked
        </AlertTitle>
        <AlertDescription className="text-muted-foreground text-sm">
          This course enforces linear progression. Complete{" "}
          <span className="text-foreground font-semibold">
            {blockingMessage}
          </span>{" "}
          before accessing this step.
        </AlertDescription>
      </div>
    </Alert>
  );
};

const CourseContentLoadingState = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-2/3 max-w-md" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-4/6" />
  </div>
);
