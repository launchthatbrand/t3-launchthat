"use client";

import React, { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Check, Clock, Loader2 } from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useConvexUser } from "~/hooks/useConvexUser";

type ContentType = "course" | "lesson" | "topic" | "quiz";

interface CompleteContentButtonProps {
  contentType: ContentType;
  courseId: Id<"courses">;
  contentId?: Id<"lessons"> | Id<"topics"> | Id<"quizzes">;
  _lessonId?: Id<"lessons">; // For topics and quizzes - prefixed with _ since unused
  _topicId?: Id<"topics">; // For quizzes - prefixed with _ since unused
  timeSpent?: number;
  score?: number;
  className?: string;
  variant?:
    | "primary"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  showProgress?: boolean;
  onComplete?: () => void;
}

export function CompleteContentButton({
  contentType,
  courseId,
  contentId,
  _lessonId,
  _topicId,
  timeSpent,
  score,
  className,
  variant = "primary",
  size = "md",
  showProgress = true,
  onComplete,
}: CompleteContentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { convexId: userId, isLoading: isAuthLoading } = useConvexUser();

  // Mutations for different content types
  const completeCourse = useMutation(api.lms.progress.mutations.completeCourse);
  const completeLesson = useMutation(api.lms.progress.mutations.completeLesson);
  const completeTopic = useMutation(api.lms.progress.mutations.completeTopic);
  const completeQuiz = useMutation(api.lms.progress.mutations.completeQuiz);

  const isItemCompleted = useQuery(
    api.lms.progress.queries.isItemCompleted,
    userId
      ? {
          userId: userId as Id<"users">,
          itemId: contentId,
          courseId,
        }
      : "skip",
  );

  const courseProgress = useQuery(
    api.lms.progress.queries.getCourseProgressMeta,
    userId
      ? {
          userId: userId as Id<"users">,
          courseId,
        }
      : "skip",
  );

  const lessonProgress = useQuery(
    api.lms.progress.queries.getLessonProgress,
    userId && contentType === "lesson"
      ? {
          userId: userId as Id<"users">,
          courseId,
          lessonId: contentId as Id<"lessons">,
        }
      : "skip",
  );

  if (isAuthLoading) {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!userId) {
    return (
      <Button disabled variant="outline" size={size} className={className}>
        <AlertCircle className="mr-2 h-4 w-4" />
        Sign in to track progress
      </Button>
    );
  }

  const handleComplete = async () => {
    if (!userId) {
      toast.error("Please sign in to track progress");
      return;
    }

    setIsLoading(true);

    try {
      switch (contentType) {
        case "course":
          await completeCourse({
            userId,
            courseId,
          });
          toast.success("Course marked as complete!");
          break;

        case "lesson":
          if (!contentId) {
            throw new Error("Lesson ID is required");
          }
          await completeLesson({
            userId,
            courseId,
            lessonId: contentId as Id<"lessons">,
          });
          toast.success("Lesson marked as complete!");
          break;

        case "topic":
          if (!contentId) {
            throw new Error("Topic ID is required");
          }
          await completeTopic({
            userId,
            courseId,
            topicId: contentId as Id<"topics">,
            timeSpent,
          });
          toast.success("Topic marked as complete!");
          break;

        case "quiz":
          if (!contentId) {
            throw new Error("Quiz ID is required");
          }
          await completeQuiz({
            userId,
            courseId,
            quizId: contentId as Id<"quizzes">,
            score,
            timeSpent,
          });
          toast.success("Quiz marked as complete!");
          break;

        default:
          // This should never happen since we have all cases covered
          throw new Error("Unsupported content type");
      }

      onComplete?.();
    } catch (error) {
      console.error("Error completing content:", error);
      toast.error(`Failed to mark ${contentType} as complete`);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if already completed
  const isCompleted =
    contentType === "course"
      ? courseProgress?.status === "completed"
      : isItemCompleted;

  // Get button text and icon
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Completing...
        </>
      );
    }

    if (isCompleted) {
      return (
        <>
          <Check className="mr-2 h-4 w-4" />
          Completed
        </>
      );
    }

    return (
      <>
        <Clock className="mr-2 h-4 w-4" />
        Complete {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
      </>
    );
  };

  // Get progress display text
  const getProgressText = () => {
    if (!showProgress) return null;

    if (contentType === "course" && courseProgress) {
      return `${courseProgress.percentComplete}% complete (${courseProgress.completed}/${courseProgress.total} items)`;
    }

    if (contentType === "lesson" && lessonProgress) {
      return `${lessonProgress.percentComplete}% complete (${lessonProgress.topicsCompleted}/${lessonProgress.totalTopics} topics)`;
    }

    return null;
  };

  const progressText = getProgressText();

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        onClick={handleComplete}
        disabled={isLoading || isCompleted}
        variant={isCompleted ? "outline" : variant}
        size={size}
        className={cn(
          isCompleted && "h-32 border-green-500 text-green-600",
          className,
        )}
      >
        {getButtonContent()}
      </Button>

      {progressText && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {progressText}
          </Badge>
        </div>
      )}
    </div>
  );
}

// Helper hook for easy usage with different content types
export function useCompleteContent() {
  const { convexId: userId } = useConvexUser();

  return {
    userId,
    isAuthenticated: !!userId,
  };
}
