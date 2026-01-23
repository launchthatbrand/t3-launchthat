"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";
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

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [sort, setSort] = React.useState<"trending" | "new">("trending");

  const threads = useQuery(api.feedback.queries.listThreads, { sort }) as
    | Array<
        Record<string, unknown> & {
          _id: string;
          title?: string;
          status?: string;
          upvoteCount?: number;
          commentCount?: number;
          viewerHasUpvoted?: boolean;
          createdAt?: number;
        }
      >
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
      await createThread({ title: t, body: b } as any);
      setTitle("");
      setBody("");
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const rows = React.useMemo(() => (Array.isArray(threads) ? threads : []), [threads]);

  const columns = React.useMemo<ColumnDefinition<(typeof rows)[number]>[]>(
    () => [
      {
        id: "title",
        header: "Thread",
        accessorKey: "title",
        cell: (t) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white">{t.title ?? "Untitled"}</div>
            <div className="text-xs text-white/50 font-mono">{t._id}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (t) => <span className="text-sm text-white/80">{t.status ?? "—"}</span>,
        sortable: true,
      },
      {
        id: "comments",
        header: "Comments",
        accessorKey: "commentCount",
        cell: (t) => <span className="text-sm text-white/80">{t.commentCount ?? 0}</span>,
        sortable: true,
      },
      {
        id: "upvotes",
        header: "Upvotes",
        accessorKey: "upvoteCount",
        cell: (t) => <span className="text-sm text-white/80">{t.upvoteCount ?? 0}</span>,
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<(typeof rows)[number]>[]>(
    () => [
      {
        id: "open",
        label: "Open",
        variant: "outline",
        onClick: (t) => router.push(`/admin/feedback/${encodeURIComponent(t._id)}`),
      },
      {
        id: "upvote",
        label: (t) => (t.viewerHasUpvoted ? "Upvoted" : "Upvote"),
        variant: "secondary",
        onClick: (t) => void toggleUpvote({ threadId: t._id } as any),
      },
    ],
    [router, toggleUpvote],
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
        defaultViewMode="list"
        viewModes={["list"]}
        enableSearch={true}
        entityActions={entityActions}
        onRowClick={(t) => router.push(`/admin/feedback/${encodeURIComponent(t._id)}`)}
        getRowId={(t) => t._id}
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

