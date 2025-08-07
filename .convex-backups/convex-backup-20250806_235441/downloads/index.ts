// Utilities and helpers
import * as libModule from "./lib";
// Schema definitions
import * as schemaModule from "./schema";

/**
 * Export all public API functions for the Downloads module
 */

// Export public queries from library
export {
  getAllDownloads as listDownloads,
  searchAllDownloads as searchDownloads,
  getDownloadCategories,
  getRecentDownloads,
  getFeaturedDownloads,
  getDownloadRecommendations as getPopularDownloads,
} from "./library";

// Export public mutations
export {
  generateUploadUrl,
  createFileDownload,
  generateDownloadUrl,
  generateMultipleDownloadUrls,
  updateDownload,
  deleteDownload,
  extractAndAttachFeaturedImage,
  updateFeaturedImage,
} from "./mutations";

// Re-export helpers and types
export * from "./lib";
export * from "./schema";

// Export modules for hierarchical access
export const lib = libModule;
export const schema = schemaModule;
