/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Reply, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";

import { Boxes } from "~/components/ui/background-boxes";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";

type ListByPostOutput = FunctionReturnType<
  typeof api.core.comments.queries.listByPost
>;

type CommentRow = ListByPostOutput["comments"][number];

type CommentNode = CommentRow & { children: CommentNode[] };

type CommentSortKey = "newest" | "popular";

const countDescendants = (node: CommentNode): number =>
  node.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);

const buildTree = (rows: CommentRow[]) => {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  rows.forEach((row) => {
    byId.set(String(row._id), { ...row, children: [] });
  });

  byId.forEach((node) => {
    const parentId = node.parentId ? String(node.parentId) : null;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRecursively = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => a.createdAt - b.createdAt);
    nodes.forEach((n) => sortRecursively(n.children));
  };

  sortRecursively(roots);
  return roots;
};

interface PostCommentsSectionProps {
  postId: string;
  organizationId?: Id<"organizations"> | null;
}

export function PostCommentsSection(props: PostCommentsSectionProps) {
  return (
    <PortalConvexProvider>
      <PostCommentsSectionInner {...props} />
    </PortalConvexProvider>
  );
}

function PostCommentsSectionInner({
  postId,
  organizationId,
}: PostCommentsSectionProps) {
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortKey, setSortKey] = useState<CommentSortKey>("newest");

  const result = useQuery(api.core.comments.queries.listByPost, {
    postId,
    ...(organizationId ? { organizationId } : {}),
  });

  const createComment = useMutation(api.core.comments.mutations.create);
  const removeComment = useMutation(api.core.comments.mutations.remove);

  const tree = useMemo(() => buildTree(result?.comments ?? []), [result]);
  const sortedTree = useMemo(() => {
    const roots = [...tree];
    if (sortKey === "newest") {
      roots.sort((a, b) => b.createdAt - a.createdAt);
      return roots;
    }
    roots.sort((a, b) => {
      const byReplies = countDescendants(b) - countDescendants(a);
      if (byReplies !== 0) return byReplies;
      return b.createdAt - a.createdAt;
    });
    return roots;
  }, [sortKey, tree]);
  const viewerUserId = result?.viewerUserId ?? null;
  const viewerIsAdmin = result?.viewerIsAdmin ?? false;

  const formatTime = (timestamp: number) =>
    formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const handleSubmitNew = async () => {
    if (!newCommentText.trim()) return;
    await createComment({
      postId,
      ...(organizationId ? { organizationId } : {}),
      content: newCommentText,
    });
    setNewCommentText("");
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    await createComment({
      postId,
      ...(organizationId ? { organizationId } : {}),
      content: replyText,
      parentId: parentId as Id<"comments">,
    });
    setReplyText("");
    setReplyingTo(null);
  };

  const canManage = (comment: CommentRow) =>
    viewerIsAdmin ||
    (viewerUserId !== null && comment.authorId === viewerUserId);

  const viewerInitial = viewerUserId ? "Y" : "U";

  return (
    <section className="bg-card relative overflow-hidden rounded-lg border p-6">
      <Boxes className="opacity-40" />
      <div className="pointer-events-none relative z-10">
        <h2 className="text-foreground text-xl font-semibold">Comments</h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">Join the discussion.</p>
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Sort
            </span>
            <Select
              value={sortKey}
              onValueChange={(value) => setSortKey(value as CommentSortKey)}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder="Sort comments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="mt-6 flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback>{viewerInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="pointer-events-auto min-h-[90px] resize-none bg-white"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitNew}
                  disabled={!newCommentText.trim()}
                  className="pointer-events-auto"
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
          <Separator />
        </div>
        <div className="mt-8 space-y-4">
          {(result?.comments?.length ?? 0) === 0 ? (
            <div className="bg-background/70 text-muted-foreground rounded-md border p-6 text-center text-sm backdrop-blur-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            sortedTree.map((node) => (
              <CommentItem
                key={String(node._id)}
                node={node}
                depth={0}
                formatTime={formatTime}
                canManage={canManage}
                replyingTo={replyingTo}
                onReplyStart={setReplyingTo}
                replyText={replyText}
                onReplyTextChange={setReplyText}
                onReplySubmit={handleSubmitReply}
                onDelete={async (id) => {
                  await removeComment({ id: id as Id<"comments"> });
                }}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function CommentItem({
  node,
  depth,
  formatTime,
  canManage,
  replyingTo,
  onReplyStart,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  onDelete,
}: {
  node: CommentNode;
  depth: number;
  formatTime: (timestamp: number) => string;
  canManage: (comment: CommentRow) => boolean;
  replyingTo: string | null;
  onReplyStart: (id: string | null) => void;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  onReplySubmit: (parentId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const id = String(node._id);
  const createdAt = node.createdAt ?? node._creationTime;
  const authorName = node.author?.name ?? "User";
  const authorImage = node.author?.image ?? undefined;

  const isReplying = replyingTo === id;

  return (
    <div className={depth > 0 ? "pl-8" : ""}>
      <div className="bg-muted/50 rounded-md border p-4">
        <div className="flex gap-3">
          <Avatar className="h-7 w-7">
            <AvatarImage src={authorImage} />
            <AvatarFallback>
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{authorName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatTime(createdAt)}
                  </span>
                </div>
              </div>
              {canManage(node) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="pointer-events-auto h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Comment actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => onDelete(id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <div className="mt-2 text-sm whitespace-pre-wrap">
              {node.content}
            </div>

            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="pointer-events-auto h-7 px-2"
                onClick={() => onReplyStart(isReplying ? null : id)}
              >
                <Reply className="mr-1 h-4 w-4" />
                Reply
              </Button>
            </div>

            {isReplying ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder={`Reply to ${authorName}...`}
                  value={replyText}
                  onChange={(e) => onReplyTextChange(e.target.value)}
                  className="pointer-events-auto min-h-[70px] resize-none text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReplyStart(null)}
                    className="pointer-events-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onReplySubmit(id)}
                    disabled={!replyText.trim()}
                    className="pointer-events-auto"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentItem
              key={String(child._id)}
              node={child}
              depth={depth + 1}
              formatTime={formatTime}
              canManage={canManage}
              replyingTo={replyingTo}
              onReplyStart={onReplyStart}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
