"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useCallback } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import type { PostFormData } from "./PostForm";

export type PostStatus = "draft" | "published" | "archived";

interface PostStatusFormProps {
  postId: Id<"posts">;
  className?: string;
}

export const PostStatusForm = ({ postId, className }: PostStatusFormProps) => {
  const { control } = useFormContext<PostFormData>();
  const updatePost = useMutation(api.core.posts.mutations.updatePost);

  const handleChange = useCallback(
    async (next: PostStatus) => {
      try {
        await updatePost({ id: postId, status: next });
        toast.success("Status updated");
      } catch (err) {
        toast.error("Failed to update status");
        console.error("Update status error", err);
      }
    },
    [postId, updatePost],
  );

  return (
    <div className={className}>
      <FormField
        control={control}
        name="status"
        render={({ field }) => {
          const raw = field.value as string | undefined;
          const selected: PostStatus =
            raw === "draft" || raw === "published" || raw === "archived"
              ? (raw as PostStatus)
              : "draft";
          return (
            <FormItem>
              <FormLabel>Post Status</FormLabel>
              <FormControl>
                <Select
                  value={selected}
                  onValueChange={(v) => {
                    field.onChange(v as PostStatus);
                    void handleChange(v as PostStatus);
                  }}
                >
                  <SelectTrigger id="post-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
};
