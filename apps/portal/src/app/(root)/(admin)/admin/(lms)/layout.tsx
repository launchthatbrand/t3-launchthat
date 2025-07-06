"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CoursesLayoutProps {
  children: ReactNode;
}

export default function CoursesLayout({ children }: CoursesLayoutProps) {
  const pathname = usePathname();
  const baseUrl = "/admin";

  // Determine if we are on an archive (list) page or a nested detail page
  const segments = pathname.split("/").filter(Boolean); // remove empty strings
  // segments example: ["admin", "courses"] or ["admin", "courses", "123"]
  const isArchivePage = segments.length === 2; // admin + entity

  return (
    <div className="container py-6">
      {isArchivePage && (
        <>
          {/* Heading & Tabs */}
          <h1 className="mb-4 text-3xl font-bold">Courses</h1>

          <div className="mb-8 border-b">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <Link
                href={`${baseUrl}/courses`}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname === `${baseUrl}/courses` ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
              >
                Courses
              </Link>
              <Link
                href={`${baseUrl}/lessons`}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/lessons`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
              >
                Lessons
              </Link>
              <Link
                href={`${baseUrl}/topics`}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/topics`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
              >
                Topics
              </Link>
              <Link
                href={`${baseUrl}/quizzes`}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${pathname.startsWith(`${baseUrl}/quizzes`) ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
              >
                Quizzes
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* Page content */}
      {children}
    </div>
  );
}
