"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";

interface CourseAdminLayoutProps {
  children: ReactNode;
}

export default function CourseAdminLayout({
  children,
}: CourseAdminLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const courseId = params.courseId as string | undefined;

  const baseUrl = `/admin/courses/${courseId ?? ""}`;

  // Always call the hook; when courseId is undefined we pass "skip" so the query is not executed
  const course = useQuery(
    api.lms.courses.queries.getCourseMetadata,
    courseId ? { courseId: courseId as Id<"courses"> } : "skip",
  );

  if (!courseId) {
    return <div className="container py-6">Invalid course id</div>;
  }

  if (course === undefined) {
    return <div className="container py-6">Loading course...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Heading & Tabs */}
      <h1 className="mb-2 text-3xl font-bold">{course?.title}</h1>
      <Button variant="outline" size="icon" asChild className="w-auto p-2">
        <Link href="/admin/courses" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Courses
        </Link>
      </Button>

      <div className="mb-8 border-b">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <Link
            href={`${baseUrl}/edit`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/edit`) || pathname === baseUrl ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Edit
          </Link>
          <Link
            href={`${baseUrl}/builder`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/builder`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Builder
          </Link>
          <Link
            href={`${baseUrl}/members`}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/members`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
          >
            Members
          </Link>
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
