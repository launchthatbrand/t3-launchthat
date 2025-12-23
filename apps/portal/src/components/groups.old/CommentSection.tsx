"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Flag,
  MoreVertical,
  Reply,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Spinner } from "@acme/ui/spinner";
import { Textarea } from "@acme/ui/textarea";
import { NoiseBackground } from "@acme/ui/noise-background";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface CommentSectionProps {
  postId: Id<"groupPosts">;
  groupId: Id<"groups">;
}

export function CommentSection({ postId, groupId }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get comments for this post
  const commentsResult = useQuery(api.groupPosts.listPostComments, {
    postId,
    paginationOpts: paginationCursor
      ? { cursor: paginationCursor }
      : { numItems: 20 },
  });

  // Get group details for permissions
  const group = useQuery(api.groups.queries.getGroupById, { groupId });

  // Get mutations for comment actions
  const createComment = useMutation(api.groupPosts.createComment);
  const moderateContent = useMutation(api.groupPosts.moderateContent);

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsLoading(true);
    try {
      await createComment({
        postId,
        content: commentText,
      });
      setCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentCommentId: Id<"groupComments">) => {
    if (!replyText.trim()) return;

    setIsLoading(true);
    try {
      await createComment({
        postId,
        content: replyText,
        parentCommentId,
      });
      setReplyText("");
      setReplyingTo(null);
      setShowReplies({ ...showReplies, [parentCommentId]: true });
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle comment moderation
  const handleModerateComment = async (
    commentId: Id<"groupComments">,
    action: "hide" | "show",
  ) => {
    try {
      const reason =
        action === "hide"
          ? prompt("Please provide a reason for hiding this comment:")
          : undefined;

      await moderateContent({
        contentType: "comment",
        contentId: commentId,
        action,
        reason: reason || undefined,
      });
    } catch (error) {
      console.error("Error moderating comment:", error);
    }
  };

  // Check if user can moderate content
  const canModerate =
    group?.userMembership?.role === "admin" ||
    group?.userMembership?.role === "moderator";

  // Filter out hidden comments unless user can moderate
  const comments =
    commentsResult?.comments?.filter(
      (comment) => canModerate || !comment.isHidden,
    ) || [];

  // Format the timestamp
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={group?.currentUser?.image} />
          <AvatarFallback>
            {group?.currentUser?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <NoiseBackground
              containerClassName="w-fit rounded-full p-1"
              gradientColors={[
                "rgb(255, 100, 150)",
                "rgb(100, 150, 255)",
                "rgb(255, 200, 100)",
              ]}
              noiseIntensity={0.18}
              speed={0.08}
              animating={!(!commentText.trim() || isLoading)}
            >
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isLoading}
                className="rounded-full border border-border/60 bg-background/70 font-semibold text-foreground hover:bg-background"
              >
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Post Comment
              </Button>
            </NoiseBackground>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id.toString()} className="space-y-2">
              {/* Main comment */}
              <div
                className={`rounded-md p-3 ${comment.isHidden ? "bg-muted/50" : "bg-muted"}`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.author?.image} />
                    <AvatarFallback>
                      {comment.author?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          {comment.author?.name || "Unknown user"}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatTime(comment._creationTime)}
                        </span>
                        {comment.isHidden && (
                          <span className="ml-2 text-xs italic text-muted-foreground">
                            [Hidden by moderator]
                          </span>
                        )}
                      </div>

                      {/* Comment actions menu */}
                      {canModerate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {comment.author?.id === group?.currentUserId && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingComment(comment._id);
                                  setEditText(comment.content);
                                }}
                              >
                                <Edit className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canModerate && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleModerateComment(
                                    comment._id,
                                    comment.isHidden ? "show" : "hide",
                                  )
                                }
                              >
                                <Flag className="mr-2 h-3.5 w-3.5" />
                                {comment.isHidden ? "Unhide" : "Hide"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Comment content or edit form */}
                    {editingComment === comment._id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setEditingComment(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            onClick={async () => {
                              // Update comment logic would go here
                              // For now just close the editor
                              setEditingComment(null);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 whitespace-pre-wrap text-sm">
                        {comment.content}
                      </div>
                    )}

                    {/* Comment actions */}
                    {!comment.isHidden && (
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment._id ? null : comment._id,
                            )
                          }
                          className="h-6 px-2"
                        >
                          <Reply className="mr-1 h-3 w-3" />
                          Reply
                        </Button>

                        {comment.replies && comment.replies.length > 0 && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setShowReplies({
                                ...showReplies,
                                [comment._id]: !showReplies[comment._id],
                              })
                            }
                            className="h-6 px-2"
                          >
                            {showReplies[comment._id] ? (
                              <ChevronUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ChevronDown className="mr-1 h-3 w-3" />
                            )}
                            {comment.replies.length} Replies
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply form */}
              {replyingTo === comment._id && (
                <div className="mt-2 pl-8">
                  <div className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={group?.currentUser?.image} />
                      <AvatarFallback>
                        {group?.currentUser?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder={`Reply to ${comment.author?.name}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => handleSubmitReply(comment._id)}
                          disabled={!replyText.trim() || isLoading}
                        >
                          {isLoading ? (
                            <Spinner size="xs" className="mr-1" />
                          ) : null}
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies &&
                comment.replies.length > 0 &&
                showReplies[comment._id] && (
                  <div className="space-y-2 pl-8">
                    {comment.replies
                      .filter((reply) => canModerate || !reply.isHidden)
                      .map((reply) => (
                        <div
                          key={reply._id.toString()}
                          className={`rounded-md p-3 ${reply.isHidden ? "bg-muted/30" : "bg-muted/70"}`}
                        >
                          <div className="flex gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={reply.author?.image} />
                              <AvatarFallback>
                                {reply.author?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-medium">
                                    {reply.author?.name || "Unknown user"}
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {formatTime(reply._creationTime)}
                                  </span>
                                  {reply.isHidden && (
                                    <span className="ml-1 text-xs italic text-muted-foreground">
                                      [Hidden]
                                    </span>
                                  )}
                                </div>

                                {canModerate && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                        <span className="sr-only">Menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-40"
                                    >
                                      {canModerate && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleModerateComment(
                                              reply._id,
                                              reply.isHidden ? "show" : "hide",
                                            )
                                          }
                                        >
                                          <Flag className="mr-2 h-3 w-3" />
                                          {reply.isHidden ? "Unhide" : "Hide"}
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              <div className="mt-1 whitespace-pre-wrap text-xs">
                                {reply.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          ))
        )}

        {/* Load more button */}
        {commentsResult && !commentsResult.isDone && (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Ensure cursor is a string or null before setting state
                const cursorValue = commentsResult.cursor;
                setPaginationCursor(
                  cursorValue === null ? null : String(cursorValue),
                );
              }}
            >
              Load More Comments
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
