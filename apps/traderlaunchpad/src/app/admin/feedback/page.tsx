"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@convex-config/_generated/api";
import { useRouter } from "next/navigation";

interface FeedbackThreadRow extends Record<string, unknown> {
  _id: string;
  title?: string;
  status?: string;
  upvoteCount?: number;
  commentCount?: number;
  viewerHasUpvoted?: boolean;
  createdAt?: number;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [sort, setSort] = React.useState<"trending" | "new">("trending");

  const threads = useQuery(api.feedback.queries.listThreads, { sort }) as
    | FeedbackThreadRow[]
    | undefined;

  const toggleUpvote = useMutation(api.feedback.mutations.toggleUpvote);
  const createThread = useMutation(api.feedback.mutations.createThread);

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
      await createThread({ title: t, body: b });
      setTitle("");
      setBody("");
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const rows = React.useMemo<FeedbackThreadRow[]>(
    () => (Array.isArray(threads) ? threads : []),
    [threads],
  );

  const columns = React.useMemo<ColumnDefinition<FeedbackThreadRow>[]>(
    () => [
      {
        id: "title",
        header: "Thread",
        accessorKey: "title",
        cell: (t: FeedbackThreadRow) => (
          <span className="text-white">{t.title ?? "Untitled"}</span>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (t: FeedbackThreadRow) => (
          <span className="text-white/80">{t.status ?? "—"}</span>
        ),
        sortable: true,
      },
      {
        id: "comments",
        header: "Comments",
        accessorKey: "commentCount",
        cell: (t: FeedbackThreadRow) => (
          <span className="text-white/80">{t.commentCount ?? 0}</span>
        ),
        sortable: true,
      },
      {
        id: "upvotes",
        header: "Upvotes",
        accessorKey: "upvoteCount",
        cell: (t: FeedbackThreadRow) => (
          <span className="text-white/80">{t.upvoteCount ?? 0}</span>
        ),
        sortable: true,
      },
    ],
    [],
  );

  return (
    <div className="animate-in fade-in space-y-6 text-white duration-500">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="mt-1 text-white/60">Suggestions and feature requests.</p>
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

      <EntityList
        data={rows}
        columns={columns}
        isLoading={threads === undefined}
        defaultViewMode="grid"
        viewModes={[]}
        gridColumns={{ sm: 1, md: 1, lg: 1, xl: 1 }}
        enableSearch={true}
        onRowClick={(t: FeedbackThreadRow) =>
          router.push(`/admin/feedback/${encodeURIComponent(t._id)}`)
        }
        getRowId={(t) => t._id}
        itemRender={(t: FeedbackThreadRow) => {
          const id = String(t._id);
          const upvotes = typeof t.upvoteCount === "number" ? t.upvoteCount : 0;
          const comments = typeof t.commentCount === "number" ? t.commentCount : 0;
          return (
            <Card className="border-white/10 bg-black/20 transition-colors hover:bg-black/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base text-white hover:underline">
                      {t.title ?? "Untitled"}
                    </CardTitle>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void toggleUpvote({ threadId: id });
                    }}
                  >
                    {t.viewerHasUpvoted ? "Upvoted" : "Upvote"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/admin/feedback/${encodeURIComponent(id)}`);
                    }}
                  >
                    Open thread
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }}
        emptyState={
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">No feedback yet</CardTitle>
              <div className="text-sm text-white/60">
                Be the first to create a recommendation.
              </div>
            </CardHeader>
          </Card>
        }
      />

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
    </div>
  );
}

