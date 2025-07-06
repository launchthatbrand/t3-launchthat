import "lucide-react"; // ArrowUpCircleIcon,

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import {
  CourseSidebar,
  CourseSidebarContent,
  CourseSidebarGroup,
  CourseSidebarMenu,
  CourseSidebarMenuButton,
  CourseSidebarMenuItem,
  CourseSidebarMenuSub,
  CourseSidebarMenuSubButton,
  CourseSidebarMenuSubItem,
  CourseSidebarRail,
} from "@acme/ui/course-sidebar";
import { NavMain } from "@acme/ui/general/nav-main";

import { cn } from "~/lib/utils";

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

const data = {
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
    {
      title: "Community",
      url: "#",
      items: [
        {
          title: "Contribution Guide",
          url: "#",
        },
      ],
    },
  ],
};

export function CoursesSidebar(
  props: React.ComponentProps<typeof CourseSidebar>,
) {
  const { courseId } = useParams();
  console.log("courseId2", courseId);
  const data2 = useQuery(
    api.lms.courses.queries.getCourseStructureWithItems,
    courseId ? { courseId } : "skip",
  );
  // Provide safe fallbacks while data is loading to keep hook order consistent
  const course = data2?.course;
  const attachedLessons = data2?.attachedLessons ?? [];
  const attachedTopics = data2?.attachedTopics ?? [];
  const attachedQuizzes = data2?.attachedQuizzes ?? [];

  const lessonMap = useMemo(
    () => new Map(attachedLessons.map((l) => [l._id, l])),
    [attachedLessons],
  );
  const selectedLessonSegment = useSelectedLayoutSegment("lesson");
  const selectedTopicSegment = useSelectedLayoutSegment("topic");
  const selectedQuizSegment = useSelectedLayoutSegment("quiz");

  const topicsByLesson = useMemo(() => {
    const map = new Map<string, typeof attachedTopics>();
    attachedLessons.forEach((l) => {
      map.set(
        l._id,
        attachedTopics.filter((t) => t.lessonId === l._id),
      );
    });
    return map;
  }, [attachedLessons, attachedTopics]);

  const quizzesByLesson = useMemo(() => {
    const map = new Map<string, typeof attachedQuizzes>();
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
      .map((s: { lessonId: any }) => lessonMap.get(s.lessonId))
      .filter(Boolean);
  }, [course?.courseStructure, lessonMap]);

  console.log("orderedLessons", orderedLessons);

  return (
    <CourseSidebar {...props}>
      {/* <CourseSidebarContent>
        <ul className="space-y-2">
          {orderedLessons.map((lesson) => (
            <li key={lesson!._id}>
              <Link
                href={`/courses/${courseId}/lesson/${lesson!._id}`}
                className={cn(
                  "block rounded-md px-1 py-2 text-sm transition-colors md:px-3",
                  selectedLessonSegment &&
                    selectedLessonSegment === lesson!._id &&
                    !selectedTopicSegment
                    ? "bg-muted font-semibold text-primary"
                    : "hover:bg-accent hover:text-foreground",
                )}
              >
                {lesson!.title}
              </Link>
           
              <ul className="ml-2 mt-1 space-y-1 border-l pl-3 md:ml-4">
                {topicsByLesson.get(lesson!._id)?.map((topic) => (
                  <li key={topic._id}>
                    <Link
                      href={`/courses/${courseId}/lesson/${lesson!._id}/topic/${topic._id}`}
                      className={cn(
                        "block text-sm transition-colors",
                        selectedTopicSegment === topic._id
                          ? "font-semibold text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {topic.title}
                    </Link>
                  </li>
                ))}
                {quizzesByLesson.get(lesson!._id)?.map((quiz) => (
                  <li key={quiz._id}>
                    <Link
                      href={`/courses/${courseId}/lesson/${lesson!._id}/quiz/${quiz._id}`}
                      className={cn(
                        "block text-sm transition-colors",
                        selectedQuizSegment === quiz._id
                          ? "font-semibold text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Quiz: {quiz.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </CourseSidebarContent> */}
      <CourseSidebarContent>
        <CourseSidebarGroup>
          <CourseSidebarMenu>
            {orderedLessons.map((lesson) => (
              <CourseSidebarMenuItem key={lesson?.title}>
                <CourseSidebarMenuButton asChild>
                  <a href={lesson?.url} className="font-medium">
                    {lesson?.title}
                  </a>
                </CourseSidebarMenuButton>
                {topicsByLesson.get(lesson!._id)?.length ? (
                  <CourseSidebarMenuSub>
                    {topicsByLesson.get(lesson!._id)?.map((topic) => (
                      <CourseSidebarMenuSubItem key={topic._id}>
                        <CourseSidebarMenuSubButton
                          asChild
                          isActive={topic.isActive}
                        >
                          <a href={topic.url}>{topic.title}</a>
                        </CourseSidebarMenuSubButton>
                      </CourseSidebarMenuSubItem>
                    ))}
                  </CourseSidebarMenuSub>
                ) : null}
                {quizzesByLesson.get(lesson!._id)?.length ? (
                  <CourseSidebarMenuSub>
                    {quizzesByLesson.get(lesson!._id)?.map((quiz) => (
                      <CourseSidebarMenuSubItem key={quiz.title}>
                        <CourseSidebarMenuSubButton
                          asChild
                          isActive={quiz.isActive}
                        >
                          <a href={quiz.url}>Quiz: {quiz.title}</a>
                        </CourseSidebarMenuSubButton>
                      </CourseSidebarMenuSubItem>
                    ))}
                  </CourseSidebarMenuSub>
                ) : null}
              </CourseSidebarMenuItem>
            ))}
          </CourseSidebarMenu>
        </CourseSidebarGroup>
      </CourseSidebarContent>
      <CourseSidebarRail />
    </CourseSidebar>
  );
}
