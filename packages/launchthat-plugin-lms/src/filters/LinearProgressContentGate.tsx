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

  if (
    !courseContext.requiresLinearProgression ||
    !courseContext.isLinearBlocked
  ) {
    return <>{children}</>;
  }

  const blockingLessonTitle =
    courseContext.blockingLessonTitle ?? "the previous lesson";

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
            {blockingLessonTitle}
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
