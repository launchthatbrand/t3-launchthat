"use client";

import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";

import { toast } from "@acme/ui/toast";

import type { PostFormData } from "~/components/admin/PostForm";
import { PostForm } from "~/components/admin/PostForm";

export default function CreatePostPage() {
  const router = useRouter();
  const createPost = useMutation(api.core.posts.mutations.createPost);

  const handleSubmit = async (data: PostFormData) => {
    try {
      await createPost({
        title: data.title,
        content: data.content,
        slug: data.slug ?? "",
        status: (data.status as "published" | "draft" | "archived") ?? "draft",
        category:
          data.category && data.category.length ? data.category : undefined,
        tags: data.tags && data.tags.length ? data.tags : undefined,
        excerpt: data.excerpt && data.excerpt.length ? data.excerpt : undefined,
        featuredImage:
          data.featuredImageUrl && data.featuredImageUrl.length
            ? data.featuredImageUrl
            : undefined,
      });
      toast.success("Post created");
      router.push("/admin/posts");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create post");
    }
  };

  return (
    <PostForm
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      submitButtonText="Create Post"
    />
  );
}
