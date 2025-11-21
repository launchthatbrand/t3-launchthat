"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Edit,
  ExternalLink,
  Flag,
  Heart,
  ImageIcon,
  Maximize2,
  MessageCircle,
  MoreVertical,
  Pin,
  Share,
  ThumbsUp,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@acme/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { CommentThread } from "./CommentThread";
import type { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { ShareButton } from "./ShareButton";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export interface PostCardProps {
  post: {
    _id: Id<"feedItems">;
    _creationTime: number;
    contentType: "post" | "share" | "comment";
    content: string;
    creatorId: Id<"users">;
    visibility: "public" | "private" | "group";
    mediaUrls?: string[];
    originalContentId?: Id<"feedItems">;
    moduleType?: "blog" | "course" | "group" | "event";
    moduleId?: string;
    reactionsCount: number;
    commentsCount: number;
    isPinned?: boolean;
    creator: {
      _id: Id<"users">;
      name: string;
      image?: string;
    };
  };
  onDelete?: () => void;
  onEdit?: (postId: Id<"feedItems">) => void;
  onReply?: (postId: Id<"feedItems">) => void;
  onShare?: (postId: Id<"feedItems">) => void;
  onPin?: (postId: Id<"feedItems">, isPinned: boolean) => void;
  className?: string;
  isDetailView?: boolean;
}

interface Comment {
  _id: Id<"comments">;
  _creationTime: number;
  content: string;
  authorId: Id<"users">;
  author: {
    _id: Id<"users">;
    name: string;
    image?: string;
  };
}

const MAX_CONTENT_LENGTH = 300; // Characters before "show more" button appears

export function PostCard({
  post,
  onDelete,
  onEdit,
  onReply,
  onShare,
  onPin,
  className = "",
  isDetailView = false,
}: PostCardProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reactionsCount, setReactionsCount] = useState(post.reactionsCount);
  const [expandContent, setExpandContent] = useState(isDetailView);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isPinned, setIsPinned] = useState(post.isPinned || false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Mutations
  const addReaction = useMutation(api.socialfeed.mutations.addReaction);
  const removeReaction = useMutation(api.socialfeed.mutations.removeReaction);
  const saveItem = useMutation(api.socialfeed.mutations.saveItem);
  const unsaveItem = useMutation(api.socialfeed.mutations.unsaveItem);
  const deletePost = useMutation(api.socialfeed.mutations.deletePost);
  const addComment = useMutation(api.socialfeed.mutations.addComment);
  const shareContent = useMutation(api.socialfeed.mutations.shareContent);

  // Queries
  const comments =
    useQuery(api.socialfeed.queries.getComments, {
      feedItemId: post._id,
      paginationOpts: { numItems: 10, cursor: null },
    }) || [];

  // Check if the content should show a "Read more" button
  const shouldTruncate =
    !expandContent && post.content.length > MAX_CONTENT_LENGTH && !isDetailView;
  const displayContent = shouldTruncate
    ? post.content.slice(0, MAX_CONTENT_LENGTH) + "..."
    : post.content;

  // Check if we can show media gallery
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;

  // Format the creation time
  const formattedTime = formatDistanceToNow(new Date(post._creationTime), {
    addSuffix: true,
  });

  // For original content in case this is a shared post
  const originalPost = useQuery(
    api.socialfeed.queries.getFeedItem,
    post.originalContentId ? { feedItemId: post.originalContentId } : "skip",
  );

  // Check user permissions
  const isCurrentUser = userId === post.creatorId;
  const canModerate = isCurrentUser; // In a real app, also check for admin/moderator role

  // Handle reactions
  const handleReactionToggle = async () => {
    if (!userId) {
      toast.error("Please sign in to react to posts");
      return;
    }

    try {
      if (isLiked) {
        await removeReaction({
          userId: userId as Id<"users">,
          feedItemId: post._id,
        });
        setReactionsCount((prev) => Math.max(0, prev - 1));
      } else {
        await addReaction({
          userId: userId as Id<"users">,
          feedItemId: post._id,
          reactionType: "like",
        });
        setReactionsCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Failed to update reaction");
    }
  };

  // Handle save/bookmark
  const handleSaveToggle = async () => {
    if (!userId) {
      toast.error("Please sign in to save posts");
      return;
    }

    try {
      if (isSaved) {
        await unsaveItem({
          userId: userId as Id<"users">,
          feedItemId: post._id,
        });
        toast.success("Post removed from saved items");
      } else {
        await saveItem({
          userId: userId as Id<"users">,
          feedItemId: post._id,
        });
        toast.success("Post saved to your collection");
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update saved status");
    }
  };

  // Handle comment toggle
  const handleCommentToggle = () => {
    setShowComments(!showComments);

    // Focus the comment input when opening comments
    if (!showComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
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
        userId: userId as Id<"users">,
        feedItemId: post._id,
        content: commentText.trim(),
      });

      setCommentText("");
      toast.success("Comment added");

      // Refetch comments (in a real app, this would happen automatically)
      // For now we rely on the query to update
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle share
  const handleShare = () => {
    if (!userId) {
      toast.error("Please sign in to share posts");
      return;
    }

    if (onShare) {
      onShare(post._id);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!canModerate) {
      toast.error("You don't have permission to delete this post");
      return;
    }

    try {
      await deletePost({
        postId: post._id,
        userId: userId as Id<"users">,
      });

      toast.success("Post deleted");
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!canModerate) {
      toast.error("You don't have permission to edit this post");
      return;
    }

    if (onEdit) {
      onEdit(post._id);
    } else {
      // Navigate to edit page if no handler is provided
      router.push(`/social/edit/${post._id}`);
    }
  };

  // Handle pin toggle
  const handlePinToggle = async () => {
    if (!canModerate) {
      toast.error("You don't have permission to pin this post");
      return;
    }

    try {
      setIsPinned(!isPinned);

      if (onPin) {
        onPin(post._id, !isPinned);
      }

      toast.success(isPinned ? "Post unpinned" : "Post pinned");
    } catch (error) {
      console.error("Error toggling pin status:", error);
      toast.error("Failed to update pin status");
      setIsPinned(isPinned); // Revert on failure
    }
  };

  // Handle view details
  const handleViewDetails = () => {
    // Navigate to the detail view
    router.push(`/social/post/${post._id}`);
  };

  // Handle media navigation
  const handleNextMedia = () => {
    if (post.mediaUrls && activeMediaIndex < post.mediaUrls.length - 1) {
      setActiveMediaIndex(activeMediaIndex + 1);
    }
  };

  const handlePreviousMedia = () => {
    if (activeMediaIndex > 0) {
      setActiveMediaIndex(activeMediaIndex - 1);
    }
  };

  // Prepare content for sharing
  const contentToShare = {
    id: post._id,
    type: "feedItem" as const,
    title:
      post.content.substring(0, 50) + (post.content.length > 50 ? "..." : ""),
    description:
      post.contentType === "share" && post.originalContentId
        ? "Shared post"
        : `Post by ${post.creator.name}`,
    imageUrl: post.mediaUrls?.[0],
  };

  return (
    <>
      <Card
        className={`overflow-hidden ${isPinned ? "border-primary" : ""} ${className}`}
      >
        <CardHeader className="flex flex-row items-start p-4 pb-0">
          <div className="flex flex-1 items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.creator.image} alt={post.creator.name} />
              <AvatarFallback>
                {post.creator.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium hover:underline">
                  <Link href={`/profile/${post.creatorId}`}>
                    {post.creator.name}
                  </Link>
                </div>
                {isPinned && (
                  <Badge variant="outline" className="text-xs">
                    Pinned
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{formattedTime}</span>
                {post.visibility !== "public" && (
                  <span className="ml-2">
                    • {post.visibility === "private" ? "Only Me" : "Group"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canModerate ? (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePinToggle}>
                    <Pin className="mr-2 h-4 w-4" />
                    {isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleSaveToggle}>
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        Unsave
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!isDetailView && (
                <DropdownMenuItem onClick={handleViewDetails}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          {/* Post content */}
          <div className="whitespace-pre-line">
            <p>{displayContent}</p>
            {shouldTruncate && (
              <Button
                variant="link"
                className="px-0 hover:underline"
                onClick={() => setExpandContent(true)}
              >
                Read more
              </Button>
            )}
          </div>

          {/* Media gallery */}
          {hasMedia && (
            <div className="mt-3">
              {showMediaGallery ? (
                <Dialog
                  open={showMediaGallery}
                  onOpenChange={setShowMediaGallery}
                >
                  <DialogContent className="max-w-4xl p-1 sm:p-2">
                    <div className="relative aspect-video bg-black">
                      <img
                        src={post.mediaUrls?.[activeMediaIndex]}
                        alt={`Media ${activeMediaIndex + 1}`}
                        className="h-full w-full object-contain"
                      />

                      {post.mediaUrls && post.mediaUrls.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {post.mediaUrls.map((_, index) => (
                            <Button
                              key={index}
                              variant={
                                index === activeMediaIndex
                                  ? "primary"
                                  : "outline"
                              }
                              size="sm"
                              className="h-6 w-6 rounded-full p-0"
                              onClick={() => setActiveMediaIndex(index)}
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="relative">
                  <div className="grid grid-cols-2 gap-2">
                    {post.mediaUrls?.slice(0, 4).map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-video cursor-pointer overflow-hidden rounded-md bg-muted"
                        onClick={() => {
                          setActiveMediaIndex(index);
                          setShowMediaGallery(true);
                        }}
                      >
                        <img
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {index === 3 &&
                          post.mediaUrls &&
                          post.mediaUrls.length > 4 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                              <span>+{post.mediaUrls.length - 4} more</span>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setActiveMediaIndex(0);
                        setShowMediaGallery(true);
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* If this is a shared post, show original content reference */}
          {post.contentType === "share" && post.originalContentId && (
            <div className="mt-3 rounded-md border bg-muted/30 p-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Share className="mr-2 h-4 w-4" />
                Shared post
              </div>

              {originalPost ? (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={originalPost.creator?.image}
                        alt={originalPost.creator?.name}
                      />
                      <AvatarFallback>
                        {originalPost.creator?.name
                          .substring(0, 2)
                          .toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">
                      {originalPost.creator?.name || "Unknown"}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm">
                    {originalPost.content}
                  </p>
                  {originalPost.mediaUrls &&
                    originalPost.mediaUrls.length > 0 && (
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        {originalPost.mediaUrls.length} media attachment
                        {originalPost.mediaUrls.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() =>
                      router.push(`/social/post/${post.originalContentId}`)
                    }
                  >
                    View original post
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex justify-center py-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t px-4 py-2">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              onClick={handleReactionToggle}
            >
              {isLiked ? (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              <span>{reactionsCount > 0 ? reactionsCount : ""}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              onClick={handleCommentToggle}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments.length > 0 ? comments.length : ""}</span>
            </Button>

            <ShareButton
              content={contentToShare}
              onShareComplete={onShare ? () => onShare(post._id) : undefined}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center"
            onClick={handleSaveToggle}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </CardFooter>

        {/* Comment section */}
        {showComments && (
          <div className="border-t px-4 py-3">
            <CommentThread
              postId={post._id}
              onCommentAdded={() => {
                // Update the comment count when a comment is added
                setShowComments(true);
              }}
            />
          </div>
        )}
      </Card>
    </>
  );
}
