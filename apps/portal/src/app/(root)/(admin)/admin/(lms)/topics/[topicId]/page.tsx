"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { TopicForm } from "../_components/TopicForm";

export default function AdminTopicEditPage() {
  const params = useParams();
  const { topicId } = params as { topicId: string };

  const topic = useQuery(api.lms.topics.index.getTopic, {
    id: topicId as Id<"topics">,
  });

  const tags = useQuery(api.tags.index.listTags, {});
  const createTag = useMutation(api.tags.index.createTag);
  const updateTopic = useMutation(api.lms.topics.index.updateTopic);

  const handleSave = async (data: any) => {
    try {
      if (!topic) {
        toast.error("Topic not found");
        return;
      }
      await updateTopic({
        id: topic._id,
        title: data.title,
        description: data.description,
        excerpt: data.excerpt,
        content: data.content,
        isPublished: data.isPublished,
        contentType: data.contentType,
        featuredImage: data.featuredImageUrl,
        featuredMedia: data.featuredMedia,
        categories: data.categories ? [data.categories] : [], // Convert single string to array
        menuOrder: data.menuOrder,
        tagIds: data.tagIds, // Pass selected tags
      });
      toast.success("Topic updated!");
    } catch (error) {
      console.error("Failed to update topic:", error);
      toast.error("Failed to update topic.");
    }
  };

  if (topic === undefined || tags === undefined) {
    return <div>Loading...</div>;
  }

  if (topic === null) {
    return <div>Topic not found.</div>;
  }

  console.log("[Topic]", topic);

  const initialFormValues = {
    title: topic.title,
    description: topic.description || "",
    excerpt: topic.excerpt || "",
    content: topic.content || "",
    isPublished: topic.isPublished || false,
    contentType: topic.contentType || "text",
    featuredImage: topic.featuredImage || "",
    featuredMedia: topic.featuredMedia,
    categories:
      topic.categories && topic.categories.length > 0
        ? topic.categories[0]
        : "", // Ensure categories is a single string
    menuOrder: topic.menuOrder,
    tagIds: topic.tagIds?.map((id) => id.toString()) || [], // Explicitly convert Id<"tags"> to string[]
  };

  return (
    <TopicForm
      initialData={initialFormValues}
      onSave={handleSave}
      availableTags={tags}
      createTagMutation={createTag}
    />
  );
}
