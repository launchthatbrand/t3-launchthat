"use client";

import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { BookOpen } from "lucide-react";

import type { NavItem } from "@acme/ui/general/nav-main";
import { NavMain } from "@acme/ui/general/nav-main";

import type { Id } from "../lib/convexId";
import type { LmsBuilderCertificate, LmsBuilderQuiz, LmsBuilderTopic } from "../types";

type ChildNavItem = { title: string; url: string };

const sortByOrderThenTitle = <
  T extends { order?: number | null; title?: string | null },
>(
  a: T,
  b: T,
) => {
  const aOrder =
    typeof a.order === "number" && Number.isFinite(a.order)
      ? a.order
      : Number.MAX_SAFE_INTEGER;
  const bOrder =
    typeof b.order === "number" && Number.isFinite(b.order)
      ? b.order
      : Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }
  const aTitle = (a.title ?? "").toLowerCase();
  const bTitle = (b.title ?? "").toLowerCase();
  return aTitle.localeCompare(bTitle);
};

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
  ) as any;

  const navSections = useMemo(() => {
    if (!courseStructure || courseStructure === null) {
      return [];
    }

    const derivedSlug = (() => {
      if (courseSlug) return courseSlug;
      if (
        courseStructure.course &&
        typeof courseStructure.course === "object"
      ) {
        if (courseStructure.course.slug) return courseStructure.course.slug;
        if (courseStructure.course._id)
          return courseStructure.course._id as string;
      }
      return "";
    })();

    const baseUrl = `/course/${derivedSlug}`;
    const buildCertificateSegment = (certificate: { _id: string; slug?: string | null }) =>
      certificate.slug ?? certificate._id;

    const attachedTopics = (courseStructure.attachedTopics ?? []) as
      | LmsBuilderTopic[]
      | any[];
    const attachedQuizzes = (courseStructure.attachedQuizzes ?? []) as
      | LmsBuilderQuiz[]
      | any[];
    const attachedCertificates = (courseStructure.attachedCertificates ?? []) as
      | LmsBuilderCertificate[]
      | any[];
    const certificatesById = new Map(
      attachedCertificates.map((cert) => [String(cert._id), cert] as const),
    );

    const attachedLessons = (courseStructure.attachedLessons ?? []) as any[];
    const sections = attachedLessons.map((lesson: any) => {
      const lessonUrl = `${baseUrl}/lesson/${lesson.slug ?? lesson._id}`;
      const childItems: ChildNavItem[] = [];

      const topics = attachedTopics.filter(
        (topic) => topic.lessonId === lesson._id,
      );
      topics.sort(sortByOrderThenTitle);

      topics.forEach((topic) => {
        childItems.push({
          title: topic.title ?? "Untitled topic",
          url: `${lessonUrl}/topic/${topic.slug ?? topic._id}`,
        });

        const topicQuizzes = attachedQuizzes.filter(
          (quiz) => quiz.topicId === topic._id,
        );
        topicQuizzes.sort(sortByOrderThenTitle);

        topicQuizzes.forEach((quiz) => {
          childItems.push({
            title: quiz.title ?? "Untitled quiz",
            url: `${lessonUrl}/topic/${topic.slug ?? topic._id}/quiz/${quiz.slug ?? quiz._id}`,
          });
        });

        if (topic.certificateId) {
          const cert = certificatesById.get(String(topic.certificateId));
          if (cert) {
            childItems.push({
              title: cert.title ?? "Certificate",
              url: `${lessonUrl}/topic/${topic.slug ?? topic._id}/certificate/${buildCertificateSegment({ _id: cert._id, slug: cert.slug })}`,
            });
          }
        }
      });

      const lessonQuizzes = attachedQuizzes.filter(
        (quiz) => quiz.lessonId === lesson._id && !quiz.topicId,
      );
      lessonQuizzes.sort(sortByOrderThenTitle);

      lessonQuizzes.forEach((quiz) => {
        childItems.push({
          title: quiz.title ?? "Untitled quiz",
          url: `${lessonUrl}/quiz/${quiz.slug ?? quiz._id}`,
        });
      });

      if (lesson.certificateId) {
        const cert = certificatesById.get(String(lesson.certificateId));
        if (cert) {
          childItems.push({
            title: cert.title ?? "Certificate",
            url: `${lessonUrl}/certificate/${buildCertificateSegment({ _id: cert._id, slug: cert.slug })}`,
          });
        }
      }

      return {
        title: lesson.title ?? "Untitled lesson",
        url: lessonUrl,
        icon,
        items: childItems,
      } as NavItem;
    });
    const finalQuizzes = attachedQuizzes.filter(
      (quiz) => !quiz.lessonId && (quiz.isFinal ?? false),
    );
    finalQuizzes.forEach((quiz) => {
      sections.push({
        title: quiz.title ?? "Untitled quiz",
        url: `${baseUrl}/quiz/${quiz.slug ?? quiz._id}`,
        icon,
        items: [],
      });
    });

    if (courseStructure.course?.certificateId) {
      const cert = certificatesById.get(String(courseStructure.course.certificateId));
      if (cert) {
        sections.push({
          title: cert.title ?? "Certificate",
          url: `${baseUrl}/certificate/${buildCertificateSegment({ _id: cert._id, slug: cert.slug })}`,
          icon,
          items: [],
        });
      }
    }
    return [{ label: "Course Outline", items: sections }];
  }, [courseStructure, courseSlug, icon]);

  if (!navSections.length) {
    return null;
  }

  return <NavMain sections={navSections} labelBehavior="ticker" />;
}
