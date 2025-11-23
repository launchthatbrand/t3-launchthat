"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { CourseBuilderScreen } from "../screens/CourseBuilderScreen";
import type { Id } from "../lib/convexId";
import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";

export const CourseBuilderTab = ({
  postId,
  organizationId,
}: PluginSingleViewComponentProps) => {
  const normalizedOrganizationId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;
  if (!postId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save required</CardTitle>
          <CardDescription>
            Save this course entry first, then reopen the Builder tab to set up
            lessons.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
      <CourseBuilderScreen
        courseId={postId as Id<"posts">}
        organizationId={normalizedOrganizationId}
      />
  );
};

