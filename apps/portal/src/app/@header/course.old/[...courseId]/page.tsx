"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BookOpen, LayoutDashboard, TerminalSquare } from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";

import { useLearndash } from "~/app/hooks/useLearndash";

interface Lesson {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
  siblings?: {
    nodes: Lesson[];
  };
}

export default function CourseSidebar() {
  const params = useParams();

  // Unwrap params with React.use()
  const unwrappedParams = React.use(params);
  const courseId = unwrappedParams.courseId as string;

  const { useCourse } = useLearndash();
  const { course, isLoading } = useCourse(courseId);

  const navItems = [
    {
      title: "Dashboard",
      url: `/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "All Courses",
      url: `/courses`,
      icon: TerminalSquare,
    },
    {
      title: course?.title ?? "Loading...",
      url: `/course/${courseId}`,
      icon: TerminalSquare,
      isActive: true,
      items:
        course?.siblings?.nodes.map((lesson: Lesson) => ({
          title: lesson.title,
          url: `/course/${courseId}/${lesson.id}`,
        })) ?? [],
    },
    {
      title: "Templates & Downloads",
      url: "/downloads",
      icon: BookOpen,
    },
  ];

  return (
    <div className="px-2 py-2">
      <NavMain items={navItems} />
    </div>
  );
}
