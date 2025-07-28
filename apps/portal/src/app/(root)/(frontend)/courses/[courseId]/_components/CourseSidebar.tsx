"use client";

import "lucide-react";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  Award,
  CheckCircle,
  ChevronRight,
  Circle,
  Clock,
  FileQuestionIcon,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/collapsible";
import {
  CourseSidebar,
  CourseSidebarContent,
  CourseSidebarGroup,
  CourseSidebarHeader,
  CourseSidebarMenu,
  CourseSidebarMenuButton,
  CourseSidebarMenuItem,
  CourseSidebarMenuSub,
  CourseSidebarMenuSubButton,
  CourseSidebarMenuSubItem,
  CourseSidebarRail,
} from "@acme/ui/course-sidebar";

import { useConvexUser } from "~/hooks/useConvexUser";
import { cn } from "~/lib/utils";

export function CoursesSidebar(
  props: React.ComponentProps<typeof CourseSidebar>,
) {
  const router = useRouter();
  const params = useParams();
  const {
    courseId: paramCourseId,
    lessonId: paramLessonId,
    topicId: paramTopicId,
    quizId: paramQuizId,
  } = params as {
    courseId: string;
    lessonId?: string;
    topicId?: string;
    quizId?: string;
  };

  const [openLessonId, setOpenLessonId] = React.useState<Id<"lessons"> | null>(
    null,
  );

  // Refs for auto-scrolling to active items
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const activeItemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const { convexId: userId } = useConvexUser();
  const courseId = paramCourseId ? (paramCourseId as Id<"courses">) : undefined;

  // Get course structure
  const data2 = useQuery(
    api.lms.courses.queries.getCourseStructureWithItems,
    courseId ? { courseId } : "skip",
  );

  // Get course progress for completion indicators
  const courseProgress = useQuery(
    api.lms.progress.index.getCourseProgressByLessons,
    userId && courseId
      ? {
          userId,
          courseId,
        }
      : "skip",
  );

  const course = data2?.course;
  const attachedLessons = data2?.attachedLessons ?? [];
  const attachedTopics = data2?.attachedTopics ?? [];
  const attachedQuizzes = data2?.attachedQuizzes ?? [];

  const lessonMap = useMemo(
    () => new Map(attachedLessons.map((l) => [l._id, l])),
    [attachedLessons],
  );

  // Helper function to scroll to active item
  const scrollToActiveItem = useCallback(() => {
    const activeItemId = paramTopicId ?? paramQuizId ?? paramLessonId;
    if (!activeItemId || !sidebarContentRef.current) return;

    const activeElement = activeItemRefs.current.get(activeItemId);
    if (activeElement) {
      // Add a small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        const sidebarContainer = sidebarContentRef.current;
        console.log("sidebarContainer", sidebarContainer);
        if (!sidebarContainer) return;

        const itemRect = activeElement.getBoundingClientRect();
        const containerRect = sidebarContainer.getBoundingClientRect();

        // Check if the item is outside the visible area
        if (
          itemRect.top < containerRect.top ||
          itemRect.bottom > containerRect.bottom
        ) {
          // Calculate the scroll position to center the item
          console.log("activeElement", activeElement.offsetTop);
          const scrollTop = activeElement.offsetTop + 200;

          sidebarContainer.scrollTo({
            top: Math.max(0, scrollTop), // Ensure we don't scroll to negative values
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [paramTopicId, paramQuizId, paramLessonId]);

  // Auto-expand the current lesson and scroll to active item
  useEffect(() => {
    if (paramLessonId && paramLessonId !== openLessonId) {
      setOpenLessonId(paramLessonId as Id<"lessons">);
    }
  }, [paramLessonId, openLessonId]);

  // Scroll to active item when data loads or active item changes
  useEffect(() => {
    if (data2 && courseProgress) {
      scrollToActiveItem();
    }
  }, [data2, courseProgress, scrollToActiveItem]);

  // Also scroll when the lesson is opened (for collapsible content)
  useEffect(() => {
    if (openLessonId === paramLessonId) {
      scrollToActiveItem();
    }
  }, [openLessonId, paramLessonId, scrollToActiveItem]);

  // Ref setter function
  const setActiveItemRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) {
        activeItemRefs.current.set(id, element);
      } else {
        activeItemRefs.current.delete(id);
      }
    },
    [],
  );

  const topicsByLesson = useMemo(() => {
    const map = new Map<Id<"lessons">, Doc<"topics">[]>();
    attachedLessons.forEach((l) => {
      map.set(
        l._id,
        attachedTopics.filter((t) => t.lessonId === l._id),
      );
    });
    return map;
  }, [attachedLessons, attachedTopics]);

  const quizzesByLesson = useMemo(() => {
    const map = new Map<Id<"lessons">, Doc<"quizzes">[]>();
    attachedLessons.forEach((l) => {
      map.set(
        l._id,
        attachedQuizzes.filter((q) => q.lessonId === l._id),
      );
    });
    return map;
  }, [attachedLessons, attachedQuizzes]);

  // Helper function to check if an item is completed
  const isItemCompleted = (itemId: string) => {
    if (!courseProgress?.lessons) return false;

    for (const lesson of courseProgress.lessons) {
      // Check if it's a lesson
      if (lesson.lessonId === itemId) {
        return lesson.progress.status === "completed";
      }

      // Check if it's a topic in this lesson
      if (lesson.completedTopics.includes(itemId as Id<"topics">)) {
        return true;
      }

      // For quizzes, we could add similar logic here when quiz progress is implemented
      // The current system might need extension for quiz completion tracking
    }

    return false;
  };

  // Helper function to get lesson progress percentage
  const getLessonProgress = (lessonId: string) => {
    if (!courseProgress?.lessons) return 0;

    const lesson = courseProgress.lessons.find((l) => l.lessonId === lessonId);
    return lesson?.progress.percentage ?? 0;
  };

  const orderedLessons = useMemo(() => {
    return (course?.courseStructure ?? [])
      .map((s: { lessonId: Id<"lessons"> }) => {
        const lesson = lessonMap.get(s.lessonId);
        if (!lesson) return null;

        // Fix the active state detection using URL params
        const isCurrentLesson = paramLessonId === lesson._id;
        const isActiveLessonPage =
          isCurrentLesson && !paramTopicId && !paramQuizId;
        const isCompleted = isItemCompleted(lesson._id);
        const progressPercentage = getLessonProgress(lesson._id);

        return {
          ...lesson,
          isActive: isActiveLessonPage,
          isCurrentLesson,
          isCompleted,
          progressPercentage,
        };
      })
      .filter(Boolean) as (Doc<"lessons"> & {
      isActive: boolean;
      isCurrentLesson: boolean;
      isCompleted: boolean;
      progressPercentage: number;
    })[];
  }, [
    course?.courseStructure,
    lessonMap,
    paramLessonId,
    paramTopicId,
    paramQuizId,
    courseProgress,
  ]);

  return (
    <CourseSidebar {...props} className="sticky top-0 p-0">
      <CourseSidebarHeader className="h-14 justify-center border-b border-border text-lg font-bold">
        Lessons
        {courseProgress && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {Math.round(courseProgress.totalProgress)}%
          </Badge>
        )}
      </CourseSidebarHeader>
      <CourseSidebarContent ref={sidebarContentRef}>
        <CourseSidebarGroup>
          <CourseSidebarMenu>
            {orderedLessons.map((lesson) => (
              <CourseSidebarMenuItem
                key={lesson._id}
                className="h-auto text-sm"
              >
                <Collapsible
                  open={openLessonId === lesson._id}
                  onOpenChange={(isOpen) =>
                    setOpenLessonId(isOpen ? lesson._id : null)
                  }
                  className="group/collapsible"
                >
                  <div className="flex items-center justify-between">
                    <CourseSidebarMenuButton
                      asChild
                      tooltip={`${lesson.title} - ${lesson.progressPercentage}% complete`}
                      isActive={lesson.isActive}
                      onClick={() => setOpenLessonId(lesson._id)}
                      className={cn("h-auto flex-1 justify-start text-sm", {
                        "border-l-2 border-primary bg-primary/10":
                          lesson.isCurrentLesson,
                      })}
                      ref={(el) => {
                        if (lesson.isActive) {
                          setActiveItemRef(lesson._id, el);
                        }
                      }}
                    >
                      <Link
                        href={`/courses/${courseId}/lesson/${lesson._id}`}
                        className="flex w-full items-center gap-2"
                      >
                        {lesson.isCompleted ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                        ) : lesson.progressPercentage > 0 ? (
                          <Clock className="h-4 w-4 flex-shrink-0 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                        {lesson.progressPercentage > 0 &&
                          lesson.progressPercentage < 100 && (
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs"
                            >
                              {Math.round(lesson.progressPercentage)}%
                            </Badge>
                          )}
                      </Link>
                    </CourseSidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        <span className="sr-only">Toggle Lesson Content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="flex flex-col">
                    {topicsByLesson.get(lesson._id)?.length ? (
                      <CourseSidebarMenuSub>
                        {topicsByLesson.get(lesson._id)?.map((topic) => {
                          const isActiveTopic = paramTopicId === topic._id;
                          const isTopicCompleted = isItemCompleted(topic._id);

                          return (
                            <CourseSidebarMenuSubItem key={topic._id}>
                              <CourseSidebarMenuSubButton
                                // asChild
                                isActive={isActiveTopic}
                                className={cn("h-auto min-h-7 p-2", {
                                  "bg-muted text-foreground": isActiveTopic,
                                })}
                                ref={(el) => {
                                  if (isActiveTopic) {
                                    setActiveItemRef(topic._id, el);
                                  }
                                }}
                                onClick={() => {
                                  setOpenLessonId(lesson._id);
                                  router.push(
                                    `/courses/${courseId}/lesson/${lesson._id}/topic/${topic._id}`,
                                  );
                                }}
                              >
                                {/* <Link
                                  href={`/courses/${courseId}/lesson/${lesson._id}/topic/${topic._id}`}
                                  className="flex w-full items-center gap-2"
                                >
                                  {isTopicCompleted ? (
                                    <CheckCircle className="h-3 w-3 flex-shrink-0 text-green-500" />
                                  ) : (
                                    <Circle className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                  )}
                                  <span className="truncate">
                                    {topic.title}
                                  </span>
                                </Link> */}
                                {topic.title}
                              </CourseSidebarMenuSubButton>
                            </CourseSidebarMenuSubItem>
                          );
                        })}
                      </CourseSidebarMenuSub>
                    ) : null}
                    {quizzesByLesson.get(lesson._id)?.length ? (
                      <CourseSidebarMenuSub>
                        {quizzesByLesson.get(lesson._id)?.map((quiz) => {
                          const isActiveQuiz = paramQuizId === quiz._id;
                          const isQuizCompleted = isItemCompleted(quiz._id);

                          return (
                            <CourseSidebarMenuSubItem key={quiz._id}>
                              <CourseSidebarMenuSubButton
                                asChild
                                isActive={isActiveQuiz}
                                className={cn("h-auto min-h-7 p-2", {
                                  "bg-muted text-foreground": isActiveQuiz,
                                })}
                                ref={(el) => {
                                  if (isActiveQuiz) {
                                    setActiveItemRef(quiz._id, el);
                                  }
                                }}
                              >
                                <Link
                                  href={`/courses/${courseId}/lesson/${lesson._id}/quiz/${quiz._id}`}
                                  className="flex w-full items-center gap-2"
                                >
                                  {isQuizCompleted ? (
                                    <Award className="h-3 w-3 flex-shrink-0 text-yellow-500" />
                                  ) : (
                                    <FileQuestionIcon className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                  )}
                                  <span className="truncate">{quiz.title}</span>
                                </Link>
                              </CourseSidebarMenuSubButton>
                            </CourseSidebarMenuSubItem>
                          );
                        })}
                      </CourseSidebarMenuSub>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              </CourseSidebarMenuItem>
            ))}
          </CourseSidebarMenu>
        </CourseSidebarGroup>
      </CourseSidebarContent>
      <CourseSidebarRail />
    </CourseSidebar>
  );
}
