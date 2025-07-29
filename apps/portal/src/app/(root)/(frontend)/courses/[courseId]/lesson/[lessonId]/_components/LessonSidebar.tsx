"use client";

import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import { useConvexUser } from "~/hooks/useConvexUser";
import { LessonProgress } from "../../../_components/LessonProgress";
import RecentContent from "./RecentContent";
import RelatedContent from "./RelatedContent";

const LessonSidebar = () => {
  const params = useParams();
  const { convexId: userId } = useConvexUser();
  const { courseId, lessonId, topicId } = params as {
    courseId: string;
    lessonId: string;
    topicId: string;
  };

  console.log("[LessonHeader] params", params);

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  // Get real lesson progress data
  const lessonProgress = useQuery(
    api.lms.progress.index.getLessonProgress,
    userId && lessonId
      ? {
          userId,
          courseId: courseId as Id<"courses">,
          lessonId: lessonId as Id<"lessons">,
        }
      : "skip",
  );

  // Get quizzes for this lesson to use as milestone markers
  const lessonQuizzes = useQuery(
    api.lms.quizzes.index.getQuizzesByLesson,
    lessonId
      ? {
          lessonId: lessonId as Id<"lessons">,
        }
      : "skip",
  );

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const lesson = data.attachedLessons.find((l) => l._id === lessonId);
  if (!lesson) return <div>Lesson not found.</div>;

  const topic = data.attachedTopics.find((t) => t._id === topicId);
  if (!topic) return <div>Topic not found.</div>;

  const topicIndex = data.attachedTopics.findIndex((t) => t._id === topicId);

  const previousTopic =
    topicIndex > 0 ? data.attachedTopics[topicIndex - 1] : null;
  const nextTopic =
    topicIndex < data.attachedTopics.length - 1
      ? data.attachedTopics[topicIndex + 1]
      : null;

  const handleVideoNavigation = (newTopicId: string) => {
    router.push(`/courses/${courseId}/lesson/${lessonId}/topic/${newTopicId}`);
  };

  return (
    <>
      {topic ? (
        <div className="sticky top-6 flex w-full flex-col gap-4 overflow-hidden">
          <Card className="overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Lesson Progress</CardTitle>
              {lessonProgress && (
                <div className="text-sm text-muted-foreground">
                  {lessonProgress.topicsCompleted} of{" "}
                  {lessonProgress.totalTopics} topics completed
                </div>
              )}
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-6">
              <LessonProgress
                lessonProgress={lessonProgress}
                quizzes={lessonQuizzes}
                userId={userId}
                _courseId={courseId as Id<"courses">}
              />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Related Content</CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-6">
              <RelatedContent
                lesson={lesson}
                topic={topic}
                course={data.course}
              />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Recent Content</CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-6">
              <RecentContent
                lesson={lesson}
                topic={topic}
                course={data.course}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="sticky top-3 w-full overflow-hidden">
          <CardContent className="p-0">
            {lesson.featuredImage && (
              <Image
                src={lesson.featuredImage}
                alt={lesson.title}
                width={100}
                height={100}
                className="w-full"
              />
            )}
            <Separator />
          </CardContent>
          <CardHeader>
            <CardTitle className="text-xl">{lesson.title}</CardTitle>
          </CardHeader>
        </Card>
      )}
    </>
  );
};

export default LessonSidebar;
