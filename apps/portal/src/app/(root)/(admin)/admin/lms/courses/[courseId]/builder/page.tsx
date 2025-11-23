"use client";

import { CourseBuilderScreen } from "launchthat-plugin-lms";
import type { Id } from "@convex-config/_generated/dataModel";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { useTenant } from "~/context/TenantContext";

interface CourseBuilderRouteProps {
  params: { courseId: string };
}

export default function CourseBuilderRoute({
  params,
}: CourseBuilderRouteProps) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  return (
    <CourseBuilderScreen
      courseId={params.courseId as Id<"posts">}
      organizationId={organizationId ?? undefined}
    />
  );
}
