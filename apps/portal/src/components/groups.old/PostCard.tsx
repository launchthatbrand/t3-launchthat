"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  File,
  Flag,
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  PinIcon,
  ThumbsUp,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Textarea } from "@acme/ui/textarea";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CommentSection } from "./CommentSection";

interface PostCardProps {
  post: {
    _id: Id<"groupPosts">;
    _creationTime: number;
    groupId: Id<"groups">;
    authorId: Id<"users">;
    content: string;
    pinnedAt?: number;
    attachments?: {
      type: "image" | "video" | "file";
      url: string;
      name?: string;
      size?: number;
    }[];
    author?: {
      id: Id<"users">;
      name: string;
      image?: string;
    };
    commentCount?: number;
  };
  groupId: Id<"groups">;
}

export function PostCard({ post, groupId }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  // Get the current user's role in the group
  const group = useQuery(api.groups.queries.getGroupById, { groupId });

  // Get mutations for post actions
  const updatePost = useMutation(api.groupPosts.updateGroupPost);
  const deletePost = useMutation(api.groupPosts.deleteGroupPost);
  const moderateContent = useMutation(api.groupPosts.moderateContent);

  // Check if user has edit permissions
  const canEdit =
    group?.userMembership?.role === "admin" ||
    group?.userMembership?.role === "moderator" ||
    post.author?.id === group?.currentUserId;

  // Check if user has moderation permissions
  const canModerate =
    group?.userMembership?.role === "admin" ||
    group?.userMembership?.role === "moderator";

  // Format the creation time
  const formattedTime = formatDistanceToNow(new Date(post._creationTime), {
    addSuffix: true,
  });

  // Handle post update
  const handleUpdatePost = async () => {
    if (editedContent === post.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updatePost({
        postId: post._id,
        updates: {
          content: editedContent,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost({
        postId: post._id,
      });
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Handle post moderation
  const handleModeratePost = async (action: "hide" | "show") => {
    try {
      const reason =
        action === "hide"
          ? prompt("Please provide a reason for hiding this post:")
          : undefined;

      await moderateContent({
        contentType: "post",
        contentId: post._id,
        action,
        reason: reason || undefined,
      });
    } catch (error) {
      console.error("Error moderating post:", error);
    }
  };

  // Render image attachments
  const renderImageAttachments = () => {
    const images = post.attachments?.filter((a) => a.type === "image") || [];
    if (images.length === 0) return null;

    // Simple grid layout based on image count
    return (
      <div
        className={`mt-4 grid gap-2 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {images.map((image, index) => (
          <a
            key={index}
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-md border bg-muted"
          >
            <img
              src={image.url}
              alt={image.name || `Image ${index + 1}`}
              className="h-auto w-full object-cover"
            />
          </a>
        ))}
      </div>
    );
  };

  // Render file attachments
  const renderFileAttachments = () => {
    const files =
      post.attachments?.filter(
        (a) => a.type === "file" || a.type === "video",
      ) || [];
    if (files.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        {files.map((file, index) => (
          <a
            key={index}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border bg-muted p-2 text-sm hover:bg-muted/80"
          >
            {file.type === "video" ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <File className="h-4 w-4" />
            )}
            <span className="flex-1 truncate">
              {file.name || `File ${index + 1}`}
            </span>
            <Badge variant="outline" className="ml-auto">
              {formatFileSize(file.size)}
            </Badge>
          </a>
        ))}
      </div>
    );
  };

  // Helper to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
        <Avatar>
          <AvatarImage
            src={post.author?.image}
            alt={post.author?.name || "User"}
          />
          <AvatarFallback>{post.author?.name.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">
                {post.author?.name || "Unknown user"}
              </span>
              <span className="text-sm text-muted-foreground">
                {" "}
                · {formattedTime}
              </span>
              {post.pinnedAt && (
                <Badge variant="outline" className="ml-2">
                  <PinIcon className="mr-1 h-3 w-3" />
                  Pinned
                </Badge>
              )}
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem onClick={handleDeletePost}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  {canModerate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleModeratePost(post.isHidden ? "show" : "hide")
                        }
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        {post.isHidden ? "Unhide Post" : "Hide Post"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(post.content);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdatePost}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap">{post.content}</div>
            {renderImageAttachments()}
            {renderFileAttachments()}
          </>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            <span>
              {post.commentCount || 0}{" "}
              {post.commentCount === 1 ? "Comment" : "Comments"}
            </span>
            {showComments ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>

      {showComments && (
        <div className="border-t px-6 pb-4 pt-2">
          <CommentSection postId={post._id} groupId={groupId} />
        </div>
      )}
    </Card>
  );
}
