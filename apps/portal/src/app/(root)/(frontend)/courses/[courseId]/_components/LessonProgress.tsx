"use client";

import React from "react";
import { Id } from "@convex-config/_generated/dataModel";
import { Award, CheckCircle, Circle, PlayCircle } from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";
import { Progress } from "@acme/ui/progress";

interface Milestone {
  id: string | Id<"quizzes">;
  title: string;
  percentage: number;
  type: "quiz" | "checkpoint";
  icon: React.ReactNode;
  completed: boolean;
}

interface LessonProgressProps {
  lessonProgress:
    | {
        lessonId: Id<"lessons">;
        lessonCompleted: boolean;
        lessonCompletedAt?: number;
        topics: {
          topicId: Id<"topics">;
          title: string;
          completed: boolean;
          completedAt?: number;
        }[];
        topicsCompleted: number;
        totalTopics: number;
        percentComplete: number;
      }
    | null
    | undefined;
  quizzes:
    | {
        _id: Id<"quizzes">;
        title: string;
        description?: string;
        order?: number;
        lessonId?: Id<"lessons">;
        isPublished?: boolean;
      }[]
    | null
    | undefined;
  userId: string | undefined;
  _courseId: Id<"courses">;
  className?: string;
}

export const LessonProgress = ({
  lessonProgress,
  quizzes,
  userId,
  _courseId,
  className,
}: LessonProgressProps) => {
  // If no user is logged in, show generic progress
  if (!userId || !lessonProgress) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8 text-muted-foreground",
          className,
        )}
      >
        <div className="text-center">
          <Circle className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Sign in to track your lesson progress</p>
        </div>
      </div>
    );
  }

  // Create milestone markers based on quizzes and progress checkpoints
  const createMilestones = (): Milestone[] => {
    const milestones: Milestone[] = [];

    // Add quiz-based milestones if quizzes exist
    if (quizzes && quizzes.length > 0) {
      quizzes.forEach((quiz, index) => {
        const percentage = ((index + 1) / (quizzes.length + 1)) * 100;
        milestones.push({
          id: quiz._id,
          title: quiz.title || `Quiz ${index + 1}`,
          percentage: Math.min(percentage, 95), // Never place at 100%
          type: "quiz" as const,
          icon: <Award className="h-3 w-3" />,
          completed: false, // We'll check this separately if needed
        });
      });
    } else {
      // Create milestone markers based on progress checkpoints (every 25%)
      [25, 50, 75].forEach((percentage, index) => {
        milestones.push({
          id: `checkpoint-${index}`,
          title: `${percentage}% Complete`,
          percentage,
          type: "checkpoint" as const,
          icon: <Circle className="h-3 w-3" />,
          completed: lessonProgress.percentComplete >= percentage,
        });
      });
    }

    return milestones;
  };

  const milestones = createMilestones();
  const currentProgress = lessonProgress.percentComplete;

  return (
    <div className={cn("TEST space-y-4", className)}>
      {/* Progress Bar with Milestones */}
      <div className="relative flex w-full items-center">
        <Progress value={currentProgress} className="h-3 w-full bg-muted" />

        {/* Start marker */}
        <div className="absolute left-0 z-10 -translate-x-1/2">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <PlayCircle className="h-2 w-2 text-primary-foreground" />
          </div>
        </div>

        {/* Milestone markers */}
        {milestones.map((milestone) => (
          <HoverCard openDelay={100} key={milestone.id.toString()}>
            <HoverCardTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={`absolute z-10 -translate-x-1/2 rounded-full p-1 transition-all duration-200 hover:scale-110 ${
                  milestone.completed
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-muted-foreground hover:bg-muted-foreground/80"
                }`}
                style={{ left: `${milestone.percentage}%` }}
              >
                {milestone.completed ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  milestone.icon
                )}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-48 text-center text-sm">
              <div className="space-y-2">
                <div className="font-medium">{milestone.title}</div>
                <div className="text-xs text-muted-foreground">
                  {milestone.type === "quiz"
                    ? "Interactive Quiz"
                    : "Progress Checkpoint"}
                </div>
                <Badge
                  variant={milestone.completed ? "default" : "outline"}
                  className={milestone.completed ? "bg-green-500" : ""}
                >
                  {milestone.completed ? "Completed" : "Pending"}
                </Badge>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}

        {/* End marker */}
        <div className="absolute right-0 z-10 translate-x-1/2">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-200 ${
              currentProgress >= 100 ? "bg-green-500" : "bg-muted-foreground"
            }`}
          >
            {currentProgress >= 100 ? (
              <CheckCircle className="h-2 w-2 text-white" />
            ) : (
              <Circle className="h-2 w-2 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Progress Statistics */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1">
          <div className="text-lg font-bold text-primary">
            {currentProgress}%
          </div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold">
            {lessonProgress.topicsCompleted}
          </div>
          <div className="text-xs text-muted-foreground">Topics Done</div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold">
            {lessonProgress.totalTopics - lessonProgress.topicsCompleted}
          </div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>

      {/* Next Action */}
      {currentProgress < 100 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            Keep going! You're {100 - currentProgress}% away from completion
          </Badge>
        </div>
      )}

      {currentProgress >= 100 && (
        <div className="text-center">
          <Badge className="bg-green-500 text-xs">
            🎉 Lesson Complete! Great job!
          </Badge>
        </div>
      )}
    </div>
  );
};
