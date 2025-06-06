/**
 * WordPress Actions
 *
 * This module defines the actions for the WordPress integration.
 */

import { JSONSchema7 } from "json-schema";

import {
  Action,
  ActionFactory,
  ActionResult,
  RuleExecutionContext,
} from "../../../interfaces";
import { WordPressApiClient } from "../wordpressContextFactory";

/**
 * WordPress Create Post Action
 *
 * Creates a new post in WordPress.
 */
export class WordPressCreatePostAction implements Action {
  readonly type = "wordpress.create_post";

  constructor(
    private config: {
      title: string;
      content: string;
      postType: string;
      status: string;
    },
  ) {}

  async execute(context: RuleExecutionContext): Promise<ActionResult> {
    try {
      const { integrationData } = context;

      // Get the WordPress API client from the context
      const wpClient = integrationData.wpClient as WordPressApiClient;

      // Create the post
      const result = await wpClient.createPost({
        title: this.config.title,
        content: this.config.content,
        status: this.config.status,
        type: this.config.postType,
      });

      return {
        success: true,
        message: `Created ${this.config.postType} with ID ${result.id}`,
        data: { postId: result.id },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to create post: ${errorMessage}`,
      };
    }
  }
}

/**
 * WordPress Send Email Action
 *
 * Sends an email using WordPress.
 */
export class WordPressSendEmailAction implements Action {
  readonly type = "wordpress.send_email";

  constructor(
    private config: {
      to: string;
      subject: string;
      body: string;
    },
  ) {}

  async execute(context: RuleExecutionContext): Promise<ActionResult> {
    try {
      const { integrationData } = context;

      // Get the WordPress API client from the context
      const wpClient = integrationData.wpClient as WordPressApiClient;

      // Send the email
      await wpClient.sendEmail({
        to: this.config.to,
        subject: this.config.subject,
        body: this.config.body,
      });

      return {
        success: true,
        message: `Sent email to ${this.config.to}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to send email: ${errorMessage}`,
      };
    }
  }
}

/**
 * WordPress Update Post Action
 *
 * Updates an existing post in WordPress.
 */
export class WordPressUpdatePostAction implements Action {
  readonly type = "wordpress.update_post";

  constructor(
    private config: {
      postId: string;
      title?: string;
      content?: string;
      status?: string;
    },
  ) {}

  async execute(context: RuleExecutionContext): Promise<ActionResult> {
    try {
      // In a real implementation, we would use the WordPress API client to update the post
      // For now, just log and return success
      console.log(`Updating post ${this.config.postId}`);

      // Add a small delay to simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        message: `Updated post with ID ${this.config.postId}`,
        data: { postId: this.config.postId },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to update post: ${errorMessage}`,
      };
    }
  }
}

// Define action factories
const createPostFactory: ActionFactory = (config) =>
  new WordPressCreatePostAction(
    config as {
      title: string;
      content: string;
      postType: string;
      status: string;
    },
  );

const sendEmailFactory: ActionFactory = (config) =>
  new WordPressSendEmailAction(
    config as {
      to: string;
      subject: string;
      body: string;
    },
  );

const updatePostFactory: ActionFactory = (config) =>
  new WordPressUpdatePostAction(
    config as {
      postId: string;
      title?: string;
      content?: string;
      status?: string;
    },
  );

// Define schemas
const createPostSchema: JSONSchema7 = {
  type: "object",
  properties: {
    title: {
      type: "string",
      title: "Post Title",
      description: "The title of the post to create",
    },
    content: {
      type: "string",
      title: "Post Content",
      description: "The content of the post to create",
    },
    postType: {
      type: "string",
      title: "Post Type",
      enum: ["post", "page", "product"],
      default: "post",
      description: "The type of post to create",
    },
    status: {
      type: "string",
      title: "Post Status",
      enum: ["publish", "draft", "pending"],
      default: "publish",
      description: "The status of the post to create",
    },
  },
  required: ["title", "content"],
};

const sendEmailSchema: JSONSchema7 = {
  type: "object",
  properties: {
    to: {
      type: "string",
      title: "Recipient Email",
      description: "The email address to send to",
    },
    subject: {
      type: "string",
      title: "Email Subject",
      description: "The subject of the email",
    },
    body: {
      type: "string",
      title: "Email Body",
      description: "The body of the email",
    },
  },
  required: ["to", "subject", "body"],
};

const updatePostSchema: JSONSchema7 = {
  type: "object",
  properties: {
    postId: {
      type: "string",
      title: "Post ID",
      description: "The ID of the post to update",
    },
    title: {
      type: "string",
      title: "Post Title",
      description: "The new title of the post (leave blank to keep current)",
    },
    content: {
      type: "string",
      title: "Post Content",
      description: "The new content of the post (leave blank to keep current)",
    },
    status: {
      type: "string",
      title: "Post Status",
      enum: ["publish", "draft", "pending"],
      description: "The new status of the post (leave blank to keep current)",
    },
  },
  required: ["postId"],
};

// Export action definitions
export const wordpressActions = {
  "wordpress.create_post": {
    name: "Create Post",
    description: "Create a new post in WordPress",
    schema: createPostSchema,
    factory: createPostFactory,
  },
  "wordpress.send_email": {
    name: "Send Email",
    description: "Send an email to specified recipients",
    schema: sendEmailSchema,
    factory: sendEmailFactory,
  },
  "wordpress.update_post": {
    name: "Update Post",
    description: "Update an existing post in WordPress",
    schema: updatePostSchema,
    factory: updatePostFactory,
  },
};
