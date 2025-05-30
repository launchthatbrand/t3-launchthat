// Utilities and helpers
import * as libModule from "./lib";
// Schema definitions
import * as schemaModule from "./schema";

/**
 * Core download functionality for file uploads and downloads
 */

// Re-export queries
export {
  getDownload,
  listDownloads,
  listDownloadsByCategory,
  searchDownloads,
  getDownloadPreviewInfo,
  getAvailableFileTypes,
} from "./queries";

// Re-export mutations
export {
  generateUploadUrl,
  createFileDownload,
  generateDownloadUrl,
  generateMultipleDownloadUrls,
  updateDownload,
  deleteDownload,
} from "./mutations";

// Re-export helpers and types
export * from "./lib";
export * from "./schema";

// Export modules for hierarchical access
export const lib = libModule;
export const schema = schemaModule;
