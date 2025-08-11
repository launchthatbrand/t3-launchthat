// Define allowed file types for uploads
export const fileTypes = [
  {
    type: "application/pdf",
    extensions: ["pdf"],
    description: "PDF Document",
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  {
    type: "application/zip",
    extensions: ["zip"],
    description: "ZIP Archive",
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  {
    type: "image/jpeg",
    extensions: ["jpg", "jpeg"],
    description: "JPEG Image",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  {
    type: "image/png",
    extensions: ["png"],
    description: "PNG Image",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
    description: "Word Document",
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: ["xlsx"],
    description: "Excel Spreadsheet",
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  {
    type: "video/mp4",
    extensions: ["mp4"],
    description: "MP4 Video",
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  {
    type: "audio/mpeg",
    extensions: ["mp3"],
    description: "MP3 Audio",
    maxSize: 50 * 1024 * 1024, // 50MB
  },
];

// Type definition for file types
export interface FileType {
  type: string;
  extensions: string[];
  description: string;
  maxSize: number; // in bytes
}

// New exports for file type handling
export const fileTypeDetails = {
  image: {
    type: "image",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    icon: "image",
    description: "Image File",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  document: {
    type: "document",
    extensions: ["pdf", "doc", "docx", "txt", "rtf"],
    icon: "file-text",
    description: "Document File",
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  spreadsheet: {
    type: "spreadsheet",
    extensions: ["xls", "xlsx", "csv"],
    icon: "table",
    description: "Spreadsheet File",
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  presentation: {
    type: "presentation",
    extensions: ["ppt", "pptx"],
    icon: "presentation",
    description: "Presentation File",
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  archive: {
    type: "archive",
    extensions: ["zip", "rar", "7z", "tar", "gz"],
    icon: "archive",
    description: "Archive File",
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  video: {
    type: "video",
    extensions: ["mp4", "webm", "mov", "avi"],
    icon: "video",
    description: "Video File",
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  audio: {
    type: "audio",
    extensions: ["mp3", "wav", "ogg", "m4a"],
    icon: "music",
    description: "Audio File",
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  other: {
    type: "other",
    extensions: [],
    icon: "file",
    description: "Other File Type",
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  unknown: {
    type: "unknown",
    extensions: [],
    icon: "help-circle",
    description: "Unknown File Type",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

// List of valid file types for upload validation
export const validFileTypes = [
  "image",
  "document",
  "spreadsheet",
  "presentation",
  "archive",
  "video",
  "audio",
  "other",
];
