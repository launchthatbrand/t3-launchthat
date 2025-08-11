"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { EditorViewer } from "~/components/blocks/editor-x/viewer";

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as Id<"posts">;

  const post = useQuery(
    api.core.posts.queries.getPostById,
    postId ? { id: postId } : "skip",
  );

  if (post === undefined) {
    return <div className="container py-6">Loading…</div>;
  }
  if (!post) {
    return <div className="container py-6">Post not found</div>;
  }

  // Try parse content as serialized editor state
  let serialized: object | undefined;
  try {
    serialized = post.content ? JSON.parse(post.content) : undefined;
    // ensure looks like an editor state
    if (
      !serialized ||
      typeof serialized !== "object" ||
      !("root" in serialized)
    ) {
      serialized = undefined;
    }
  } catch {
    serialized = undefined;
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {post.excerpt && (
            <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
          )}
          {serialized ? (
            <EditorViewer editorSerializedState={serialized} />
          ) : (
            <pre className="whitespace-pre-wrap">{post.content}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
