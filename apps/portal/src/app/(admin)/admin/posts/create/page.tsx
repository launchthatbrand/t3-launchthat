"use client";

import type { PostFormData } from "@/lib/blog";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreatePost, usePostCategories } from "@/lib/blog";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import PostForm from "../_components/PostForm";

function CreatePostPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: categoriesData } = usePostCategories();
  const createPost = useCreatePost();

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
      await createPost(data);
      toast.success("Post created successfully");
      router.push("/admin/posts");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/posts">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create New Post</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Create and publish a new blog post
        </p>
      </div>
      <PostForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        categories={categoryOptions}
        submitButtonText="Save Post"
      />
    </div>
  );
}

export default CreatePostPage;
