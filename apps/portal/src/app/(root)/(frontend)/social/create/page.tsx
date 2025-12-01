"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { PostCreator } from "launchthat-plugin-socialfeed/components";
import { toast } from "sonner";

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
            <p className="text-muted-foreground mb-4">
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
