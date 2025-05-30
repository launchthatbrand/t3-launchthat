/**
 * Shared constants for the Convex application.
 */

// Pagination constants
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// File upload constants
export const MAX_FILE_SIZE_MB = 100;
export const MAX_IMAGE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Role constants
export const ROLE_ADMIN = "admin";
export const ROLE_EDITOR = "editor";
export const ROLE_MEMBER = "member";
export const ROLE_GUEST = "guest";

// Permission constants
export const PERMISSION_SCOPE_READ = "read";
export const PERMISSION_SCOPE_WRITE = "write";
export const PERMISSION_SCOPE_DELETE = "delete";
export const PERMISSION_SCOPE_ADMIN = "admin";

// Time constants
export const ONE_MINUTE_MS = 60 * 1000;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;
export const ONE_WEEK_MS = 7 * ONE_DAY_MS;
export const ONE_MONTH_MS = 30 * ONE_DAY_MS;

// API constants
export const API_TIMEOUT_MS = 30000; // 30 seconds
export const DEFAULT_DEBOUNCE_MS = 300;
export const MAX_BATCH_SIZE = 50;

// Default values
export const Defaults = {
  PROFILE_PICTURE: "/assets/images/default-profile.png",
  ITEMS_PER_PAGE: 20,
  CURRENCY: "USD",
  LANGUAGE: "en-US",
  TIMEZONE: "UTC",
} as const;

// Timeout values
export const Timeouts = {
  API_REQUEST: 15000, // 15 seconds
  DEBOUNCE: 300, // 300 milliseconds
  SESSION: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN: 60 * 60 * 1000, // 1 hour
} as const;

// Feature flags
export const FeatureFlags = {
  NEW_DASHBOARD: true,
  EXPERIMENTAL_ANALYTICS: false,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_SOCIAL_SHARING: true,
} as const;

// Error messages
export const ErrorMessages = {
  UNAUTHORIZED: "Unauthorized: You must be logged in to perform this action",
  FORBIDDEN: "Forbidden: You don't have permission to perform this action",
  NOT_FOUND: "Not found: The requested resource was not found",
  VALIDATION_FAILED: "Validation failed: Please check your input",
  SERVER_ERROR: "Server error: Something went wrong on our end",
} as const;

// Response status codes
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;
