"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";

import { Form } from "@acme/ui/form";
import { toast } from "@acme/ui/toast";

import type { PostFormData } from "~/components/admin/PostForm";
import AdminSinglePost, {
  AdminSinglePostHeader,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostSidebar,
} from "~/components/admin/AdminSinglePostLayout";
import { PostForm } from "~/components/admin/PostForm";
import { PostStatusForm } from "~/components/admin/PostStatusForm";
import { useTenant } from "~/context/TenantContext";

function EditPostContent({
  initialData,
  postId,
  onBack,
}: {
  initialData: PostFormData;
  postId: Id<"posts">;
  onBack: () => void;
}) {
  const form = useForm<PostFormData>({
    defaultValues: initialData,
    mode: "onChange",
  });
  const updatePost = useMutation(api.core.posts.mutations.updatePost);

  const handleSubmit = async (data: PostFormData) => {
    try {
      await updatePost({
        id: postId,
        title: data.title,
        content: data.content,
        slug: data.slug,
        status: data.status,
        category: data.category?.length ? data.category : undefined,
        tags: data.tags?.length ? data.tags : undefined,
        excerpt: data.excerpt?.length ? data.excerpt : undefined,
        featuredImage: data.featuredImageUrl?.length
          ? data.featuredImageUrl
          : undefined,
      });
      toast.success("The post has been successfully updated.");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("There was an error updating the post.");
    }
  };

  return (
    <Form {...form}>
      <AdminSinglePostMain className="ADMIN_SINGLE_POST_MAIN border-none shadow-none">
        <PostForm
          formApi={form}
          onSubmit={handleSubmit}
          onCancel={onBack}
          submitButtonText="Save Post"
          initial={initialData}
          title=""
        />
      </AdminSinglePostMain>
      <AdminSinglePostSidebar>
        <PostStatusForm postId={postId} />
      </AdminSinglePostSidebar>
    </Form>
  );
}

function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [_isSubmitting] = useState(false);
  const postId = params.id as Id<"posts">;
  const tenant = useTenant();

  const post = useQuery(
    api.core.posts.queries.getPostById,
    postId
      ? tenant?._id
        ? { id: postId, organizationId: tenant._id }
        : { id: postId }
      : "skip",
  );

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
      featuredImageUrl:
        (post as unknown as { featuredImage?: string }).featuredImage ?? "",
      featured: (post as unknown as { featured?: boolean }).featured ?? false,
      readTime: (post as unknown as { readTime?: string }).readTime ?? "",
    };
  }, [post]);

  if (post === undefined) {
    return <div>Loading post...</div>;
  }
  if (!post || !initialData) {
    return <div>Post not found</div>;
  }

  return (
    <AdminSinglePost
      postType="post"
      postTitle={`Post`}
      postId={postId}
      isSubmitting={false}
      defaultTab="content"
      onSave={() => {
        /* header save handled via PostForm registration */
      }}
    >
      <AdminSinglePostHeader
        showBackButton={true}
        backUrl="/admin/store/orders"
        showSaveButton={true}
        saveButtonText="Save Post"
        className="sticky top-0 z-30"
      />
      <AdminSinglePostLayout className="container border-none shadow-none">
        <EditPostContent
          initialData={initialData}
          postId={postId}
          onBack={() => router.back()}
        />
      </AdminSinglePostLayout>
    </AdminSinglePost>
  );
}

export default EditPostPage;
