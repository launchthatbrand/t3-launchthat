"use client";

import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";

import { TopicForm } from "../_components/TopicForm";

export default function AdminTopicEditPage() {
  const params = useParams();
  const { topicId } = params as { topicId: string };

  const topic = useQuery(api.lms.topics.index.getTopic, { topicId });

  const updateTitle = useMutation(api.lms.topics.index.updateTitle);

  if (topic === undefined) return <div>Loading...</div>;
  if (topic === null) return <div>Topic not found</div>;

  const handleSubmit = async (values: { title: string }) => {
    await updateTitle({ topicId, title: values.title });
    toast.success("Topic updated");
  };

  return (
    <div>
      <TopicForm
        onSubmit={handleSubmit}
        isSubmitting={false}
        /* We pass initial values via defaultValues prop using key trick */
        key={topic._id}
      />
    </div>
  );
}
