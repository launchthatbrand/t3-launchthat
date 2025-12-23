"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Flag,
  MessageSquareMore,
  MoreVertical,
  ThumbsUp,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";
import { NoiseBackground } from "@acme/ui/noise-background";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import {
  useSocialFeedApi,
  useSocialFeedAuth,
  useSocialFeedMutation,
  useSocialFeedQuery,
} from "../context/SocialFeedClientProvider";

// Sorting options for comments
type SortOption = "newest" | "oldest" | "popular";

export interface CommentThreadProps {
  postId: string;
  postType?:
    | "feedItem"
    | "course"
    | "lesson"
    | "topic"
    | "quiz"
    | "post"
    | "download"
    | "helpdeskArticle";
  onCommentAdded?: () => void;
  className?: string;
  initialExpanded?: boolean;
}

interface Comment {
  _id: string;
  _creationTime: number;
  parentId: string;
  parentType:
    | "feedItem"
    | "course"
    | "lesson"
    | "topic"
    | "quiz"
    | "post"
    | "download"
    | "helpdeskArticle";
  userId: string;
  content: string;
  parentCommentId?: string;
  mediaUrls?: string[];
  updatedAt?: number;
  user: {
    _id: string;
    name: string;
    image?: string;
  };
  repliesCount: number;
}

type PaginatedComments = {
  page: Comment[];
  continueCursor: string | null;
  isDone: boolean;
};

type PaginatedReplies = PaginatedComments;

