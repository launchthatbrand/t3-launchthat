"use client";

import React from "react";
import Link from "next/link";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { DashboardMetricCard } from "~/components/admin/DashboardMetricCard";

export const LmsDashboardMetaBox = ({
  organizationId,
}: {
  organizationId: Id<"organizations">;
}) => {
  // LMS wrappers are partially `any`-typed; keep query reference localized.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = api as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const getDashboardSummaryQuery = apiAny.plugins.lms.queries.getDashboardSummary;

  const data = useQuery(getDashboardSummaryQuery, {
    organizationId: String(organizationId),
  }) as
    | {
        courseCount: number;
        publishedCourseCount: number;
        enrollmentCount: number;
        activeEnrollmentCount: number;
        coursesCountedForEnrollments: number;
        enrollmentsTruncated: boolean;
      }
    | undefined;

  const enrollmentTotalLabel = data ? String(data.enrollmentCount) : "—";
  const enrollmentCountedCoursesLabel = data
    ? String(data.coursesCountedForEnrollments)
    : "0";
  const isEnrollmentsTruncated = data?.enrollmentsTruncated === true;
  const enrollmentSubtitle =
    isEnrollmentsTruncated
      ? `${enrollmentTotalLabel} total (counted first ${enrollmentCountedCoursesLabel} courses)`
      : `${enrollmentTotalLabel} total`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <DashboardMetricCard
          title="Courses"
          value={data?.courseCount ?? "—"}
          subtitle={`${data?.publishedCourseCount ?? "—"} published`}
        />
        <DashboardMetricCard
          title="Enrollments"
          value={data?.activeEnrollmentCount ?? "—"}
          subtitle={enrollmentSubtitle}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/edit?post_type=courses">Manage courses</Link>
        </Button>
      </div>
    </div>
  );
};


