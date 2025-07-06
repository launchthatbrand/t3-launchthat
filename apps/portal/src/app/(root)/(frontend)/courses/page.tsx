"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

export default function FrontendCoursesPage() {
  const [search, setSearch] = useState("");

  const courses = useQuery(api.lms.courses.queries.listPublishedCourses, {
    searchTitle: search.length ? search : undefined,
  });

  if (courses === undefined) return <div>Loading courses...</div>;
  if (courses.length === 0) return <div>No courses available.</div>;

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Courses</h1>
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <Card key={course._id} className="transition-shadow hover:shadow-lg">
            <Link href={`/courses/${course._id}`} className="block h-full">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {course.description ?? "No description"}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
