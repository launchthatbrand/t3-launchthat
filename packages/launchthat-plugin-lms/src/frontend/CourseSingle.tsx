"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { ClipboardList, Layers, PlayCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import type { Id } from "../lib/convexId";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsPostId,
} from "../types";
import type { StructuredLessonEntry } from "./components/CourseStructure";
import { CourseStructure } from "./components/CourseStructure";

interface CourseSingleProps {
  courseId: LmsPostId;
  courseSlug?: string | null;
  organizationId?: Id<"organizations">;
}

export function CourseSingle({
  courseId,
  courseSlug,
  organizationId,
}: CourseSingleProps) {
  const searchParams = useSearchParams();
  const taxonomyParam = (searchParams.get("taxonomy") ?? "")
    .trim()
    .toLowerCase();
  const categoryParam = (searchParams.get("category") ?? "")
    .trim()
    .toLowerCase();
  const tagParam = (searchParams.get("tag") ?? "").trim().toLowerCase();
  const taxonomyFilter = useMemo(() => {
    if (!taxonomyParam) return null;
    if (taxonomyParam === "category" || taxonomyParam === "categories") {
      return {
        taxonomySlug: "category",
        termSlug: categoryParam,
        label: "Category",
      };
    }
    if (
      taxonomyParam === "tag" ||
      taxonomyParam === "post_tag" ||
      taxonomyParam === "tags"
    ) {
      return {
        taxonomySlug: "post_tag",
        termSlug: tagParam,
        label: "Tag",
      };
    }
    return null;
  }, [taxonomyParam, categoryParam, tagParam]);

  const data = useQuery(
    api.plugins.lms.queries.getCourseStructureWithItems,
    organizationId
      ? { courseId, organizationId }
      : {
          courseId,
        },
  );
  const isLoading = data === undefined;
  const isMissing = data === null;

  const recordContentAccess = useMutation(api.plugins.lms.mutations.recordContentAccess);
  const hasRecordedAccessRef = useRef(false);
  useEffect(() => {
    if (hasRecordedAccessRef.current) return;
    if (isLoading || isMissing) return;
    hasRecordedAccessRef.current = true;
    void recordContentAccess({
      courseId,
      accessedType: "course",
      accessedId: courseId,
    });
  }, [courseId, isLoading, isMissing, recordContentAccess]);

  const fallbackCourse: LmsCourseBuilderData["course"] = {
    _id: courseId,
    slug: courseSlug ?? undefined,
    title: "Course",
    excerpt: "",
    status: undefined,
    firstAttachmentUrl: undefined,
    courseStructure: [],
  };

  const course = (data?.course ??
    fallbackCourse) as LmsCourseBuilderData["course"];
  const resolvedOrganizationId =
    organizationId ??
    ((data?.course as unknown as { organizationId?: unknown })
      ?.organizationId as Id<"organizations"> | undefined);
  const attachedLessons = data?.attachedLessons ?? [];
  const attachedTopics = data?.attachedTopics ?? [];
  const attachedQuizzes = data?.attachedQuizzes ?? [];
  const attachedCertificates = data?.attachedCertificates ?? [];

  const baseCoursePath = `/course/${courseSlug ?? course._id}`;

  const availableTerms = useQuery(
    api.core.taxonomies.queries.listTermsByTaxonomy,
    taxonomyFilter && resolvedOrganizationId
      ? {
          taxonomySlug: taxonomyFilter.taxonomySlug,
          organizationId:
            resolvedOrganizationId as unknown as Id<"organizations">,
        }
      : "skip",
  ) as
    | Array<{
        _id: string;
        name: string;
        slug: string;
      }>
    | undefined;

  const activeTerm = useMemo(() => {
    if (!taxonomyFilter?.termSlug) {
      return undefined;
    }
    if (!availableTerms) {
      return undefined;
    }
    const found = availableTerms.find(
      (term) => term.slug.toLowerCase() === taxonomyFilter.termSlug,
    );
    return found ?? null;
  }, [availableTerms, taxonomyFilter?.termSlug]);

  const assignments = useQuery(
    api.core.taxonomies.queries.listAssignmentsByTerm,
    activeTerm && resolvedOrganizationId
      ? {
          organizationId:
            resolvedOrganizationId as unknown as Id<"organizations">,
          termId: activeTerm._id as any,
        }
      : "skip",
  ) as Array<{ objectId: string; postTypeSlug: string }> | undefined;

  const idsInCourse = useMemo(() => {
    const ids = new Set<string>();
    attachedLessons.forEach((lesson) => ids.add(String(lesson._id)));
    attachedTopics.forEach((topic) => ids.add(String(topic._id)));
    attachedQuizzes.forEach((quiz) => ids.add(String(quiz._id)));
    attachedCertificates.forEach((cert) => ids.add(String(cert._id)));
    return ids;
  }, [attachedLessons, attachedTopics, attachedQuizzes, attachedCertificates]);

  const filteredIdsByType = useMemo(() => {
    if (!taxonomyFilter) return null;
    if (!activeTerm) return null;
    const map = new Map<string, Set<string>>();
    (assignments ?? []).forEach((row) => {
      const objectId = String(row.objectId);
      if (!idsInCourse.has(objectId)) return;
      const slug = String(row.postTypeSlug ?? "").toLowerCase();
      if (!slug) return;
      const set = map.get(slug) ?? new Set<string>();
      set.add(objectId);
      map.set(slug, set);
    });
    return map;
  }, [taxonomyFilter, activeTerm, assignments, idsInCourse]);

  const lessonsById = useMemo(() => {
    const map = new Map<string, LmsBuilderLesson>();
    attachedLessons.forEach((lesson) => map.set(String(lesson._id), lesson));
    return map;
  }, [attachedLessons]);

  const topicsById = useMemo(() => {
    const map = new Map<string, LmsBuilderTopic>();
    attachedTopics.forEach((topic) => map.set(String(topic._id), topic));
    return map;
  }, [attachedTopics]);

  const lessons = useMemo(() => {
    return course.courseStructure
      .map((item) =>
        attachedLessons.find((lesson) => lesson._id === item.lessonId),
      )
      .filter(Boolean) as LmsBuilderLesson[];
  }, [course.courseStructure, attachedLessons]);

  const topicsByLesson = useMemo(() => {
    const map = new Map<string, LmsBuilderTopic[]>();
    for (const topic of attachedTopics) {
      if (!topic.lessonId) continue;
      const list = map.get(topic.lessonId) ?? [];
      list.push(topic);
      map.set(topic.lessonId, list);
    }
    return map;
  }, [attachedTopics]);

  const quizzesByLesson = useMemo(() => {
    const map = new Map<string, LmsBuilderQuiz[]>();
    for (const quiz of attachedQuizzes) {
      if (!quiz.lessonId) continue;
      const list = map.get(quiz.lessonId) ?? [];
      list.push(quiz);
      map.set(quiz.lessonId, list);
    }
    return map;
  }, [attachedQuizzes]);

  const totalTopics = lessons.reduce((sum, lesson) => {
    const lessonTopics = topicsByLesson.get(lesson._id) ?? [];
    return sum + lessonTopics.length;
  }, 0);

  const totalQuizzes = lessons.reduce((sum, lesson) => {
    const lessonQuizzes = quizzesByLesson.get(lesson._id) ?? [];
    return sum + lessonQuizzes.length;
  }, 0);

  const structuredLessons = useMemo<StructuredLessonEntry[]>(() => {
    return course.courseStructure
      .map((item) => {
        const lesson = attachedLessons.find((l) => l._id === item.lessonId);
        if (!lesson) {
          return null;
        }

        const lessonTopics = [...(topicsByLesson.get(lesson._id) ?? [])].sort(
          sortByOrderThenTitle,
        );
        const lessonQuizzes = [...(quizzesByLesson.get(lesson._id) ?? [])].sort(
          sortByOrderThenTitle,
        );

        return {
          lesson,
          topics: lessonTopics,
          quizzes: lessonQuizzes,
        };
      })
      .filter(Boolean) as StructuredLessonEntry[];
  }, [
    course.courseStructure,
    attachedLessons,
    topicsByLesson,
    quizzesByLesson,
  ]);

  const standaloneQuizzes = useMemo(
    () =>
      attachedQuizzes
        .filter((quiz) => !quiz.lessonId)
        .map((quiz) => ({ ...quiz }))
        .sort(sortByOrderThenTitle),
    [attachedQuizzes],
  );

  const isFiltering = Boolean(taxonomyFilter && taxonomyFilter.termSlug);
  const isFilterLoading =
    isFiltering &&
    (!resolvedOrganizationId ||
      activeTerm === undefined ||
      (activeTerm && assignments === undefined));
  const inCourseAssignmentCount = useMemo(() => {
    if (!filteredIdsByType) return 0;
    let count = 0;
    for (const set of filteredIdsByType.values()) {
      count += set.size;
    }
    return count;
  }, [filteredIdsByType]);

  if (isLoading) {
    return (
      <div className="container space-y-4 py-16">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isMissing) {
    return (
      <div className="text-muted-foreground container py-16 text-center">
        Course not found.
      </div>
    );
  }

  return (
    <div className="from-muted/50 space-y-10 bg-linear-to-b via-transparent to-transparent py-10">
      <div className="container space-y-20">
        <header className="bg-background/90 rounded-3xl p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full">
                  Course
                </Badge>
                <span className="text-muted-foreground text-sm">
                  Updated recently
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                {course.title}
              </h1>
              {course.excerpt && (
                <p className="text-muted-foreground mt-3 text-lg">
                  {course.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Layers className="size-4" aria-hidden="true" />
                  <span className="text-foreground font-medium tabular-nums">
                    {lessons.length}
                  </span>
                  <span>Lessons</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <PlayCircle className="size-4" aria-hidden="true" />
                  <span className="text-foreground font-medium tabular-nums">
                    {totalTopics}
                  </span>
                  <span>Topics</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <ClipboardList className="size-4" aria-hidden="true" />
                  <span className="text-foreground font-medium tabular-nums">
                    {totalQuizzes}
                  </span>
                  <span>Quizzes</span>
                </div>
              </div>
            </div>

            {course.firstAttachmentUrl ? (
              <div className="bg-muted/40 relative overflow-hidden rounded-2xl border">
                <div className="aspect-16/10 w-full">
                  <img
                    src={course.firstAttachmentUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {isFiltering ? (
          <section className="container space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">
                    {taxonomyFilter?.label}: {taxonomyFilter?.termSlug}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Showing entries in this course tagged with this{" "}
                    {taxonomyFilter?.label?.toLowerCase()}.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={baseCoursePath}>Clear filter</Link>
                </Button>
              </div>
              {isFilterLoading ? (
                <p className="text-muted-foreground text-sm">
                  Loading filtered results…
                </p>
              ) : activeTerm === null ? (
                <p className="text-muted-foreground text-sm">Term not found.</p>
              ) : !isFilterLoading &&
                activeTerm &&
                inCourseAssignmentCount === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No items in this course match this filter.
                </p>
              ) : null}
            </div>

            <div className="space-y-10">
              {renderCourseTaxonomySection({
                title: "Lessons",
                items: attachedLessons.filter((lesson) =>
                  filteredIdsByType?.get("lessons")?.has(String(lesson._id)),
                ),
                getHref: (lesson) =>
                  `${baseCoursePath}/lesson/${lesson.slug ?? lesson._id}`,
              })}

              {renderCourseTaxonomySection({
                title: "Topics",
                items: attachedTopics.filter((topic) =>
                  filteredIdsByType?.get("topics")?.has(String(topic._id)),
                ),
                getHref: (topic) => {
                  const lesson = topic.lessonId
                    ? lessonsById.get(String(topic.lessonId))
                    : undefined;
                  const lessonPath = lesson
                    ? `${baseCoursePath}/lesson/${lesson.slug ?? lesson._id}`
                    : baseCoursePath;
                  return `${lessonPath}/topic/${topic.slug ?? topic._id}`;
                },
              })}

              {renderCourseTaxonomySection({
                title: "Quizzes",
                items: attachedQuizzes.filter((quiz) =>
                  filteredIdsByType?.get("quizzes")?.has(String(quiz._id)),
                ),
                getHref: (quiz) => {
                  const lesson = quiz.lessonId
                    ? lessonsById.get(String(quiz.lessonId))
                    : undefined;
                  const topic = quiz.topicId
                    ? topicsById.get(String(quiz.topicId))
                    : undefined;
                  const lessonPath = lesson
                    ? `${baseCoursePath}/lesson/${lesson.slug ?? lesson._id}`
                    : baseCoursePath;
                  if (topic) {
                    return `${lessonPath}/topic/${topic.slug ?? topic._id}/quiz/${quiz.slug ?? quiz._id}`;
                  }
                  return `${lessonPath}/quiz/${quiz.slug ?? quiz._id}`;
                },
              })}

              {renderCourseTaxonomySection({
                title: "Certificates",
                items: attachedCertificates.filter((cert) =>
                  filteredIdsByType?.get("certificates")?.has(String(cert._id)),
                ),
                getHref: (cert) =>
                  `${baseCoursePath}/certificate/${cert.slug ?? cert._id}`,
              })}
            </div>
          </section>
        ) : structuredLessons.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center">
              This course does not have any lessons yet.
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Course outline</h2>
              <p className="text-muted-foreground text-sm">
                Lessons display their topics and quizzes following the structure
                you defined in the course builder.
              </p>
            </div>
            <CourseStructure
              lessons={structuredLessons}
              standaloneQuizzes={standaloneQuizzes}
              baseCoursePath={baseCoursePath}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function renderCourseTaxonomySection<
  T extends {
    _id: string;
    title: string;
    excerpt?: string;
    slug?: string | null;
  },
>(args: { title: string; items: T[]; getHref: (item: T) => string }) {
  // Note: course pages can include draft items in the outline (e.g. course builder previews),
  // so the in-course taxonomy filter should match that behavior and NOT drop drafts.
  const items = args.items ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-2xl font-semibold">{args.title}</h3>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={String(item._id)}
            className="bg-background rounded-2xl border p-6 shadow-sm transition hover:shadow-md"
          >
            <Link href={args.getHref(item)} className="space-y-3">
              <h4 className="text-lg font-semibold">{item.title}</h4>
              {item.excerpt ? (
                <p className="text-muted-foreground text-sm">{item.excerpt}</p>
              ) : null}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function sortByOrderThenTitle<
  T extends { order?: number | null; title: string },
>(a: T, b: T) {
  const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder === bOrder) {
    return a.title.localeCompare(b.title);
  }
  return aOrder - bOrder;
}
