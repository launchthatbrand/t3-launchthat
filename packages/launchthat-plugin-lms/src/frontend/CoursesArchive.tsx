"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

export type CourseSummary = {
  id?: string;
  slug?: string;
  title: string;
  description?: string | null;
  href?: string;
};

export interface CoursesArchiveProps {
  courses: CourseSummary[];
  title?: string;
  searchPlaceholder?: string;
  loadingLabel?: string;
  emptyLabel?: string;
}

export function CoursesArchive({
  courses,
  title = "Courses",
  searchPlaceholder = "Search courses...",
  loadingLabel = "Loading courses...",
  emptyLabel = "No courses available.",
}: CoursesArchiveProps) {
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return courses;
    }

    return courses.filter((course) => {
      const inTitle = course.title.toLowerCase().includes(query);
      const inDescription = (course.description ?? "")
        .toLowerCase()
        .includes(query);
      return inTitle || inDescription;
    });
  }, [courses, search]);

  if (!courses) {
    return <div>{loadingLabel}</div>;
  }

  if (courses.length === 0) {
    return <div>{emptyLabel}</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="mb-6 max-w-md">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {filteredCourses.map((course, index) => {
          const derivedHref =
            course.href ??
            (course.slug
              ? `/course/${course.slug}`
              : course.id
                ? `/course/${course.id}`
                : "/courses");
          const cardKey =
            course.id ??
            course.slug ??
            course.href ??
            `${course.title}-${index}`;

          return (
            <Card key={cardKey} className="transition-shadow hover:shadow-lg">
              <Link href={derivedHref} className="block h-full">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {course.description ?? "No description available."}
                  </p>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default CoursesArchive;
