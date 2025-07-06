"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

export default function CourseLandingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string | undefined;

  const data = useQuery(
    api.lms.courses.queries.getCourseStructureWithItems,
    courseId ? { courseId } : "skip",
  );

  // When data is ready, redirect to first lesson automatically
  useEffect(() => {
    if (!data || data === undefined || data === null) return;
    const firstLessonId = data.course.courseStructure?.[0]?.lessonId;
    if (firstLessonId) {
      router.replace(`/courses/${courseId}/lesson/${firstLessonId}`);
    }
  }, [data, courseId, router]);

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  return <div>Select a lesson from the sidebar.</div>;
}
