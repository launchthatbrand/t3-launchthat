"use client";

import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useQuery } from "convex/react";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@acme/ui/carousel";
import { useIsMobile } from "@acme/ui/hooks/use-mobile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { Progress } from "@acme/ui/progress";
import { Separator } from "@acme/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@acme/ui/sheet";

const LessonSidebar = () => {
  const isMobile = useIsMobile();
  const params = useParams();
  const router = useRouter();
  const { courseId, lessonId, topicId } = params as {
    courseId: string;
    lessonId: string;
    topicId: string;
  };

  console.log("[LessonHeader] params", params);

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

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
              <CardTitle className="text-lg">Lesson Progression</CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-6">
              <LessonProgress />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Related Content</CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-6">
              <LessonProgress />
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

const LessonProgress = () => {
  const keyPoints = [
    {
      title: "Quiz 1",
      percentage: 25,
      icon: <CheckCircle />,
    },
    {
      title: "Quiz 2",
      percentage: 50,
      icon: <CheckCircle />,
    },
    {
      title: "Quiz 3",
      percentage: 75,
      color: "bg-primary",
    },
    {
      title: "Quiz 4",
      percentage: 100,
      color: "bg-primary",
    },
  ];

  // For demonstration, let's assume a current progress value
  const currentProgress = 60;

  return (
    <div className="relative flex w-full items-center">
      <Progress value={currentProgress} className="h-3 w-full bg-muted" />
      {keyPoints.map((keyPoint) => (
        <HoverCard openDelay={1} key={keyPoint.title}>
          <HoverCardTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={`absolute z-10 -translate-x-1/2 rounded-full p-1 ${keyPoint.color}`}
              style={{ left: `${keyPoint.percentage}%` }}
            >
              {keyPoint.icon}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-40 text-center text-sm">
            {keyPoint.title}
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
};
