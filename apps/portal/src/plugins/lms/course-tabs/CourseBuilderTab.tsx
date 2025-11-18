"use client";

import type { Id } from "@convex-config/_generated/dataModel";

import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import type { PluginSingleViewComponentProps } from "~/lib/plugins/types";
import { CourseBuilderScreen } from "~/plugins/lms/screens/CourseBuilderScreen";

export function CourseBuilderTab({ postId }: PluginSingleViewComponentProps) {
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

  return <CourseBuilderScreen courseId={postId as Id<"posts">} />;
}
