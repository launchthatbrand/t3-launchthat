"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { EditItemDialog } from "@/components/EditItemDialog";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import { CommentThread } from "~/components/social/CommentThread";
import LessonSidebar from "../../_components/LessonSidebar";

export default function TopicPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
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

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId: courseId as Id<"courses">,
  });

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const topic = data.attachedTopics.find((t) => t._id === topicId);
  console.log("[TopicPage] topic", topic);
  if (!topic) return <div>Topic not found.</div>;

  const updateTopicTitle = useMutation(api.lms.topics.index.update);

  const handleSave = async (values: { title: string }) => {
    await updateTopicTitle({
      topicId: topicId as Id<"topics">,
      title: values.title,
    });
    toast.success("Topic updated");
  };
  const getVimeoEmbedUrl = (vimeoUrl: string) => {
    const regex = /(?:vimeo\.com\/(?:video\/|.*\?.*v=)?([^#&?]*)).*/;
    const match = vimeoUrl.match(regex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };
  const lesson = data.attachedLessons.find((l) => l._id === _lessonId);

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
      <Accordion
        type="single"
        collapsible
        defaultValue="item-1"
        className="sticky top-14 z-20"
      >
        <AccordionItem value="item-1">
          <CardHeader className="sticky:shadow-lg sticky top-14 z-10 flex flex-col justify-between gap-3 space-y-0 bg-white p-4">
            <div className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex gap-2 text-xl font-bold">
                {topic.title}
              </CardTitle>
              <Badge variant="outline" className="text-md bg-white">
                Topic
              </Badge>
            </div>

            {isMobile && (
              <AccordionTrigger className="rounded-md bg-slate-100 p-3 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:rounded-md [&>svg]:bg-white [&>svg]:shadow-md">
                Additional Information
              </AccordionTrigger>
            )}
          </CardHeader>

          <AccordionContent className="bg-slate-100 p-4 md:hidden">
            <LessonSidebar />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <CardContent className="p-6">
        {topic.content?.includes("vimeo") ? (
          getVimeoEmbedUrl(topic.content) && (
            <div className="relative mb-4 h-0 overflow-hidden rounded-md px-5 pb-[56.25%] shadow-xl">
              <iframe
                src={getVimeoEmbedUrl(topic.content) as string}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute left-0 top-0 h-full w-full border-0"
              ></iframe>
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">No content available.</p>
        )}
        <Carousel className="w-full">
          <CarouselContent className="flex-wrap p-0">
            <CarouselItem
              className="group basis-1/2 cursor-pointer md:basis-1/4 lg:basis-1/5"
              onClick={() => handleVideoNavigation(previousTopic?._id ?? "")}
            >
              <Card className="relative flex flex-col gap-2 overflow-hidden p-1">
                <Image
                  src={
                    previousTopic?.featuredImage &&
                    previousTopic?.featuredImage !== ""
                      ? previousTopic.featuredImage
                      : "https://placehold.co/600x400"
                  }
                  alt={topic.title}
                  width={500}
                  height={500}
                  className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-2 text-center text-white transition-opacity duration-300 group-hover:opacity-0">
                  <Badge
                    variant="outline"
                    className="mb-2 bg-white transition-opacity duration-300 group-hover:opacity-0"
                  >
                    Previous
                  </Badge>
                  <p className="text-sm font-semibold transition-opacity duration-300 group-hover:opacity-0">
                    {previousTopic?.title ?? "No previous topic"}
                  </p>
                </div>
              </Card>
            </CarouselItem>

            {topic && (
              <CarouselItem className="order-first mb-5 flex basis-full cursor-default items-stretch gap-3 transition-all duration-300 md:order-none md:basis-1/2 lg:basis-3/5">
                <Button className="w-full flex-1 bg-green-500 text-lg font-semibold hover:bg-green-600">
                  Complete Topic
                </Button>
                <EditItemDialog
                  dialogTitle="Edit Topic"
                  initialTitle={topic.title}
                  onSubmit={handleSave}
                  triggerButtonClassName="h-full"
                />
                {/* <Card className="flex flex-col gap-2 p-1 ring-1 ring-primary">
                  {topic.featuredImage && (
                    <Image
                      src={
                        topic.featuredImage && topic.featuredImage !== ""
                          ? topic.featuredImage
                          : "https://placehold.co/600x400"
                      }
                      alt={topic.title}
                      width={300}
                      height={100}
                      className="h-12 w-full"
                    />
                  )}
                  <div className="flex flex-col gap-2 text-center text-sm">
                    <Badge variant="outline">Current</Badge>
                    <p className="text-sm font-semibold">{topic.title}</p>
                  </div>
                </Card> */}
              </CarouselItem>
            )}
            {nextTopic && (
              <CarouselItem
                className="group basis-1/2 cursor-pointer md:basis-1/4 lg:basis-1/5"
                onClick={() => handleVideoNavigation(nextTopic._id)}
              >
                <Card className="relative flex flex-col gap-2 overflow-hidden p-1">
                  {nextTopic.featuredImage && (
                    <Image
                      src={
                        nextTopic.featuredImage &&
                        nextTopic.featuredImage !== ""
                          ? nextTopic.featuredImage
                          : "https://placehold.co/600x400"
                      }
                      alt={topic.title}
                      width={500}
                      height={500}
                      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-5 text-center text-white transition-opacity duration-300 group-hover:opacity-0">
                    <Badge
                      variant="outline"
                      className="mb-2 bg-white transition-opacity duration-300 group-hover:opacity-0"
                    >
                      Next
                    </Badge>
                    <p className="text-sm font-semibold transition-opacity duration-300 group-hover:opacity-0">
                      {nextTopic.title}
                    </p>
                  </div>
                </Card>
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
