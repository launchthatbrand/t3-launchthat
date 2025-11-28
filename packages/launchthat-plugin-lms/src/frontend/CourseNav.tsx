"use client";

import type { LmsBuilderQuiz, LmsBuilderTopic } from "../types";

import { BookOpen } from "lucide-react";
import type { Id } from "../lib/convexId";
import type { LucideIcon } from "lucide-react";
import type { NavItem } from "@acme/ui/general/nav-main";
import { NavMain } from "@acme/ui/general/nav-main";
import { api } from "@portal/convexspec";
import { useMemo } from "react";
import { useQuery } from "convex/react";

type ChildNavItem = { title: string; url: string };

type CourseStructureArgs =
  | {
      courseId: Id<"posts">;
      organizationId?: Id<"organizations">;
    }
  | {
      courseSlug: string;
      organizationId?: Id<"organizations">;
    }
  | "skip";

interface CourseNavProps {
  courseId?: Id<"posts">;
  courseSlug?: string;
  organizationId?: Id<"organizations">;
  icon?: LucideIcon;
}

export function CourseNav({
  courseId,
  courseSlug,
  organizationId,
  icon = BookOpen,
}: CourseNavProps) {
  const courseStructureArgs = useMemo<CourseStructureArgs>(() => {
    if (courseId) {
      return {
        courseId,
        organizationId,
      };
    }
    if (courseSlug) {
      return {
        courseSlug,
        organizationId,
      };
    }
    return "skip";
  }, [courseId, courseSlug, organizationId]);
  console.log("courseStructureArgs", courseStructureArgs);

  const courseStructure = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    courseStructureArgs === "skip" ? "skip" : (courseStructureArgs as any),
  );

  const navSections = useMemo(() => {
    if (!courseStructure || courseStructure === null) {
      return [];
    }

    const derivedSlug =
      (() => {
        if (courseSlug) return courseSlug;
        if (courseStructure.course && typeof courseStructure.course === "object") {
          if (courseStructure.course.slug) return courseStructure.course.slug;
          if (courseStructure.course._id) return courseStructure.course._id as string;
        }
        return "";
      })();

    const baseUrl = `/course/${derivedSlug}`;

    const attachedTopics = (courseStructure.attachedTopics ??
      []) as LmsBuilderTopic[];
    const attachedQuizzes = (courseStructure.attachedQuizzes ??
      []) as LmsBuilderQuiz[];

    const sections = courseStructure.attachedLessons.map((lesson) => {
      const lessonUrl = `${baseUrl}/lesson/${lesson.slug ?? lesson._id}`;
      const childItems: ChildNavItem[] = [];

      const topics = attachedTopics.filter(
        (topic) => topic.lessonId === lesson._id,
      );

      topics.forEach((topic) => {
        childItems.push({
          title: topic.title ?? "Untitled topic",
          url: `${lessonUrl}/topic/${topic.slug ?? topic._id}`,
        });

        const topicQuizzes = attachedQuizzes.filter(
          (quiz) => quiz.topicId === topic._id,
        );

        topicQuizzes.forEach((quiz) => {
          childItems.push({
            title: quiz.title ?? "Untitled quiz",
            url: `${lessonUrl}/topic/${topic.slug ?? topic._id}/quiz/${quiz.slug ?? quiz._id}`,
          });
        });
      });

      const lessonQuizzes = attachedQuizzes.filter(
        (quiz) => quiz.lessonId === lesson._id && !quiz.topicId,
      );

      lessonQuizzes.forEach((quiz) => {
        childItems.push({
          title: quiz.title ?? "Untitled quiz",
          url: `${lessonUrl}/quiz/${quiz.slug ?? quiz._id}`,
        });
      });

      return {
        title: lesson.title ?? "Untitled lesson",
        url: lessonUrl,
        icon,
        items: childItems,
      } as NavItem;
    });

    return [{ label: "Course Outline", items: sections }];
  }, [courseStructure, courseSlug, icon]);

  if (!navSections.length) {
    return null;
  }

  return <NavMain sections={navSections} />;
}
