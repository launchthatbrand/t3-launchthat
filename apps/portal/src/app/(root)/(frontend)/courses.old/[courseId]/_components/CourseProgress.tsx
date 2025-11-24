"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@convex-config/_generated/dataModel";
import {
  Award,
  BookOpen,
  CheckCircle,
  Circle,
  Lock,
  PlayCircle,
  Target,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";
import { Skeleton } from "@acme/ui/skeleton";

interface LessonSegment {
  lessonId: Id<"lessons">;
  title: string;
  order: number;
  percentage: number; // This lesson's completion percentage (0-100)
  status: "not_started" | "in_progress" | "completed" | "locked";
  isLinear?: boolean; // Whether this lesson requires previous ones to be completed
  topicsCompleted: number;
  totalTopics: number;
}

interface CourseProgressProps {
  courseProgressByLessons?: {
    courseId: Id<"courses">;
    totalProgress: number;
    status: "not_started" | "in_progress" | "completed";
    lessons: {
      lessonId: Id<"lessons">;
      title: string;
      order: number;
      isLinear?: boolean;
      progress: {
        percentage: number;
        topicsCompleted: number;
        totalTopics: number;
        lessonsCompleted: boolean;
        status: "not_started" | "in_progress" | "completed" | "locked";
      };
      completedTopics: Id<"topics">[];
      totalTopics: Id<"topics">[];
    }[];
  };
  lessons?: {
    _id: Id<"lessons">;
    title: string;
    menuOrder?: number;
  }[];
  userId?: Id<"users">;
  courseId: Id<"courses">;
  className?: string;
  showDetails?: boolean;
  isLoading?: boolean;
}

export const CourseProgress = ({
  courseProgressByLessons,
  lessons: _lessons = [],
  userId,
  courseId: _courseId,
  isLoading,
  className,
  showDetails = true,
}: CourseProgressProps) => {
  const router = useRouter();
  const [openHoverCards, setOpenHoverCards] = useState<Record<string, boolean>>(
    {},
  );

  const handleHoverCardChange = (lessonId: string, isOpen: boolean) => {
    setOpenHoverCards((prev) => ({
      ...prev,
      [lessonId]: isOpen,
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-full bg-white/30" />;
  }

  // If no user is logged in, show generic progress
  if (!userId || !courseProgressByLessons) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <Circle className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Sign in to track your course progress</p>
        </div>
      </div>
    );
  }

  // Transform progress data into lesson segments
  const createLessonSegments = (): LessonSegment[] => {
    return courseProgressByLessons.lessons.map((lesson, _index) => ({
      lessonId: lesson.lessonId,
      title: lesson.title,
      order: lesson.order,
      percentage: lesson.progress.percentage,
      status: lesson.progress.status,
      isLinear: lesson.isLinear,
      topicsCompleted: lesson.progress.topicsCompleted,
      totalTopics: lesson.progress.totalTopics,
    }));
  };

  const lessonSegments = createLessonSegments();
  const totalLessons = lessonSegments.length;
  const completedLessons = lessonSegments.filter(
    (s) => s.status === "completed",
  ).length;
  const totalProgress = courseProgressByLessons.totalProgress;

  // Calculate segment width (equal distribution)
  const segmentWidth = totalLessons > 0 ? 100 / totalLessons : 100;

  return (
    <div className={className}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="progress-details" className="border-none">
          {/* Main Progress Bar - Always Visible */}
          <div className="flex w-full items-center gap-6">
            {/* <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(totalProgress)}% Complete
              </span>
            </div> */}

            {/* Segmented Progress Bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
              {lessonSegments.map((segment, index) => {
                const leftPosition = index * segmentWidth;

                return (
                  <HoverCard
                    openDelay={100}
                    key={segment.lessonId}
                    open={openHoverCards[segment.lessonId]}
                    onOpenChange={(isOpen) =>
                      handleHoverCardChange(segment.lessonId, isOpen)
                    }
                  >
                    <HoverCardTrigger asChild>
                      <div
                        className="absolute top-0 h-full cursor-pointer transition-all duration-300 hover:scale-y-110"
                        style={{
                          left: `${leftPosition}%`,
                          width: `${segmentWidth}%`,
                          border:
                            index < lessonSegments.length - 1
                              ? "1px solid white"
                              : "none",
                          borderRight:
                            index < lessonSegments.length - 1
                              ? "1px solid white"
                              : "none",
                        }}
                      >
                        {/* Progress fill */}
                        <div
                          className={`h-full transition-all duration-500 ${
                            segment.status === "completed"
                              ? "bg-green-500"
                              : segment.status === "in_progress"
                                ? "bg-blue-500"
                                : segment.status === "locked"
                                  ? "bg-gray-400"
                                  : "bg-gray-300"
                          }`}
                          style={{
                            width: `${segment.percentage}%`,
                          }}
                        />

                        {/* Status indicator */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 transform">
                          {segment.status === "completed" ? (
                            <CheckCircle className="h-3 w-3 text-primary" />
                          ) : segment.status === "in_progress" ? (
                            <PlayCircle className="h-3 w-3 text-primary" />
                          ) : segment.status === "locked" ? (
                            <Lock className="h-3 w-3 text-primary" />
                          ) : (
                            <Circle className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="z-20 w-64 text-center text-sm">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="font-medium">{segment.title}</div>
                        <div className="text-xs text-slate-500">
                          Lesson {segment.order} • {segment.percentage}%
                          Complete
                        </div>
                        <div className="text-xs">
                          {segment.topicsCompleted}/{segment.totalTopics} topics
                          completed
                        </div>
                        {segment.status === "locked" && segment.isLinear && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="mr-1 h-3 w-3" />
                            Complete previous lessons first
                          </Badge>
                        )}
                        <button
                          variant="outline"
                          size="icon"
                          className="w-full"
                          onClick={() => {
                            router.push(
                              `/courses/${courseProgressByLessons.courseId}/lesson/${segment.lessonId}`,
                            );
                          }}
                        >
                          <BookOpen className="h-4 w-4" />
                          View Lesson
                        </button>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
            <AccordionTrigger className="items-center justify-center rounded-md bg-muted/20 p-2 text-sm [&>svg]:h-5 [&>svg]:w-5" />
          </div>

          {/* Detailed Information in Accordion */}
          {showDetails && (
            <AccordionContent className="space-y-4 p-0 pt-3">
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 text-primary">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {Math.round(totalProgress)}%
                  </div>
                  <div className="text-xs">Total Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {completedLessons}/{totalLessons}
                  </div>
                  <div className="text-xs">Lessons Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    <Target className="mx-auto h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    {courseProgressByLessons.status === "completed"
                      ? "Complete!"
                      : courseProgressByLessons.status === "in_progress"
                        ? "In Progress"
                        : "Not Started"}
                  </div>
                </div>
              </div>

              {/* <div className="space-y-2">
                <h4 className="text-sm font-medium">Lesson Breakdown</h4>
                {lessonSegments.map((segment) => (
                  <div
                    key={segment.lessonId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {segment.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : segment.status === "in_progress" ? (
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                      ) : segment.status === "locked" ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {segment.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {segment.topicsCompleted}/{segment.totalTopics} topics
                          • Lesson {segment.order}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          segment.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {segment.percentage}%
                      </Badge>
                      {segment.status === "locked" && segment.isLinear && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="mr-1 h-3 w-3" />
                          Linear
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div> */}
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
};
