"use client";

import { useRouter } from "next/navigation";

import { toast } from "@acme/ui/toast";

import type { PostFormData } from "~/components/admin/PostForm";
import AdminSinglePost, {
  AdminSinglePostHeader,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostTabsContent,
} from "~/components/admin/AdminSinglePostLayout";
import { PostForm } from "~/components/admin/PostForm";
import { useCreatePost } from "~/lib/blog";

export default function CreatePostPage() {
  const router = useRouter();
  const createPost = useCreatePost();

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
    <AdminSinglePost
      postType="post"
      postTitle={`Post`}
      postId={""}
      isSubmitting={false}
      defaultTab="content"
    >
      <AdminSinglePostHeader
        showBackButton={true}
        backUrl="/admin/store/orders"
        showSaveButton={false} // Save is handled per section
      />
      <AdminSinglePostLayout className="container border-none shadow-none">
        <AdminSinglePostMain className="ADMIN_SINGLE_POST_MAIN border-none shadow-none">
          <PostForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            submitButtonText="Create Post"
            title=""
          />
        </AdminSinglePostMain>
      </AdminSinglePostLayout>
    </AdminSinglePost>
  );
}
