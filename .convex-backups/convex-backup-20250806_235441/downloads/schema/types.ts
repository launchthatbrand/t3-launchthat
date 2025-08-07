/**
 * Type definitions for the downloads module
 */

import type { Id } from "../../_generated/dataModel";

/**
 * Allowed file types for downloads
 */
export type FileType =
  | "image"
  | "document"
  | "pdf"
  | "spreadsheet"
  | "archive"
  | "audio"
  | "video"
  | "code"
  | "data"
  | "other";

/**
 * Download data structure
 */
export interface Download {
  _id: Id<"downloads">;
  _creationTime: number;
  title: string;
  description?: string;
  fileName: string;
  fileExtension?: string;
  fileType: FileType;
  fileSize: number;
  storageId: Id<"_storage">;
  searchText?: string;
  categoryId?: Id<"downloadCategories">;
  tags?: string[];
  downloadCount: number;
  isPublic: boolean;
  requiredProductId?: Id<"products">;
  requiredCourseId?: Id<"courses">;
  accessibleUserIds?: Id<"users">[];
  uploadedBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

/**
 * Download category data structure
 */
export interface DownloadCategory {
  _id: Id<"downloadCategories">;
  _creationTime: number;
  name: string;
  description?: string;
  slug: string;
  parentId?: Id<"downloadCategories">;
  isPublic: boolean;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

/**
 * User download record
 */
export interface UserDownload {
  _id: Id<"userDownloads">;
  _creationTime: number;
  userId: Id<"users">;
  downloadId: Id<"downloads">;
  downloadedAt: number;
}

/**
 * Download favorite
 */
export interface DownloadFavorite {
  _id: Id<"downloadFavorites">;
  _creationTime: number;
  userId: Id<"users">;
  downloadId: Id<"downloads">;
  createdAt: number;
}

/**
 * Download preview info
 */
export type DownloadPreviewInfo =
  | {
      status: "url_preview";
      url: string;
      fileType: string;
      fileName: string;
    }
  | {
      status: "content_preview";
      content: string;
      fileType: string;
      fileName: string;
    }
  | {
      status: "no_preview";
      fileType: string;
      fileName: string;
      message?: string;
    };
