/**
 * WordPress Conditions
 *
 * This module defines the conditions for the WordPress integration.
 */

import { JSONSchema7 } from "json-schema";

import {
  Condition,
  ConditionFactory,
  RuleExecutionContext,
} from "../../../interfaces";
import { WordPressApiClient } from "../wordpressContextFactory";

/**
 * WordPress Post Category Condition
 *
 * Checks if a post belongs to a specific category.
 */
export class WordPressPostCategoryCondition implements Condition {
  readonly type = "wordpress.post_category";

  constructor(private config: { categoryId: string }) {}

  async evaluate(context: RuleExecutionContext): Promise<boolean> {
    const { triggerData, integrationData } = context;
    const postId = triggerData.post_id as string;

    if (!postId) {
      return false;
    }

    try {
      // Get the WordPress API client from the context
      const wpClient = integrationData.wpClient as WordPressApiClient;

      // Get post categories
      const categories = await wpClient.getPostCategories(postId);

      // Check if the specified category is in the list
      return categories.includes(this.config.categoryId);
    } catch (error) {
      console.error(
        "Error evaluating WordPress post category condition:",
        error,
      );
      return false;
    }
  }
}

/**
 * WordPress Post Has Tag Condition
 *
 * Checks if a post has a specific tag.
 */
export class WordPressPostHasTagCondition implements Condition {
  readonly type = "wordpress.post_has_tag";

  constructor(private config: { tagId: string }) {}

  async evaluate(context: RuleExecutionContext): Promise<boolean> {
    const { triggerData, integrationData } = context;
    const postId = triggerData.post_id as string;

    if (!postId) {
      return false;
    }

    try {
      // Get the WordPress API client from the context
      const wpClient = integrationData.wpClient as WordPressApiClient;

      // Get post tags
      const tags = await wpClient.getPostTags(postId);

      // Check if the specified tag is in the list
      return tags.includes(this.config.tagId);
    } catch (error) {
      console.error("Error evaluating WordPress post tag condition:", error);
      return false;
    }
  }
}

/**
 * WordPress Post Author Condition
 *
 * Checks if a post is authored by a specific user.
 */
export class WordPressPostAuthorCondition implements Condition {
  readonly type = "wordpress.post_author";

  constructor(private config: { authorId: string }) {}

  async evaluate(context: RuleExecutionContext): Promise<boolean> {
    const { triggerData } = context;
    const authorId = triggerData.post_author as string;

    if (!authorId) {
      return false;
    }

    // Compare the author ID with the configured value
    return authorId === this.config.authorId;
  }
}

// Define condition factories
const postCategoryFactory: ConditionFactory = (config) =>
  new WordPressPostCategoryCondition(config as { categoryId: string });

const postHasTagFactory: ConditionFactory = (config) =>
  new WordPressPostHasTagCondition(config as { tagId: string });

const postAuthorFactory: ConditionFactory = (config) =>
  new WordPressPostAuthorCondition(config as { authorId: string });

// Define schemas
const postCategorySchema: JSONSchema7 = {
  type: "object",
  properties: {
    categoryId: {
      type: "string",
      title: "Category ID",
      description: "The ID of the category to check for",
    },
  },
  required: ["categoryId"],
};

const postHasTagSchema: JSONSchema7 = {
  type: "object",
  properties: {
    tagId: {
      type: "string",
      title: "Tag ID",
      description: "The ID of the tag to check for",
    },
  },
  required: ["tagId"],
};

const postAuthorSchema: JSONSchema7 = {
  type: "object",
  properties: {
    authorId: {
      type: "string",
      title: "Author ID",
      description: "The ID of the author to check for",
    },
  },
  required: ["authorId"],
};

// Export condition definitions
export const wordpressConditions = {
  "wordpress.post_category": {
    name: "Post Category",
    description: "Check if the post belongs to a specific category",
    schema: postCategorySchema,
    factory: postCategoryFactory,
  },
  "wordpress.post_has_tag": {
    name: "Post Has Tag",
    description: "Check if the post has a specific tag",
    schema: postHasTagSchema,
    factory: postHasTagFactory,
  },
  "wordpress.post_author": {
    name: "Post Author",
    description: "Check if the post is authored by a specific user",
    schema: postAuthorSchema,
    factory: postAuthorFactory,
  },
};
