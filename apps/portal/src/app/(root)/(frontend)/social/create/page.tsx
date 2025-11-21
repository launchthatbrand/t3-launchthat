"use client";

import Link from "next/link";
import { PostCreator } from "~/components/social/PostCreator";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { userId } = useAuth();

  // Handle post creation success
  const handlePostSuccess = () => {
    // Show success message
    toast("Your post has been published successfully.");

    // Redirect to feed page
    router.push("/social/feed");
  };

  // Handle cancellation
  const handleCancel = () => {
    router.back();
  };

  // If not authenticated, show a message
  if (!isAuthenticated || !userId) {
    return (
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">Create Post</h1>
          <div className="rounded-lg border p-8 text-center">
            <p className="mb-4 text-muted-foreground">
              You need to be signed in to create a post.
            </p>
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">Create Post</h1>
        <PostCreator
          autoFocus
          onSuccess={handlePostSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
