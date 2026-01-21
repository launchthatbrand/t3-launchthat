"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { ScrollArea } from "@acme/ui/scroll-area";

import type { FeedbackAdapter, FeedbackCommentRow, FeedbackThreadRow } from "./types";

export function FeedbackThreadModal(props: {
  adapter: FeedbackAdapter;
  threadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const thread = useQuery(
    props.adapter.api.queries.getThread,
    props.threadId ? { threadId: props.threadId } : "skip",
  ) as FeedbackThreadRow | null | undefined;

  const comments = useQuery(
    props.adapter.api.queries.listComments,
    props.threadId ? { threadId: props.threadId } : "skip",
  ) as FeedbackCommentRow[] | undefined;

  const toggleUpvote = useMutation(props.adapter.api.mutations.toggleUpvote);
  const addComment = useMutation(props.adapter.api.mutations.addComment);

  const [commentBody, setCommentBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [upvoting, setUpvoting] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) {
      setCommentBody("");
    }
  }, [props.open]);

  const handleUpvote = async () => {
    if (!props.threadId) return;
    setUpvoting(true);
    try {
      await toggleUpvote({ threadId: props.threadId } as any);
    } finally {
      setUpvoting(false);
    }
  };

  const handleAddComment = async () => {
    if (!props.threadId) return;
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

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{thread?.title ?? "Feedback"}</DialogTitle>
          <DialogDescription>
            Vote and discuss what the community wants next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm whitespace-pre-wrap text-white/80">
                {thread?.body ?? ""}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-white/60">
                  {typeof thread?.upvoteCount === "number"
                    ? `${thread.upvoteCount} upvotes`
                    : ""}
                  {typeof thread?.commentCount === "number"
                    ? ` • ${thread.commentCount} comments`
                    : ""}
                </div>
                <Button
                  type="button"
                  variant={thread?.viewerHasUpvoted ? "default" : "outline"}
                  className={
                    thread?.viewerHasUpvoted
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : ""
                  }
                  onClick={handleUpvote}
                  disabled={upvoting}
                >
                  {thread?.viewerHasUpvoted ? "Upvoted" : "Upvote"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[260px] pr-2">
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
      </DialogContent>
    </Dialog>
  );
}