export function CommentThread({
  postId,
  postType = "feedItem",
  onCommentAdded,
  className = "",
  initialExpanded = false,
}: CommentThreadProps) {
  const socialfeedApi = useSocialFeedApi<any>();
  const { userId } = useSocialFeedAuth();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionResults, setMentionResults] = useState<
    Array<{ id: string; name: string; image?: string }>
  >([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [viewCount, setViewCount] = useState(5); // Initial number of comments to show
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get comments based on sort option
  const commentsResponse = useSocialFeedQuery(
    socialfeedApi?.queries?.getComments,
    socialfeedApi
      ? {
          parentId: postId,
          parentType: postType,
          paginationOpts: {
            numItems: viewCount,
            cursor: null as string | null,
          },
          sortOrder: sortOption === "oldest" ? "oldest" : "newest",
        }
      : "skip",
  ) as Comment[] | PaginatedComments | undefined;

  const hasMore = useMemo(() => {
    if (!commentsResponse) return false;
    if (Array.isArray(commentsResponse)) return false;
    return !commentsResponse.isDone;
  }, [commentsResponse]);

  const rawComments: Comment[] = Array.isArray(commentsResponse)
    ? commentsResponse
    : (commentsResponse?.page ?? []);
  const comments: Comment[] = useMemo(() => {
    if (sortOption !== "popular") return rawComments;
    return [...rawComments].sort((a, b) => {
      const byReplies = (b.repliesCount ?? 0) - (a.repliesCount ?? 0);
      if (byReplies !== 0) return byReplies;
      return b._creationTime - a._creationTime;
    });
  }, [rawComments, sortOption]);

  // Mutations
  const addComment = useSocialFeedMutation(
    socialfeedApi?.mutations?.addComment,
  );
  const updateComment = useSocialFeedMutation(
    socialfeedApi?.mutations?.updateComment,
  );
  const deleteComment = useSocialFeedMutation(
    socialfeedApi?.mutations?.deleteComment,
  );
  const addReaction = useSocialFeedMutation(
    socialfeedApi?.mutations?.addReaction,
  );
  const removeReaction = useSocialFeedMutation(
    socialfeedApi?.mutations?.removeReaction,
  );

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setViewCount(5);
  };

  // Handle load more comments
  const handleLoadMore = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    setViewCount((prev) => prev + 5);
    setIsLoadingMore(false);
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      setIsSubmittingComment(true);

      await addComment({
        parentId: postId,
        parentType: postType,
        content: commentText.trim(),
      });

      setCommentText("");
      if (onCommentAdded) {
        onCommentAdded();
      }
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentCommentId: string) => {
    if (!userId) {
      toast.error("Please sign in to reply");
      return;
    }

    if (!replyText.trim()) {
      return;
    }

    try {
      await addComment({
        parentId: postId,
        parentType: postType,
        content: replyText.trim(),
        parentCommentId,
      });

      setReplyText("");
      setReplyingTo(null);
      // Expand the comment thread to show the new reply
      setExpandedComments(
        new Set([...expandedComments, parentCommentId.toString()]),
      );

      if (onCommentAdded) {
        onCommentAdded();
      }
      toast.success("Reply added");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please sign in to edit");
      return;
    }

    if (!editText.trim()) {
      return;
    }

    try {
      await updateComment({
        commentId,
        content: editText.trim(),
      });

      setEditingComment(null);
      setEditText("");
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      toast.error("Please sign in to delete");
      return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await deleteComment({
        commentId,
      });

      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Toggle comment thread expansion
  const toggleCommentExpansion = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // Check if a comment is expanded
  const isCommentExpanded = (commentId: string) => {
    return expandedComments.has(commentId);
  };

  // Handle mention searching
  const handleMentionSearch = (text: string) => {
    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      const searchTerm = mentionMatch[1] ?? "";
      setMentionSearch(searchTerm);

      // Show mention dropdown if there's a search term
      setShowMentionDropdown(!!searchTerm);

      // TODO: Implement user search by name for mention suggestions
      // This would typically query a users API with the search term
      // For now, just simulate with empty results
      setMentionResults([]);
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Insert mention into comment text
  const insertMention = (user: { id: string; name: string }) => {
    const mentionText = `@${user.name} `;
    const newText = commentText.replace(/@\w*$/, mentionText);
    setCommentText(newText);
    setShowMentionDropdown(false);

    // Focus back on the input after selecting a mention
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Handle reactions on comments
  const handleCommentReaction = async (commentId: string, isLiked: boolean) => {
    toast.info("Reactions are coming soon");
    void commentId;
    void isLiked;
  };

  // Report comment
  const handleReportComment = (commentId: string) => {
    toast.info("Report functionality coming soon");
    // This would typically open a report modal or form
    void commentId;
  };

  // Render a single comment item with its replies
  const renderComment = (comment: Comment, depth = 0) => {
    const isEditing = editingComment === comment._id;
    const isReplying = replyingTo === comment._id;
    const canEdit = userId === comment.userId;
    const isExpanded = isCommentExpanded(comment._id.toString());

    return (
      <div key={comment._id} className={`${depth > 0 ? "ml-6" : ""}`}>
        <div className="flex gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.image} alt={comment.user.name} />
            <AvatarFallback>
              {comment.user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* Comment content */}
            <div className="bg-muted rounded-md p-2">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="cursor-pointer text-sm font-medium hover:underline">
                            {comment.user.name}
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="flex justify-between space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={comment.user.image} />
                              <AvatarFallback>
                                {comment.user.name
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">
                                {comment.user.name}
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 rounded-full p-0"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View profile</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingComment(comment._id);
                            setEditText(comment.content);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleReportComment(comment._id)}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isEditing ? (
                <div className="mt-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[60px] w-full resize-none"
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingComment(null);
                        setEditText("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment._id)}
                      disabled={!editText.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}

              {comment.mediaUrls && comment.mediaUrls.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {comment.mediaUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Comment attachment ${index + 1}`}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Comment actions */}
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
              <span>
                {formatDistanceToNow(
                  new Date(comment.updatedAt || comment._creationTime),
                  {
                    addSuffix: true,
                  },
                )}
                {comment.updatedAt &&
                  comment.updatedAt > comment._creationTime &&
                  " (edited)"}
              </span>

              <Button
                variant="link"
                className="text-muted-foreground h-auto p-0 text-xs"
                // This would typically check if the user has already liked the comment
                onClick={() => handleCommentReaction(comment._id, false)}
              >
                Like
              </Button>

              <Button
                variant="link"
                className="text-muted-foreground h-auto p-0 text-xs"
                onClick={() => {
                  setReplyingTo(
                    replyingTo === comment._id ? null : comment._id,
                  );
                  setReplyText("");
                }}
              >
                Reply
              </Button>

              {comment.repliesCount > 0 && (
                <Button
                  variant="link"
                  className="text-muted-foreground flex h-auto items-center p-0 text-xs"
                  onClick={() => toggleCommentExpansion(comment._id.toString())}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Hide Replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      Show {comment.repliesCount}{" "}
                      {comment.repliesCount === 1 ? "Reply" : "Replies"}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Reply form */}
            {isReplying && (
              <div className="mt-3 flex gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{userId ? "ME" : "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder={`Reply to ${comment.user.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[60px] w-full resize-none text-sm"
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment._id)}
                      disabled={!replyText.trim()}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {isExpanded ? (
              <CommentReplies
                parentCommentId={comment._id}
                depth={depth}
                renderComment={renderComment}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment sort options */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs tracking-wide uppercase">
            Comments
          </Badge>
          {comments.length > 0 ? (
            <span className="text-muted-foreground text-xs">
              ({comments.length})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Sort by:</span>
          <select
            className="border-none bg-transparent text-xs outline-none"
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmitComment}>
        <div className="flex gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userId ? "ME" : "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={commentInputRef}
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                handleMentionSearch(e.target.value);
              }}
              className="min-h-[60px] w-full resize-none"
              disabled={!userId || isSubmittingComment}
            />

            {/* Mention dropdown */}
            {showMentionDropdown && (
              <div className="bg-background absolute z-10 mt-1 w-64 rounded-md border shadow-lg">
                {mentionResults.length > 0 ? (
                  <ul className="max-h-60 overflow-auto p-1">
                    {mentionResults.map((user) => (
                      <li
                        key={user.id}
                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md p-2"
                        onClick={() => insertMention(user)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground p-2 text-center text-sm">
                    No users found
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 flex justify-end">
              <NoiseBackground
                containerClassName="w-fit rounded-full p-1"
                gradientColors={[
                  "rgb(255, 100, 150)",
                  "rgb(100, 150, 255)",
                  "rgb(255, 200, 100)",
                ]}
                noiseIntensity={0.18}
                speed={0.08}
                animating={
                  !(!commentText.trim() || isSubmittingComment || !userId)
                }
              >
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !commentText.trim() || isSubmittingComment || !userId
                  }
                  className="border-border/60 bg-background/70 text-foreground hover:bg-background rounded-full border font-semibold"
                >
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </NoiseBackground>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <span className="flex items-center">
                    <Skeleton className="mr-2 h-4 w-4 rounded-full" />
                    Loading...
                  </span>
                ) : (
                  "Load More Comments"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground py-6 text-center">
          <MessageSquareMore className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-2">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}

function CommentReplies({
  parentCommentId,
  depth,
  renderComment,
}: {
  parentCommentId: string;
  depth: number;
  renderComment: (comment: Comment, depth: number) => React.ReactNode;
}) {
  const socialfeedApi = useSocialFeedApi<any>();

  const repliesResponse = useSocialFeedQuery(
    socialfeedApi?.queries?.getReplies,
    socialfeedApi
      ? {
          parentCommentId,
          paginationOpts: { numItems: 10, cursor: null as string | null },
        }
      : "skip",
  ) as Comment[] | PaginatedReplies | undefined;

  const replies: Comment[] = Array.isArray(repliesResponse)
    ? repliesResponse
    : (repliesResponse?.page ?? []);

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="border-muted mt-3 space-y-4 border-l-2 pl-3">
      {replies.map((reply) => renderComment(reply, depth + 1))}
    </div>
  );
}
