import { Id } from "../../_generated/dataModel";
import { MutationCtx } from "../../_generated/server";
import { NotificationType } from "../../shared/validators";

/**
 * Create a notification for when a user reacts to a post
 */
export async function notifyReaction(
  ctx: MutationCtx,
  args: {
    reactorId: Id<"users">;
    feedItemId: Id<"feedItems">;
    reactionType: string;
  },
) {
  const { reactorId, feedItemId, reactionType } = args;

  // Get the feed item to find its creator
  const feedItem = await ctx.db.get(feedItemId);
  if (!feedItem || feedItem.deleted) return;

  // Only send notification if the reactor is not the creator
  if (feedItem.creatorId === reactorId) return;

  // Get user information for better notifications
  const reactor = await ctx.db.get(reactorId);
  if (!reactor) return;

  // Create notification for the post creator
  await ctx.db.insert("notifications", {
    userId: feedItem.creatorId,
    type: "reaction" as NotificationType,
    title: `${reactor.name} reacted to your post`,
    content: `${reactor.name} ${reactionType}d your post`,
    read: false,
    sourceUserId: reactorId,
    actionUrl: `/social/post/${feedItemId}`,
    createdAt: Date.now(),
  });
}

/**
 * Create a notification for when a user comments on a post
 */
export async function notifyComment(
  ctx: MutationCtx,
  args: {
    commenterId: Id<"users">;
    feedItemId: Id<"feedItems">;
    commentId: Id<"comments">;
    content: string;
    parentCommentId?: Id<"comments">;
  },
) {
  const { commenterId, feedItemId, commentId, content, parentCommentId } = args;

  // Different notification flows for direct comments vs. replies
  if (parentCommentId) {
    await notifyCommentReply(ctx, {
      commenterId,
      feedItemId,
      commentId,
      content,
      parentCommentId,
    });
  } else {
    await notifyDirectComment(ctx, {
      commenterId,
      feedItemId,
      commentId,
      content,
    });
  }

  // Check for mentions in the comment text and notify mentioned users
  await notifyMentions(ctx, {
    mentionerId: commenterId,
    content,
    feedItemId,
    commentId,
  });
}

/**
 * Helper function to notify the post owner about a direct comment
 */
async function notifyDirectComment(
  ctx: MutationCtx,
  args: {
    commenterId: Id<"users">;
    feedItemId: Id<"feedItems">;
    commentId: Id<"comments">;
    content: string;
  },
) {
  const { commenterId, feedItemId, content } = args;

  // Get the feed item to find its creator
  const feedItem = await ctx.db.get(feedItemId);
  if (!feedItem || feedItem.deleted) return;

  // Only send notification if the commenter is not the creator
  if (feedItem.creatorId === commenterId) return;

  // Get user information for better notifications
  const commenter = await ctx.db.get(commenterId);
  if (!commenter) return;

  // Create a preview of the comment (limit to ~50 chars)
  const contentPreview =
    content.length > 50 ? `${content.substring(0, 50)}...` : content;

  // Create notification for the post creator
  await ctx.db.insert("notifications", {
    userId: feedItem.creatorId,
    type: "comment" as NotificationType,
    title: `${commenter.name} commented on your post`,
    content: contentPreview,
    read: false,
    sourceUserId: commenterId,
    actionUrl: `/social/post/${feedItemId}`,
    createdAt: Date.now(),
  });
}

/**
 * Helper function to notify the parent comment owner about a reply
 */
async function notifyCommentReply(
  ctx: MutationCtx,
  args: {
    commenterId: Id<"users">;
    feedItemId: Id<"feedItems">;
    commentId: Id<"comments">;
    content: string;
    parentCommentId: Id<"comments">;
  },
) {
  const { commenterId, feedItemId, content, parentCommentId } = args;

  // Get the parent comment to find its creator
  const parentComment = await ctx.db.get(parentCommentId);
  if (!parentComment || parentComment.deleted) return;

  // Only send notification if the reply author is not the parent comment author
  if (parentComment.userId === commenterId) return;

  // Get user information for better notifications
  const commenter = await ctx.db.get(commenterId);
  if (!commenter) return;

  // Create a preview of the comment (limit to ~50 chars)
  const contentPreview =
    content.length > 50 ? `${content.substring(0, 50)}...` : content;

  // Create notification for the parent comment author
  await ctx.db.insert("notifications", {
    userId: parentComment.userId,
    type: "commentReply" as NotificationType,
    title: `${commenter.name} replied to your comment`,
    content: contentPreview,
    read: false,
    sourceUserId: commenterId,
    actionUrl: `/social/post/${feedItemId}`,
    createdAt: Date.now(),
  });
}

