"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type { PostFormData } from "~/components/admin/PostForm";
import { PostForm } from "~/components/admin/PostForm";

function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const postId = params.id as Id<"posts">;

  const post = useQuery(
    api.core.posts.queries.getPostById,
    postId ? { id: postId } : "skip",
  );
  const { name: _ignore } = { name: "categories-not-used-here" };

  const updatePost = useMutation(api.core.posts.mutations.updatePost);

  const initialData: PostFormData | undefined = useMemo(() => {
    if (!post) return undefined;
    return {
      title: post.title ?? "",
      slug: post.slug ?? "",
      status: (post.status as PostFormData["status"]) ?? "draft",
      authorId: post.authorId,
      category: post.category ?? "",
      tags: post.tags ?? [],
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      featuredImageUrl: (post as any).featuredImage ?? "",
      featured: (post as any).featured ?? false,
      readTime: (post as any).readTime ?? "",
    };
  }, [post]);

  const handleSubmit = async (data: PostFormData) => {
    try {
      setIsSubmitting(true);
      await updatePost({
        id: postId,
        title: data.title,
        content: data.content,
        slug: data.slug,
        status: data.status,
        category:
          data.category && data.category.length ? data.category : undefined,
        tags: data.tags && data.tags.length ? data.tags : undefined,
        excerpt: data.excerpt && data.excerpt.length ? data.excerpt : undefined,
        featuredImage:
          data.featuredImageUrl && data.featuredImageUrl.length
            ? data.featuredImageUrl
            : undefined,
      });
      toast.success("The post has been successfully updated.");
      router.push("/admin/posts");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("There was an error updating the post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (post === undefined) {
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
        initial={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Save Changes"
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default EditPostPage;
