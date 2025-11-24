"use client";

import type { CourseSummary } from "launchthat-plugin-lms";
import { api } from "@convex-config/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { CoursesArchive } from "launchthat-plugin-lms";

export default function FrontendCoursesPage() {
  interface LegacyCourse {
    _id: string;
    title: string;
    description?: string | null;
  }

  const courses = usePaginatedQuery(
    api.lms.courses.queries.listCourses,
    {
      isPublished: true,
    },
    {
      initialNumItems: 20,
    },
  );

  const legacyResults = courses.results as LegacyCourse[] | undefined;

  if (!legacyResults) return <div>Loading courses...</div>;
  if (legacyResults.length === 0) return <div>No courses available.</div>;

  const mappedCourses: CourseSummary[] = legacyResults.map((course) => ({
    id: course._id,
    title: course.title,
    description: course.description,
    href: `/courses/${course._id}`,
  }));

  return <CoursesArchive courses={mappedCourses} />;
}
