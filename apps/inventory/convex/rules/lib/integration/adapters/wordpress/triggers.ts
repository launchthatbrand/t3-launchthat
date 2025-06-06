/**
 * WordPress Triggers
 *
 * This module defines the triggers for the WordPress integration.
 */

import { JSONSchema7 } from "json-schema";

import {
  RuleExecutionContext,
  Trigger,
  TriggerFactory,
} from "../../../interfaces";

/**
 * WordPress Post Published Trigger
 *
 * Triggered when a new post is published on the WordPress site.
 */
export class WordPressPostPublishedTrigger implements Trigger {
  readonly type = "wordpress.post_published";

  constructor(private config: { postType: string }) {}

  async evaluate(context: RuleExecutionContext): Promise<boolean> {
    const { triggerData } = context;

    // Check if this is a post publish event
    if (
      triggerData.action !== "publish_post" &&
      triggerData.action !== "publish_page"
    ) {
      return false;
    }

    // If a specific post type is configured, check if it matches
    if (
      this.config.postType !== "any" &&
      triggerData.post_type !== this.config.postType
    ) {
      return false;
    }

    return true;
  }
}

/**
 * WordPress User Registered Trigger
 *
 * Triggered when a new user registers on the WordPress site.
 */
export class WordPressUserRegisteredTrigger implements Trigger {
  readonly type = "wordpress.user_registered";

  constructor(private config: { role: string }) {}

  async evaluate(context: RuleExecutionContext): Promise<boolean> {
    const { triggerData } = context;

    // Check if this is a user registration event
    if (triggerData.action !== "user_register") {
      return false;
    }

    // If a specific role is configured, check if it matches
    if (
      this.config.role !== "any" &&
      triggerData.user_role !== this.config.role
    ) {
      return false;
    }

    return true;
  }
}

/**
 * WordPress Comment Posted Trigger
 *
 * Triggered when a new comment is posted on the WordPress site.
 */
export class WordPressCommentPostedTrigger implements Trigger {
  readonly type = "wordpress.comment_posted";

  constructor(private config: { status: string }) {}

  async evaluate(context: RuleExecutionContext): Promise<boolean> {
    const { triggerData } = context;

    // Check if this is a comment event
    if (triggerData.action !== "comment_post") {
      return false;
    }

    // If a specific status is configured, check if it matches
    if (
      this.config.status !== "any" &&
      triggerData.comment_status !== this.config.status
    ) {
      return false;
    }

    return true;
  }
}

// Define trigger factories
const postPublishedFactory: TriggerFactory = (config) =>
  new WordPressPostPublishedTrigger(config as { postType: string });

const userRegisteredFactory: TriggerFactory = (config) =>
  new WordPressUserRegisteredTrigger(config as { role: string });

const commentPostedFactory: TriggerFactory = (config) =>
  new WordPressCommentPostedTrigger(config as { status: string });

// Define schemas
const postPublishedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    postType: {
      type: "string",
      title: "Post Type",
      enum: ["post", "page", "product", "any"],
      default: "any",
      description: "The type of post to trigger on",
    },
  },
};

const userRegisteredSchema: JSONSchema7 = {
  type: "object",
  properties: {
    role: {
      type: "string",
      title: "User Role",
      enum: [
        "subscriber",
        "contributor",
        "author",
        "editor",
        "administrator",
        "any",
      ],
      default: "any",
      description: "The role of the user to trigger on",
    },
  },
};

const commentPostedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    status: {
      type: "string",
      title: "Comment Status",
      enum: ["approved", "pending", "spam", "any"],
      default: "any",
      description: "The status of the comment to trigger on",
    },
  },
};

// Export trigger definitions
export const wordpressTriggers = {
  "wordpress.post_published": {
    name: "Post Published",
    description: "Triggered when a new post is published",
    schema: postPublishedSchema,
    factory: postPublishedFactory,
  },
  "wordpress.user_registered": {
    name: "User Registered",
    description: "Triggered when a new user registers on the site",
    schema: userRegisteredSchema,
    factory: userRegisteredFactory,
  },
  "wordpress.comment_posted": {
    name: "Comment Posted",
    description: "Triggered when a new comment is posted",
    schema: commentPostedSchema,
    factory: commentPostedFactory,
  },
};
