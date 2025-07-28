"use client";

import { Id } from "@convex-config/_generated/dataModel";
import { LinkedProduct } from "~/components/admin/LinkedProduct";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

export default function LinkedProductPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  // Get current course data to check for existing productId
  const course = useQuery(api.lms.courses.queries.getCourse, {
    courseId: courseId as Id<"courses">,
  });

  if (!course) {
    return <div>Loading course...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Linked Product</h2>
        <p className="text-muted-foreground">
          Link this course to a product to enable purchase functionality and
          access control.
        </p>
      </div>

      <LinkedProduct
        contentType="course"
        contentId={courseId}
        currentProductId={course.productId}
      />
    </div>
  );
}
