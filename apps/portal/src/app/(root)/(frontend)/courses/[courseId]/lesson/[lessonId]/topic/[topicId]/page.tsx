"use client";

import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { EditItemDialog } from "@/components/EditItemDialog";
import { api } from "@convex-config/_generated/api";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@acme/ui/carousel";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";
import { toast } from "@acme/ui/toast";

import { ProtectedContent } from "~/components/access/ProtectedContent";
import { CommentThread } from "~/components/social/CommentThread";
import { useConvexUser } from "~/hooks/useConvexUser";
import { CompleteContentButton } from "../../../../_components/CompleteContentButton";

export default function TopicPage() {
  // const isMobile = useIsMobile();
  const router = useRouter();
  const { convexId: userId, isLoading: _isAuthLoading } = useConvexUser();
  const params = useParams();
  const {
    courseId,
    lessonId: _lessonId,
    topicId,
  } = params as {
    courseId: string;
    lessonId: string;
    topicId: string;
  };

  // Queries
  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  // // Check if this topic is completed for the current user
  // const isCompleted = useQuery(
  //   api.lms.progress.index.isItemCompleted,
  //   userId
  //     ? {
  //         userId,
  //         itemId: topicId as Id<"topics">,
  //       }
  //     : "skip",
  // );

  // Get course progress for the user
  const _courseProgress = useQuery(
    api.lms.progress.index.getCourseProgressMeta,
    userId
      ? {
          userId,
          courseId: courseId as Id<"courses">,
        }
      : "skip",
  );

  // Mutations
  const updateTopicTitle = useMutation(api.lms.topics.index.update);
  const startTopicProgress = useMutation(api.lms.progress.index.startItem);

  // Start tracking progress when component loads
  React.useEffect(() => {
    if (topicId && courseId && userId) {
      void startTopicProgress({
        userId,
        courseId: courseId as Id<"courses">,
        itemId: topicId as Id<"topics">,
        itemType: "topic",
      });
    }
  }, [topicId, courseId, userId, startTopicProgress]);

  if (data === undefined)
    return (
      <Card className="border-none p-6 shadow-none">
        <Skeleton className="h-64 w-full" />
      </Card>
    );

  if (data === null) return <div>Course not found.</div>;

  const topic = data.attachedTopics.find((t) => t._id === topicId);
  console.log("[TopicPage] topic", topic);
  if (!topic) return <div>Topic not found.</div>;

  const handleSave = async (values: { title: string }) => {
    await updateTopicTitle({
      topicId: topicId as Id<"topics">,
      title: values.title,
    });
    toast.success("Topic updated");
  };

  const getVimeoEmbedUrl = (vimeoUrl: string) => {
    const regex = /(?:vimeo\.com\/(?:video\/|.*\?.*v=)?([^#&?]*)).*/;
    const match = regex.exec(vimeoUrl);
    if (match?.[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  const topicIndex = data.attachedTopics.findIndex((t) => t._id === topicId);

  const previousTopic =
    topicIndex > 0 ? data.attachedTopics[topicIndex - 1] : null;
  const nextTopic =
    topicIndex < data.attachedTopics.length - 1
      ? data.attachedTopics[topicIndex + 1]
      : null;

  const handleVideoNavigation = (newTopicId: string) => {
    router.push(`/courses/${courseId}/lesson/${_lessonId}/topic/${newTopicId}`);
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-6">
        {/* Protect the video content specifically */}
        <ProtectedContent
          contentType="topic"
          contentId={topicId}
          mode="optimistic"
          title={`Topic: ${topic.title}`}
          showAccessDetails={false}
        >
          {topic.content?.includes("vimeo") ? (
            getVimeoEmbedUrl(topic.content) && (
              <div className="relative mb-4 h-0 overflow-hidden rounded-md px-5 pb-[56.25%] shadow-xl">
                <iframe
                  src={getVimeoEmbedUrl(topic.content) ?? undefined}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute left-0 top-0 h-full w-full border-0"
                ></iframe>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              No content available.
            </p>
          )}
        </ProtectedContent>

        {/* Navigation and comments remain unprotected */}
        <Carousel className="w-full">
          <CarouselContent className="flex-wrap p-0">
            <CarouselItem
              className="group basis-1/2 cursor-pointer md:basis-1/4 lg:basis-1/5"
              onClick={() => handleVideoNavigation(previousTopic?._id ?? "")}
            >
              <OverlayCard item={previousTopic} badgeText="Previous" />
            </CarouselItem>

            <CarouselItem className="order-first mb-5 flex basis-full cursor-default flex-col items-stretch gap-3 transition-all duration-300 md:order-none md:basis-1/2 lg:basis-3/5">
              <CompleteContentButton
                contentType="topic"
                courseId={courseId as Id<"courses">}
                contentId={topicId as Id<"topics">}
                timeSpent={300} // 5 minutes as example
                className="w-full flex-1 text-lg font-semibold"
                size="lg"
                showProgress={false}
              />
              <EditItemDialog
                dialogTitle="Edit Topic"
                initialTitle={topic.title}
                onSubmit={handleSave}
                triggerButtonClassName="h-full h-8"
              />
            </CarouselItem>

            {nextTopic && (
              <CarouselItem
                className="group basis-1/2 cursor-pointer md:basis-1/4 lg:basis-1/5"
                onClick={() => handleVideoNavigation(nextTopic._id)}
              >
                <OverlayCard item={nextTopic} badgeText="Next" />
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 transform">
            <ChevronLeft className="h-4 w-4" />
          </CarouselPrevious>
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 transform">
            <ChevronRight className="h-4 w-4" />
          </CarouselNext>
        </Carousel>

        <Separator className="my-6" />

        {/* Social Feed Comments */}
        <h3 className="mb-4 text-xl font-bold">Comments</h3>
        <CommentThread postId={topic._id} postType="topic" />
      </CardContent>
    </Card>
  );
}

export const OverlayCard = ({
  item,
  badgeText,
  onClick,
}: {
  item: Doc<"topics"> | Doc<"lessons"> | null | undefined;
  badgeText?: string;
  onClick?: () => void;
}) => {
  if (!item) return null;
  return (
    <Card
      className="group relative flex cursor-pointer flex-col gap-2 overflow-hidden p-1"
      onClick={onClick}
    >
      {item.featuredImage && (
        <Image
          src={
            item.featuredImage && item.featuredImage !== ""
              ? item.featuredImage
              : "https://placehold.co/600x400"
          }
          alt={item.title}
          width={500}
          height={500}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-5 text-center text-white transition-opacity duration-300 group-hover:opacity-0">
        {badgeText && (
          <Badge
            variant="outline"
            className="mb-2 bg-white transition-opacity duration-300 group-hover:opacity-0"
          >
            {badgeText}
          </Badge>
        )}
        <p className="text-sm font-semibold transition-opacity duration-300 group-hover:opacity-0">
          {item.title}
        </p>
      </div>
    </Card>
  );
};
