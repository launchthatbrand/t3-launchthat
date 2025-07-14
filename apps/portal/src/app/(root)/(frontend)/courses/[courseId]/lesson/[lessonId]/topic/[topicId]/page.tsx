"use client";

import { useParams } from "next/navigation";
import { EditItemDialog } from "@/components/EditItemDialog";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import { CommentThread } from "~/components/social/CommentThread";

export default function TopicPage() {
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

  return (
    <Card className="m-3 shadow-sm">
      <CardHeader className="flex items-center justify-between md:flex-row">
        <CardTitle className="text-xl font-bold">{topic.title}</CardTitle>
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <Button className="text-lg font-semibold">Complete Topic</Button>
          <EditItemDialog
            dialogTitle="Edit Topic"
            initialTitle={topic.title}
            onSubmit={handleSave}
          />
        </div>
      </CardHeader>
      <CardContent>
        {topic.content?.includes("vimeo") ? (
          getVimeoEmbedUrl(topic.content) && (
            <div className="relative mb-4 h-0 overflow-hidden rounded-md pb-[56.25%]">
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

        <Separator className="my-6" />

        {/* Social Feed Comments */}
        <h3 className="mb-4 text-xl font-bold">Comments</h3>
        <CommentThread postId={topic._id} postType="topic" />
      </CardContent>
    </Card>
  );
}
