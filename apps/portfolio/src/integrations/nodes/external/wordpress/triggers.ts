import { z } from "zod";

/**
 * WordPress Node Triggers
 *
 * This file defines all triggers (webhooks/events) that WordPress can send.
 * WordPress triggers typically respond to content creation, updates, and user actions.
 *
 * Note: WordPress doesn't have built-in webhooks, but they can be added via plugins
 * like WP Webhooks or custom webhook implementations.
 */

// =====================================================
// TRIGGER 1: Post Published (Webhook)
// =====================================================

const PostPublishedOutputSchema = z.object({
  postId: z.number(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  author: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().optional(),
  }),
  publishedAt: z.string(),
  url: z.string(),
  status: z.string(),
  categories: z.array(z.number()),
  tags: z.array(z.number()),
  featuredImage: z
    .object({
      id: z.number(),
      url: z.string(),
      alt: z.string(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const postPublished = {
  id: "post_published",
  name: "Post Published",
  description: "Triggered when a WordPress post is published",
  type: "webhook" as const,

  outputSchema: PostPublishedOutputSchema,

  // Webhook configuration
  webhookConfig: {
    method: "POST",
    expectedHeaders: {
      "X-WordPress-Webhook": "post-published",
    },
  },

  async setup(): Promise<void> {
    console.log("WordPress post published trigger setup");
    // Setup would typically involve configuring webhooks in WordPress
    // via a plugin or custom implementation
  },

  async teardown(): Promise<void> {
    console.log("WordPress post published trigger teardown");
    // Cleanup webhook configuration
  },

  // Transform WordPress webhook payload to our standard format
  async transform(
    payload: unknown,
  ): Promise<z.infer<typeof PostPublishedOutputSchema>> {
    // WordPress webhook payloads vary by plugin, this is a generic transform
    const data = payload as any;

    return {
      postId: data.ID || data.id,
      title: data.post_title || data.title?.rendered || data.title,
      content: data.post_content || data.content?.rendered || data.content,
      excerpt:
        data.post_excerpt || data.excerpt?.rendered || data.excerpt || "",
      author: {
        id: data.post_author || data.author,
        name: data.author_name || "Unknown",
        email: data.author_email,
      },
      publishedAt: data.post_date || data.date || new Date().toISOString(),
      url: data.guid || data.link || "",
      status: data.post_status || data.status || "publish",
      categories: Array.isArray(data.categories) ? data.categories : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      featuredImage: data.featured_media
        ? {
            id: data.featured_media,
            url: data.featured_media_url || "",
            alt: data.featured_media_alt || "",
          }
        : undefined,
      metadata: data.meta || {},
    };
  },
};

// =====================================================
// TRIGGER 2: Comment Added (Webhook)
// =====================================================

const CommentAddedOutputSchema = z.object({
  commentId: z.number(),
  postId: z.number(),
  postTitle: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string(),
    website: z.string().optional(),
    ip: z.string().optional(),
  }),
  content: z.string(),
  status: z.string(), // approved, pending, spam, trash
  createdAt: z.string(),
  parentCommentId: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const commentAdded = {
  id: "comment_added",
  name: "Comment Added",
  description: "Triggered when a new comment is posted on WordPress",
  type: "webhook" as const,

  outputSchema: CommentAddedOutputSchema,

  webhookConfig: {
    method: "POST",
    expectedHeaders: {
      "X-WordPress-Webhook": "comment-added",
    },
  },

  async setup(): Promise<void> {
    console.log("WordPress comment added trigger setup");
  },

  async teardown(): Promise<void> {
    console.log("WordPress comment added trigger teardown");
  },

  async transform(
    payload: unknown,
  ): Promise<z.infer<typeof CommentAddedOutputSchema>> {
    const data = payload as any;

    return {
      commentId: data.comment_ID || data.id,
      postId: data.comment_post_ID || data.post,
      postTitle: data.post_title || "Unknown Post",
      author: {
        name: data.comment_author || data.author_name || "Anonymous",
        email: data.comment_author_email || data.author_email || "",
        website: data.comment_author_url || data.author_url,
        ip: data.comment_author_IP || data.author_ip,
      },
      content:
        data.comment_content || data.content?.rendered || data.content || "",
      status: data.comment_approved || data.status || "pending",
      createdAt: data.comment_date || data.date || new Date().toISOString(),
      parentCommentId: data.comment_parent || data.parent || undefined,
      metadata: data.meta || {},
    };
  },
};

// =====================================================
// TRIGGER 3: User Registered (Webhook)
// =====================================================

const UserRegisteredOutputSchema = z.object({
  userId: z.number(),
  username: z.string(),
  email: z.string(),
  displayName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string(),
  registeredAt: z.string(),
  activationKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const userRegistered = {
  id: "user_registered",
  name: "User Registered",
  description: "Triggered when a new user registers on WordPress",
  type: "webhook" as const,

  outputSchema: UserRegisteredOutputSchema,

  webhookConfig: {
    method: "POST",
    expectedHeaders: {
      "X-WordPress-Webhook": "user-registered",
    },
  },

  async setup(): Promise<void> {
    console.log("WordPress user registered trigger setup");
  },

  async teardown(): Promise<void> {
    console.log("WordPress user registered trigger teardown");
  },

  async transform(
    payload: unknown,
  ): Promise<z.infer<typeof UserRegisteredOutputSchema>> {
    const data = payload as any;

    return {
      userId: data.ID || data.id,
      username: data.user_login || data.username,
      email: data.user_email || data.email,
      displayName:
        data.display_name ||
        data.displayName ||
        data.user_login ||
        data.username,
      firstName: data.first_name || data.firstName,
      lastName: data.last_name || data.lastName,
      role: data.role || "subscriber",
      registeredAt:
        data.user_registered || data.registered || new Date().toISOString(),
      activationKey: data.user_activation_key || data.activationKey,
      metadata: data.meta || {},
    };
  },
};

// =====================================================
// EXPORT ALL TRIGGERS
// =====================================================

export const WordPressTriggers = {
  post_published: postPublished,
  comment_added: commentAdded,
  user_registered: userRegistered,
} as const;
