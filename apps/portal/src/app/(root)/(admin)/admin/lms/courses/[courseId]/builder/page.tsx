"use client";

import type { Id } from "@convex-config/_generated/dataModel";

import { CourseBuilderScreen } from "~/plugins/lms/screens/CourseBuilderScreen";

interface CourseBuilderRouteProps {
  params: { courseId: string };
}

export default function CourseBuilderRoute({
  params,
}: CourseBuilderRouteProps) {
  return <CourseBuilderScreen courseId={params.courseId as Id<"posts">} />;
}
