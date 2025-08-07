// Import utilities and helper modules
import * as libModule from "./lib";
// Import schema module
import * as schemaModule from "./schema";

/**
 * Content Management System (CMS) Module
 *
 * This module provides functionality for managing content in the application.
 * It includes operations for posts, potentially other content types, and
 * related utilities.
 */

// Core functionality exports
export * from "./queries";
export * from "./mutations";

// Module-based exports
export const lib = libModule;
export const schema = schemaModule;

/**
 * Access patterns:
 * - api.cms.getAllPosts - to list posts with filtering and pagination
 * - api.cms.getPostById - to get a specific post by ID
 * - api.cms.getPostBySlug - to get a specific post by its slug
 * - api.cms.searchPosts - to search for posts by content
 * - api.cms.getPostTags - to get all tags used in posts
 * - api.cms.getPostCategories - to get all categories used in posts
 * - api.cms.createPost - to create a new post
 * - api.cms.updatePost - to update an existing post
 * - api.cms.deletePost - to delete a post
 * - api.cms.updatePostStatus - to change a post's status (publish/draft/archive)
 * - api.cms.bulkUpdatePostStatus - to update status for multiple posts
 *
 * Utility functions:
 * - api.cms.lib.slugify - to generate URL-friendly slugs
 */
