"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { EntityList } from "~/components/shared/EntityList/EntityList";
import {
  ColumnDefinition,
  ViewMode,
} from "~/components/shared/EntityList/types";
import { useCourseAccordionStore } from "~/store/courseAccordionStore";

export default function CourseLandingPage() {
  const params = useParams();
  const courseId = params.courseId as Id<"courses">;

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId,
  });

  // Zustand store for accordion state
  const {
    expandedLessons,
    toggleLesson,
    expandedTopics,
    toggleTopic,
    expandedQuizzes,
    toggleQuiz,
  } = useCourseAccordionStore();

  if (data === undefined) return <div>Loading course dashboard...</div>;
  if (data === null) return <div>Course not found.</div>;

  const { course, attachedLessons, attachedTopics, attachedQuizzes } = data;

  const topicColumns: ColumnDefinition<Doc<"topics">>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: (topic) => <div>{topic.title}</div>,
    },
    {
      id: "featuredImage",
      header: "Featured Image",
      accessorKey: "featuredImage",
      cell: (topic) =>
        topic.featuredImage ? (
          <Image
            src={topic.featuredImage}
            alt={topic.title}
            width={100}
            height={100}
            className="w-full rounded-md"
          />
        ) : (
          <Image
            src="https://placehold.co/600x400.png"
            alt="Placeholder"
            width={100}
            height={100}
            className="w-full rounded-md"
          />
        ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <h2 className="mb-4 text-2xl font-bold">Course Content</h2>
      {course.courseStructure && course.courseStructure.length > 0 ? (
        <Accordion
          type="multiple"
          className="w-full"
          value={expandedLessons}
          onValueChange={(values: string[]) => toggleLesson(values[0])} // This will need refinement for multiple
        >
          {course.courseStructure.map((item) => {
            if (item.lessonId) {
              const lesson = attachedLessons.find(
                (l) => l._id === item.lessonId,
              );
              if (!lesson) return null; // Should not happen if data is consistent

              const lessonTopics = attachedTopics.filter(
                (topic) => topic.lessonId === lesson._id,
              );
              const lessonQuizzes = attachedQuizzes.filter(
                (quiz) => quiz.lessonId === lesson._id,
              );

              return (
                <AccordionItem key={lesson._id} value={lesson._id}>
                  <AccordionTrigger className="justify-between gap-10 text-xl font-semibold">
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        {lesson.title}
                        <Badge variant="secondary" className="ml-2">
                          Lesson
                        </Badge>
                      </div>
                      <Button asChild>
                        <Link
                          href={`/courses/${courseId}/lesson/${lesson._id}`}
                          className="z-100 text-primary"
                        >
                          View Lesson
                        </Link>
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-muted/50 p-4">
                      <p className="mb-4 text-muted-foreground">
                        {lesson.excerpt}
                      </p>

                      {(lessonTopics.length > 0 ||
                        lessonQuizzes.length > 0) && (
                        <div className="mt-3">
                          <Accordion
                            type="multiple"
                            className="flex w-full flex-col gap-3 pl-4"
                            value={expandedTopics}
                            onValueChange={(values: string[]) =>
                              toggleTopic(values[0])
                            }
                          >
                            <EntityList
                              data={lessonTopics}
                              columns={topicColumns}
                              mode="default"
                              gridColumns={{
                                sm: 1,
                                md: 2,
                                lg: 2,
                                xl: 2,
                              }}
                              enableSearch={false}
                              enableFilters={false}
                              viewModes={["grid"] as ViewMode[]}
                              defaultViewMode="grid"
                              title="Lesson Topics"
                              itemRender={(item) => {
                                return (
                                  <Card className="p-0">
                                    <CardHeader className="p-2">
                                      <CardTitle>{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                      <Image
                                        src={
                                          item.featuredImage &&
                                          item.featuredImage !== ""
                                            ? item.featuredImage
                                            : "https://placehold.co/600x400.png"
                                        }
                                        alt={item.title}
                                        width={1000}
                                        height={0}
                                        className="w-full"
                                      />
                                    </CardContent>
                                  </Card>
                                );
                              }}
                            />
                            {lessonQuizzes.map((quiz) => (
                              <AccordionItem key={quiz._id} value={quiz._id}>
                                <AccordionTrigger className="text-base font-medium">
                                  {quiz.title}
                                  <Badge variant="outline" className="ml-2">
                                    Quiz
                                  </Badge>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="p-3">
                                    <p className="mb-3 text-muted-foreground">
                                      {quiz.description}
                                    </p>
                                    <Link
                                      href={`/courses/${courseId}/lesson/${lesson._id}/quiz/${quiz._id}`}
                                      className="text-primary underline"
                                    >
                                      View Quiz
                                    </Link>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }
            return null;
          })}
        </Accordion>
      ) : (
        <p>No content available for this course yet.</p>
      )}
    </div>
  );
}
