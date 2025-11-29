/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import type { Lesson } from "@convex-config/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import type { LessonFormValues } from "~/app/(root)/(admin)/admin/lessons/_components/LessonForm";
import type {
  ColumnDefinition,
  EntityListItem,
} from "@acme/ui/entity-list/types";
import LessonForm from "~/app/(root)/(admin)/admin/lessons/_components/LessonForm";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { EntityListView } from "@acme/ui/entity-list/EntityListView";
import LessonSidebar from "./_components/LessonSidebar";

type Topic = Doc<"topics">;

const lessonColumns: ColumnDefinition<Topic>[] = [
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
    sortable: true,
  },
  {
    id: "content",
    header: "Content",
    accessorKey: "content",
    sortable: true,
  },
  {
    id: "featuredImage",
    header: "Featured Image",
    accessorKey: "featuredImage",
    sortable: true,
    cell(item) {
      return (
        <Image
          src={
            item.featuredImage && item.featuredImage !== ""
              ? item.featuredImage
              : "https://placehold.co/600x400.png"
          }
          alt={item.title}
          width={100}
          height={100}
        />
      );
    },
  },
];

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();

  // All hooks must be called at the top level, before any conditional logic
  const { courseId, lessonId } = params as {
    courseId: string;
    lessonId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId,
  });

  const updateLesson = useMutation(api.lms.lessons.mutations.update);

  // Now we can do conditional checks after all hooks are called
  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const lesson = data.attachedLessons.find((l) => l._id === lessonId);
  if (!lesson) return <div>Lesson not found.</div>;

  const getVimeoEmbedUrl = (vimeoUrl: string) => {
    const regex = /(?:vimeo\.com\/(?:video\/|.*\?.*v=)?([^#&?]*)).*/;
    const match = vimeoUrl.match(regex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  const topics = data.attachedTopics.filter((t) => t.lessonId === lessonId);
  const quizzes = data.attachedQuizzes.filter((q) => q.lessonId === lessonId);

  const handleUpdate = async (values: LessonFormValues) => {
    await updateLesson({
      lessonId,
      title: values.title,
      content: values.content,
      excerpt: values.excerpt,
      categories: values.categories
        ? values.categories.split(",").map((c) => c.trim())
        : undefined,
      featuredMedia: values.featuredMedia,
    });
    toast.success("Lesson updated");
  };

  const topicItems: EntityListItem[] = topics.map((topic) => ({
    id: topic._id,
    title: topic.title,
    description: topic.excerpt ?? "",
    href: `/courses/${courseId}/lesson/${lessonId}/topic/${topic._id}`,
    featuredImage: topic.featuredImage,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* <LessonHeader lesson={lesson} /> */}
      <div className="flex gap-6 p-3">
        <div className="flex-1">
          <Card className="border-none shadow-none">
            <CardContent className="p-6">
              {lesson.content?.includes("vimeo") && (
                <div className="relative mb-4 h-0 overflow-hidden rounded-md pb-[56.25%]">
                  <iframe
                    src={getVimeoEmbedUrl(lesson.content)}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute left-0 top-0 h-full w-full border-0"
                  ></iframe>
                </div>
              )}
              {lesson.description && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {lesson.description}
                </p>
              )}

              {/* Topics */}
              {topics.length > 0 && (
                <EntityList
                  title="Topics"
                  description="All topics in this lesson"
                  columns={lessonColumns}
                  data={topicItems}
                  gridColumns={{ sm: 1, md: 2, lg: 3, xl: 3 }}
                  onRowClick={(item) => {
                    router.push(
                      `/courses/${courseId}/lesson/${lessonId}/topic/${item.id}`,
                    );
                  }}
                  itemRender={(item) => (
                    <Card className="h-full p-0">
                      <CardContent className="p-0">
                        <Image
                          src={
                            item.featuredImage && item.featuredImage !== ""
                              ? item.featuredImage
                              : "https://placehold.co/600x300.png"
                          }
                          alt={item.title}
                          width={100}
                          height={100}
                          className="w-full"
                        />
                      </CardContent>
                      <CardHeader className="p-3">
                        <CardTitle>{item.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  )}
                  defaultViewMode="grid"
                />
              )}

              <Separator />

              {/* Quizzes */}
              {quizzes.length > 0 && (
                <EntityList
                  title="Quizzes"
                  description="All quizzes in this lesson"
                  items={quizzes.map((quiz) => ({
                    id: quiz._id,
                    title: quiz.title,
                    description: quiz.description ?? "",
                    href: `/courses/${courseId}/lesson/${lessonId}/quiz/${quiz._id}`,
                  }))}
                  renderItem={(item) => <EntityListView item={item} />}
                />
              )}
            </CardContent>
          </Card>
        </div>
        {/* <div className="-mt-24 w-1/3 p-3">
          <LessonSidebar />
        </div> */}
      </div>
    </div>
  );
}

const LessonHeader = ({ lesson }: { lesson: Lesson }) => {
  return (
    <CardHeader className="flex justify-between">
      <div className="flex flex-1 justify-between gap-2">
        <CardTitle className="flex gap-2 text-2xl font-bold">
          {lesson.title}
          <Badge variant="outline">Lesson</Badge>
        </CardTitle>
      </div>
    </CardHeader>
  );
};