/**
 * Create notifications for users mentioned in a post or comment
 */
export async function notifyMentions(
  ctx: MutationCtx,
  args: {
    mentionerId: Id<"users">;
    content: string;
    feedItemId: Id<"feedItems">;
    commentId?: Id<"comments">;
  },
) {
  const { mentionerId, content, feedItemId, commentId } = args;

  // Simple regex to detect @username mentions
  // In a production app, this would be more sophisticated
  const mentionRegex = /@(\w+)/g;
  const mentions = content.match(mentionRegex);

  if (!mentions) return;

  // Get mentioner info
  const mentioner = await ctx.db.get(mentionerId);
  if (!mentioner) return;

  // Extract usernames without the @ symbol
  const usernames = mentions.map((mention) => mention.substring(1));

  // For each mentioned username, find the corresponding user and notify them
  for (const username of usernames) {
    // Find user by username - we'll use an alternative approach since by_username index might not exist
    // This is just a simplified example - in a real app, we would ensure the proper index exists
    const mentionedUsers = await ctx.db.query("users").collect();

    // Filter for the matching username
    const mentionedUser = mentionedUsers.find((user) => user.name === username);

    if (!mentionedUser || mentionedUser._id === mentionerId) continue;

    // Create notification
    await ctx.db.insert("notifications", {
      userId: mentionedUser._id,
      type: "mention" as NotificationType,
      title: `${mentioner.name} mentioned you`,
      content: commentId
        ? `${mentioner.name} mentioned you in a comment`
        : `${mentioner.name} mentioned you in a post`,
      read: false,
      sourceUserId: mentionerId,
      actionUrl: `/social/post/${feedItemId}`,
      createdAt: Date.now(),
    });
  }
}

/**
 * Create a notification for when a user shares content
 */
export async function notifyShare(
  ctx: MutationCtx,
  args: {
    sharerId: Id<"users">;
    originalContentId: Id<"feedItems">;
    newShareId: Id<"feedItems">;
  },
) {
  const { sharerId, originalContentId, newShareId } = args;

  // Get the original content to find its creator
  const originalContent = await ctx.db.get(originalContentId);
  if (!originalContent || originalContent.deleted) return;

  // Only send notification if the sharer is not the original creator
  if (originalContent.creatorId === sharerId) return;

  // Get user information for better notifications
  const sharer = await ctx.db.get(sharerId);
  if (!sharer) return;

  // Create notification for the original content creator
  await ctx.db.insert("notifications", {
    userId: originalContent.creatorId,
    type: "share" as NotificationType,
    title: `${sharer.name} shared your post`,
    content: `${sharer.name} shared your post with their followers`,
    read: false,
    sourceUserId: sharerId,
    actionUrl: `/social/post/${newShareId}`,
    createdAt: Date.now(),
  });
}

/**
 * Create notifications for users when someone they follow posts
 */
export async function notifyFollowers(
  ctx: MutationCtx,
  args: {
    creatorId: Id<"users">;
    postId: Id<"feedItems">;
    content: string;
  },
) {
  const { creatorId, postId, content } = args;

  // Get creator info
  const creator = await ctx.db.get(creatorId);
  if (!creator) return;

  // Find all followers of this user
  // Since the index might not exist, we'll use a more generic approach
  const subscriptions = await ctx.db.query("subscriptions").collect();

  // Filter for users following this creator
  const userFollowers = subscriptions.filter(
    (sub) => sub.followType === "user" && sub.followId === creatorId,
  );

  if (userFollowers.length === 0) return;

  // Create a preview of the post (limit to ~50 chars)
  const contentPreview =
    content.length > 50 ? `${content.substring(0, 50)}...` : content;

  // Get follower IDs
  const followerIds = userFollowers.map((sub) => sub.userId);

  // Create notifications individually instead of using batch
  for (const followerId of followerIds) {
    await ctx.db.insert("notifications", {
      userId: followerId,
      type: "newFollowedUserPost" as NotificationType,
      title: `${creator.name} posted something new`,
      content: contentPreview,
      read: false,
      sourceUserId: creatorId,
      actionUrl: `/social/post/${postId}`,
      createdAt: Date.now(),
    });
  }
}
