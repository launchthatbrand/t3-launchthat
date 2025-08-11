/**
 * Utility functions for working with file types and extensions
 */
import { fileTypeDetails } from "../../lib/fileTypes";
/**
 * Extract file extension from content type or filename
 */
export function getFileExtension(contentType) {
    // Extract from content type
    if (contentType) {
        const parts = contentType.split("/");
        if (parts.length === 2) {
            return parts[1].toLowerCase();
        }
    }
    return "unknown";
}
/**
 * Determine file type from extension
 */
export function getFileTypeFromExtension(extension) {
    // Map of extensions to file types
    const extensionMap = {
        // Images
        jpg: "image",
        jpeg: "image",
        png: "image",
        gif: "image",
        webp: "image",
        svg: "image",
        // Documents
        doc: "document",
        docx: "document",
        txt: "document",
        rtf: "document",
        // PDFs
        pdf: "pdf",
        // Spreadsheets
        xls: "spreadsheet",
        xlsx: "spreadsheet",
        csv: "spreadsheet",
        // Archives
        zip: "archive",
        rar: "archive",
        tar: "archive",
        gz: "archive",
        // Audio
        mp3: "audio",
        wav: "audio",
        ogg: "audio",
        // Video
        mp4: "video",
        avi: "video",
        mov: "video",
        wmv: "video",
        // Code
        js: "code",
        ts: "code",
        html: "code",
        css: "code",
        json: "code",
        // Data
        xml: "data",
        yaml: "data",
        sql: "data",
    };
    const normalizedExt = extension.toLowerCase().replace(/^\./, "");
    return extensionMap[normalizedExt] || "other";
}
/**
 * Get appropriate icon for a file type
 */
export function getFileTypeIcon(fileType) {
    const typeInfo = fileTypeDetails[fileType] ||
        fileTypeDetails.unknown;
    return typeInfo.icon;
}
/**
 * Format file size into human-readable string
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
/**
 * Check if file size is within allowed limit for the given file type
 */
export function isFileSizeValid(fileType, fileSize) {
    const typeInfo = fileTypeDetails[fileType] ||
        fileTypeDetails.unknown;
    return fileSize <= typeInfo.maxSize;
}
/**
 * Get the max allowed file size for a given file type
 */
export function getMaxFileSize(fileType) {
    const typeInfo = fileTypeDetails[fileType] ||
        fileTypeDetails.unknown;
    return typeInfo.maxSize;
}
