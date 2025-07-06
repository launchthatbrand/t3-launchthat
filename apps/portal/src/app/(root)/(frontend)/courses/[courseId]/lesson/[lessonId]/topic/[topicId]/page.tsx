"use client";

import { useParams } from "next/navigation";
import { EditItemDialog } from "@/components/EditItemDialog";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

export default function TopicPage() {
  const params = useParams();
  const { courseId, lessonId, topicId } = params as {
    courseId: string;
    lessonId: string;
    topicId: string;
  };

  const data = useQuery(api.lms.courses.queries.getCourseStructureWithItems, {
    courseId,
  });

  if (data === undefined) return <div>Loading...</div>;
  if (data === null) return <div>Course not found.</div>;

  const topic = data.attachedTopics.find((t) => t._id === topicId);
  if (!topic) return <div>Topic not found.</div>;

  const updateTopicTitle = useMutation(api.lms.topics.index.updateTitle);

  const handleSave = async (values: { title: string }) => {
    await updateTopicTitle({ topicId, title: values.title });
    toast.success("Topic updated");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{topic.title}</CardTitle>
        <EditItemDialog
          dialogTitle="Edit Topic"
          initialTitle={topic.title}
          onSubmit={handleSave}
        />
      </CardHeader>
      <CardContent>
        {topic.content ? (
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: topic.content }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No content available.</p>
        )}
      </CardContent>
    </Card>
  );
}
