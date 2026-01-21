"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import type { FeedbackAdapter, FeedbackSort, FeedbackThreadRow } from "./types";

export function FeedbackBoard(props: { adapter: FeedbackAdapter }) {
  const [sort, setSort] = React.useState<FeedbackSort>("trending");

  const threads = useQuery(props.adapter.api.queries.listThreads, {
    sort,
  }) as FeedbackThreadRow[] | undefined;

  const createThread = useMutation(props.adapter.api.mutations.createThread);
  const toggleUpvote = useMutation(props.adapter.api.mutations.toggleUpvote);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const handleCreate = async () => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return;
    setCreating(true);
    try {
      await createThread({ title: t, body: b } as any);
      setTitle("");
      setBody("");
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleUpvote = async (threadId: string) => {
    await toggleUpvote({ threadId } as any);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-white">Feedback</div>
          <div className="text-sm text-white/60">
            Suggest features, upvote what matters, and discuss implementation details.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={sort} onValueChange={(v) => setSort(v === "new" ? "new" : "trending")}>
            <TabsList className="border border-white/10 bg-black/20">
              <TabsTrigger value="trending" className="text-xs">
                Trending
              </TabsTrigger>
              <TabsTrigger value="new" className="text-xs">
                New
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => setCreateOpen(true)}
          >
            New recommendation
          </Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New recommendation</DialogTitle>
            <DialogDescription>
              Describe what you want built and why it matters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="feedback-title">Title</Label>
              <Input
                id="feedback-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Add plan violation alerts in Discord"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="feedback-body">Details</Label>
              <Textarea
                id="feedback-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Add context, examples, edge cases, or screenshots…"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleCreate}
                disabled={creating || !title.trim() || !body.trim()}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {creating ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {threads === undefined ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loading…</CardTitle>
              <CardDescription>Fetching community feedback.</CardDescription>
            </CardHeader>
          </Card>
        ) : threads.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No feedback yet</CardTitle>
              <CardDescription>
                Be the first to create a recommendation.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          threads.map((t) => {
            const id = String(t._id);
            const upvotes = typeof t.upvoteCount === "number" ? t.upvoteCount : 0;
            const comments = typeof t.commentCount === "number" ? t.commentCount : 0;
            return (
              <Card key={id} className="border-white/10 bg-black/20 transition-colors hover:bg-black/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link href={`/admin/feedback/${encodeURIComponent(id)}`} className="block">
                        <CardTitle className="text-base text-white hover:underline">
                          {t.title ?? "Untitled"}
                        </CardTitle>
                      </Link>
                      <div className="text-xs text-white/50">
                        {comments} comments • {upvotes} upvotes
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={t.viewerHasUpvoted ? "default" : "outline"}
                      className={
                        t.viewerHasUpvoted
                          ? "bg-orange-600 text-white hover:bg-orange-700"
                          : ""
                      }
                      onClick={() => void handleToggleUpvote(id)}
                    >
                      {t.viewerHasUpvoted ? "Upvoted" : "Upvote"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-white/75 line-clamp-3 whitespace-pre-wrap">
                    {t.body ?? ""}
                  </div>
                  <div className="flex justify-end">
                    <Button asChild type="button" variant="outline">
                      <Link href={`/admin/feedback/${encodeURIComponent(id)}`}>
                        Open thread
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

