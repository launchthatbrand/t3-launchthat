"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { Post, PostFormData, PostStatus } from "@/lib/blog";
import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePost, usePostCategories, useUpdatePost } from "@/lib/blog";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import PostForm from "../_components/PostForm";

interface ApiPost {
  _id: Id<"posts">;
  _creationTime: number;
  title: string;
  content: string;
  status?: string;
  category?: string;
  slug?: string;
  createdAt?: number;
  excerpt?: string;
  tags?: string[];
  authorId?: Id<"users">;
  updatedAt?: number;
  featuredImageUrl?: string;
  featured?: boolean;
  readTime?: string;
  author?: {
    _id: Id<"users">;
    name: string;
    imageUrl?: string;
  } | null;
}

function apiPostToPost(apiPost: ApiPost | null): Post | null {
  if (!apiPost) return null;

  let status: PostStatus = "draft";
  if (
    apiPost.status &&
    ["draft", "published", "archived"].includes(apiPost.status)
  ) {
    status = apiPost.status as PostStatus;
  }

  return {
    _id: apiPost._id,
    _creationTime: apiPost._creationTime,
    title: apiPost.title,
    content: apiPost.content,
    status,
    category: apiPost.category ?? "Uncategorized",
    slug: apiPost.slug ?? "",
    createdAt: apiPost.createdAt ?? apiPost._creationTime,
    excerpt: apiPost.excerpt,
    tags: apiPost.tags ?? [],
    authorId: apiPost.authorId,
    updatedAt: apiPost.updatedAt,
    featuredImageUrl: apiPost.featuredImageUrl,
    featured: apiPost.featured ?? false,
    readTime: apiPost.readTime,
    author: apiPost.author ?? undefined,
  };
}

function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const postId = params.id as Id<"posts">;
  const { data: apiPost, isLoading: isPostLoading } = usePost(postId);
  const updatePost = useUpdatePost();
  const post = apiPostToPost(apiPost as ApiPost | null);
  const { data: categoriesData } = usePostCategories();

  const categoryOptions = React.useMemo(
    () =>
      categoriesData?.map((category) => ({
        value: category.name.toLowerCase(),
        label: category.name,
      })) ?? [
        { value: "tutorials", label: "Tutorials" },
        { value: "news", label: "News" },
        { value: "devops", label: "DevOps" },
        { value: "development", label: "Development" },
        { value: "case-studies", label: "Case Studies" },
      ],
    [categoriesData],
  );

  const handleSubmit = async (data: PostFormData) => {
    try {
      setIsSubmitting(true);
      await updatePost({ id: postId, ...data });
      toast.success("The post has been successfully updated.");
      router.push("/admin/posts");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("There was an error updating the post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPostLoading) {
    return <div>Loading post...</div>;
  }
  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/posts">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Post</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Edit and update your blog post
        </p>
      </div>
      <PostForm
        initialData={post}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        categories={categoryOptions}
        submitButtonText="Save Changes"
      />
    </div>
  );
}

export default EditPostPage;
