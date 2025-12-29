"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
    return (
      <div className="text-muted-foreground py-12 text-center">
        {loadingLabel}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex flex-1 py-10">
      <div className="container space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground text-sm tracking-wider uppercase">
              Learn with confidence
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">
              Curated courses for every stage of your learning journey.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:w-64"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <Card
                key={cardKey}
                className="group border-border/80 bg-background flex h-full flex-col shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={derivedHref} className="flex h-full flex-col">
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs uppercase">
                        Course
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        Updated recently
                      </span>
                    </div>
                    <CardTitle className="text-xl leading-tight font-semibold">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground flex-1 space-y-4 text-sm">
                    <p className="line-clamp-3">
                      {course.description ?? "No description available."}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {["Self paced", "Certificate", "On demand"].map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="rounded-full px-3 py-1"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-border/60 border-t">
                    <div className="flex w-full items-center justify-between pt-3 text-sm font-medium">
                      <span>View details</span>
                      <span className="text-primary">Get started →</span>
                    </div>
                  </CardFooter>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CoursesArchive;
