import "lucide-react"; // ArrowUpCircleIcon,

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronRight, FileQuestionIcon } from "lucide-react";

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

// AudioWaveform,
// BookOpen,
// Bot,
// Command,
// Frame,
// GalleryVerticalEnd,
// Map,
// PieChart,
// Settings2,
// SquareTerminal,

export function CoursesSidebar(
  props: React.ComponentProps<typeof CourseSidebar>,
) {
  const { courseId: paramCourseId } = useParams();
  const [openLessonId, setOpenLessonId] = React.useState<Id<"lessons"> | null>(
    null,
  );

  const courseId = paramCourseId ? (paramCourseId as Id<"courses">) : undefined;

  const data2 = useQuery(
    api.lms.courses.queries.getCourseStructureWithItems,
    courseId ? { courseId } : "skip",
  );

  const course = data2?.course;
  const attachedLessons = data2?.attachedLessons ?? [];
  const attachedTopics = data2?.attachedTopics ?? [];
  const attachedQuizzes = data2?.attachedQuizzes ?? [];

  const lessonMap = useMemo(
    () => new Map(attachedLessons.map((l) => [l._id, l])),
    [attachedLessons],
  );

  const selectedLessonSegmentId = useSelectedLayoutSegment("lesson");
  const selectedTopicSegmentId = useSelectedLayoutSegment("topic");
  const selectedQuizSegmentId = useSelectedLayoutSegment("quiz");

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

  const orderedLessons = useMemo(() => {
    return (course?.courseStructure ?? [])
      .map((s: { lessonId: Id<"lessons"> }) => {
        const lesson = lessonMap.get(s.lessonId);
        if (!lesson) return null;

        const isActive =
          selectedLessonSegmentId === lesson._id &&
          !selectedTopicSegmentId &&
          !selectedQuizSegmentId;

        return { ...lesson, isActive };
      })
      .filter(Boolean) as (Doc<"lessons"> & { isActive: boolean })[];
  }, [
    course?.courseStructure,
    lessonMap,
    selectedLessonSegmentId,
    selectedTopicSegmentId,
    selectedQuizSegmentId,
  ]);

  return (
    <CourseSidebar {...props} className="TEST sticky top-0 p-0">
      <CourseSidebarHeader className="h-14 justify-center border-b border-border text-lg font-bold">
        Lessons
      </CourseSidebarHeader>
      <CourseSidebarContent>
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
                      tooltip={lesson.title}
                      isActive={lesson.isActive}
                      onClick={() => setOpenLessonId(lesson._id)}
                      className="h-auto text-sm"
                    >
                      <Link href={`/courses/${courseId}/lesson/${lesson._id}`}>
                        {lesson.title}
                      </Link>
                    </CourseSidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        <span className="sr-only">Toggle Lesson Content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="flex flex-col">
                    {topicsByLesson.get(lesson._id)?.length ? (
                      <CourseSidebarMenuSub>
                        {topicsByLesson.get(lesson._id)?.map((topic) => {
                          const isActiveTopic =
                            selectedTopicSegmentId === topic._id &&
                            selectedLessonSegmentId === topic.lessonId;
                          return (
                            <CourseSidebarMenuSubItem key={topic._id}>
                              <CourseSidebarMenuSubButton
                                asChild
                                isActive={isActiveTopic}
                                className="h-auto min-h-7 p-2"
                              >
                                <Link
                                  href={`/courses/${courseId}/lesson/${lesson._id}/topic/${topic._id}`}
                                  // className="h-10"
                                >
                                  {topic.title}
                                </Link>
                              </CourseSidebarMenuSubButton>
                            </CourseSidebarMenuSubItem>
                          );
                        })}
                      </CourseSidebarMenuSub>
                    ) : null}
                    {quizzesByLesson.get(lesson._id)?.length ? (
                      <CourseSidebarMenuSub>
                        {quizzesByLesson.get(lesson._id)?.map((quiz) => {
                          const isActiveQuiz =
                            selectedQuizSegmentId === quiz._id &&
                            selectedLessonSegmentId === quiz.lessonId;
                          return (
                            <CourseSidebarMenuSubItem key={quiz._id}>
                              <CourseSidebarMenuSubButton
                                asChild
                                isActive={isActiveQuiz}
                              >
                                <Link
                                  href={`/courses/${courseId}/lesson/${lesson._id}/quiz/${quiz._id}`}
                                >
                                  <FileQuestionIcon className="h-3 w-3" />
                                  {quiz.title}
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
