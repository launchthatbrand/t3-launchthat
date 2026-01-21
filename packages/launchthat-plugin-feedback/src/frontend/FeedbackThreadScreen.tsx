"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { ScrollArea } from "@acme/ui/scroll-area";

import type { FeedbackAdapter, FeedbackCommentRow, FeedbackThreadRow } from "./types";

export function FeedbackThreadScreen(props: {
  adapter: FeedbackAdapter;
  threadId: string;
  headerLeftSlot?: React.ReactNode;
}) {
  const thread = useQuery(props.adapter.api.queries.getThread, {
    threadId: props.threadId,
  }) as FeedbackThreadRow | null | undefined;

  const comments = useQuery(props.adapter.api.queries.listComments, {
    threadId: props.threadId,
  }) as FeedbackCommentRow[] | undefined;

  const toggleUpvote = useMutation(props.adapter.api.mutations.toggleUpvote);
  const addComment = useMutation(props.adapter.api.mutations.addComment);

  const [commentBody, setCommentBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [upvoting, setUpvoting] = React.useState(false);

  const handleUpvote = async () => {
    setUpvoting(true);
    try {
      await toggleUpvote({ threadId: props.threadId } as any);
    } finally {
      setUpvoting(false);
    }
  };

  const handleAddComment = async () => {
    const body = commentBody.trim();
    if (!body) return;
    setSubmitting(true);
    try {
      await addComment({ threadId: props.threadId, body } as any);
      setCommentBody("");
    } finally {
      setSubmitting(false);
    }
  };

  if (thread === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loading…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/60">
            This feedback thread doesn’t exist (or you don’t have access).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">{props.headerLeftSlot}</div>
      </div>

      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl text-white">{thread.title ?? "Feedback"}</CardTitle>
              <div className="text-xs text-white/50">
                {typeof thread.commentCount === "number"
                  ? `${thread.commentCount} comments`
                  : ""}{" "}
                {typeof thread.upvoteCount === "number" ? `• ${thread.upvoteCount} upvotes` : ""}
              </div>
            </div>

            <Button
              type="button"
              variant={thread.viewerHasUpvoted ? "default" : "outline"}
              className={
                thread.viewerHasUpvoted ? "bg-orange-600 text-white hover:bg-orange-700" : ""
              }
              onClick={handleUpvote}
              disabled={upvoting}
            >
              {thread.viewerHasUpvoted ? "Upvoted" : "Upvote"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-white/80 whitespace-pre-wrap">{thread.body ?? ""}</div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-[360px] pr-2">
            <div className="space-y-2">
              {(comments ?? []).length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/60">
                  No comments yet.
                </div>
              ) : (
                (comments ?? []).map((c) => (
                  <div
                    key={String(c._id)}
                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                  >
                    <div className="text-xs text-white/50">
                      {c.authorUserId ? `User: ${c.authorUserId}` : "User"}
                    </div>
                    <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap">
                      {c.body ?? ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="grid gap-2">
            <Label htmlFor="feedback-comment">Add a comment</Label>
            <Input
              id="feedback-comment"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Share details, examples, or clarifying questions…"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddComment}
                disabled={submitting || !commentBody.trim()}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {submitting ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

