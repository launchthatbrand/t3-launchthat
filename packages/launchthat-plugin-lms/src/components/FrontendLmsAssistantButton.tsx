"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { openSupportAssistantExperience } from "launchthat-plugin-support/assistant";

import { Button } from "@acme/ui/button";

export function FrontendLmsAssistantButton(props: PluginFrontendSingleSlotProps) {
  const post = props.post as { _id?: unknown; title?: unknown; postTypeSlug?: unknown } | null;
  const postId = typeof post?._id === "string" ? post._id : null;
  const postTypeSlug =
    typeof post?.postTypeSlug === "string" ? post.postTypeSlug.toLowerCase() : null;
  const title = typeof post?.title === "string" ? post.title : null;

  if (!postId || !postTypeSlug) {
    return null;
  }

  if (postTypeSlug !== "courses" && postTypeSlug !== "lessons" && postTypeSlug !== "topics") {
    return null;
  }

  const handleClick = () => {
    openSupportAssistantExperience({
      experienceId: "lms-content",
      context: {
        postTypeSlug,
        postId,
        title: title ?? undefined,
      },
    });
  };

  const label =
    postTypeSlug === "courses"
      ? "Tell me about this course"
      : postTypeSlug === "lessons"
        ? "Tell me about this lesson"
        : "Tell me about this topic";

  return (
    <div className="flex justify-end">
      <Button type="button" variant="outline" size="sm" onClick={handleClick}>
        {label}
      </Button>
    </div>
  );
}


