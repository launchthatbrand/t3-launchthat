/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

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
import LessonForm from "~/app/(root)/(admin)/admin/lessons/_components/LessonForm";

export default function LessonPage() {
  const params = useParams();
  const { courseId, lessonId } = params as {
    courseId: string;
    lessonId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId,
  });

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

  const updateLesson = useMutation(api.lms.lessons.index.update);
  const handleUpdate = async (values: LessonFormValues) => {
    await updateLesson({
      lessonId,
      title: values.title,
      content: values.content,
      excerpt: values.excerpt,
      categories: values.categories
        ? values.categories.split(",").map((c) => c.trim())
        : undefined,
      featuredImage: values.featuredImageUrl,
    });
    toast.success("Lesson updated");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">{lesson.title}</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Edit Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
            </DialogHeader>
            <LessonForm
              initialData={{
                _id: lesson._id,
                title: lesson.title,
                content: lesson.content ?? "",
                excerpt: lesson.excerpt ?? "",
                categories: lesson.categories?.join(", ") ?? "",
                featuredMedia: lesson.featuredMedia ?? "",
                status: lesson.isPublished ? "published" : "draft",
                featured: false,
              }}
              onSubmit={handleUpdate}
              isSubmitting={false}
              categories={[]}
              submitButtonText="Save Lesson"
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
          <>
            <h3 className="mb-2 font-semibold">Topics</h3>
            <ul className="mb-4 list-disc pl-6">
              {topics.map((topic) => (
                <li key={topic._id}>
                  <Link
                    href={`/courses/${courseId}/lesson/${lessonId}/topic/${topic._id}`}
                    className="text-primary underline"
                  >
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <Separator />

        {/* Quizzes */}
        {quizzes.length > 0 && (
          <>
            <h3 className="mb-2 mt-4 font-semibold">Quizzes</h3>
            <ul className="list-disc pl-6">
              {quizzes.map((quiz) => (
                <li key={quiz._id}>
                  <Link
                    href={`/courses/${courseId}/lesson/${lessonId}/quiz/${quiz._id}`}
                    className="text-xs text-primary underline"
                  >
                    Quiz: {quiz.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
