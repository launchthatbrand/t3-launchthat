/**
 * WordPress Context Factory
 *
 * This module provides a context factory for WordPress integration.
 * It creates the execution context for triggers, conditions, and actions.
 */

import { RuleExecutionContext } from "../../interfaces";

/**
 * WordPress API Client
 */
export class WordPressApiClient {
  private siteUrl: string;
  private username: string;
  private password?: string;
  private apiKey?: string;

  /**
   * Creates a new WordPress API client
   *
   * @param config Configuration for the WordPress API client
   */
  constructor(config: {
    siteUrl: string;
    username: string;
    password?: string;
    apiKey?: string;
  }) {
    this.siteUrl = config.siteUrl;
    this.username = config.username;
    this.password = config.password;
    this.apiKey = config.apiKey;
  }

  /**
   * Gets the categories for a post
   *
   * @param postId ID of the post
   * @returns Array of category IDs
   */
  async getPostCategories(postId: string): Promise<string[]> {
    console.log(`Getting categories for post ${postId}`);

    // In a real implementation, this would make an API call to WordPress
    // For now, just return a mock response
    await new Promise((resolve) => setTimeout(resolve, 100));

    return ["1", "2", "3"];
  }

  /**
   * Gets the tags for a post
   *
   * @param postId ID of the post
   * @returns Array of tag IDs
   */
  async getPostTags(postId: string): Promise<string[]> {
    console.log(`Getting tags for post ${postId}`);

    // In a real implementation, this would make an API call to WordPress
    // For now, just return a mock response
    await new Promise((resolve) => setTimeout(resolve, 100));

    return ["tag1", "tag2"];
  }

  /**
   * Creates a new post
   *
   * @param postData Data for the new post
   * @returns ID of the created post
   */
  async createPost(postData: {
    title: string;
    content: string;
    status: string;
    type: string;
  }): Promise<{ id: string }> {
    console.log(`Creating post "${postData.title}"`);

    // In a real implementation, this would make an API call to WordPress
    // For now, just return a mock response
    await new Promise((resolve) => setTimeout(resolve, 100));

    return { id: Math.floor(Math.random() * 10000).toString() };
  }

  /**
   * Sends an email
   *
   * @param emailData Data for the email
   */
  async sendEmail(emailData: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    console.log(
      `Sending email to ${emailData.to} with subject "${emailData.subject}"`,
    );

    // In a real implementation, this would make an API call to WordPress
    // For now, just log and return
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * WordPress Context Factory
 *
 * Creates the execution context for WordPress rules
 */
export class WordpressContextFactory {
  /**
   * Creates a new WordPress context factory
   */
  constructor() {
    // This constructor is intentionally empty
  }

  /**
   * Creates a rule execution context for WordPress
   *
   * @param config Configuration for the WordPress API client
   * @param triggerData Data from the trigger
   * @returns Rule execution context
   */
  createContext(
    config: {
      siteUrl: string;
      username: string;
      password?: string;
      apiKey?: string;
    },
    triggerData: Record<string, unknown>,
  ): RuleExecutionContext {
    // Create WordPress API client
    const wpClient = new WordPressApiClient(config);

    // Create integration data
    const integrationData = {
      type: "wordpress",
      wpClient,
      config,
    };

    // Create and return context
    return {
      triggerData,
      integrationData,
    };
  }
}
