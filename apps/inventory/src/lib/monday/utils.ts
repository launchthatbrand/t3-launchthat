/**
 * Monday.com Integration Utilities
 */

/**
 * Generate a link to a Monday.com board
 * @param boardId The Monday.com board ID
 * @returns A URL to the Monday.com board
 */
export function getMondayBoardUrl(boardId: string): string {
  if (!boardId) return "";
  return `https://monday.com/boards/${boardId}`;
}

/**
 * Generate a link to a Monday.com item
 * @param boardId The Monday.com board ID
 * @param itemId The Monday.com item ID
 * @returns A URL to the Monday.com item
 */
export function getMondayItemUrl(boardId: string, itemId: string): string {
  if (!boardId || !itemId) return "";
  return `https://monday.com/boards/${boardId}/pulses/${itemId}`;
}

/**
 * Get the status badge color based on sync status
 * @param status The sync status
 * @returns A Tailwind CSS color class
 */
export function getSyncStatusColor(status: string): string {
  switch (status) {
    case "synced":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "partial":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Format a timestamp as a relative time string
 * @param timestamp The timestamp in milliseconds
 * @returns A relative time string (e.g., "2 hours ago")
 */
export function getRelativeTimeString(timestamp: number): string {
  if (!timestamp) return "Never";

  const now = Date.now();
  const diff = now - timestamp;

  // Convert to seconds
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  // Convert to minutes
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  // Convert to hours
  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // Convert to days
  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Convert to months
  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  // Convert to years
  const years = Math.floor(months / 12);

  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/**
 * Get the table display name from its internal name
 * @param tableName The Convex table name
 * @returns A user-friendly display name
 */
export function getTableDisplayName(tableName: string): string {
  const displayNames: Record<string, string> = {
    products: "Products",
    productCategories: "Product Categories",
    orders: "Orders",
    users: "Users",
    courses: "Courses",
    enrollments: "Enrollments",
    posts: "Posts",
    events: "Events",
  };

  return displayNames[tableName] ?? tableName;
}

/**
 * Get the sync direction display name
 * @param direction The sync direction value
 * @returns A user-friendly display name
 */
export function getSyncDirectionLabel(direction: string): string {
  switch (direction) {
    case "push":
      return "One-way (Convex to Monday)";
    case "pull":
      return "One-way (Monday to Convex)";
    case "bidirectional":
      return "Two-way Sync";
    default:
      return direction;
  }
}

/**
 * Get the column type display name
 * @param columnType The Monday.com column type
 * @returns A user-friendly display name
 */
export function getColumnTypeLabel(columnType: string): string {
  const typeLabels: Record<string, string> = {
    text: "Text",
    number: "Number",
    status: "Status",
    dropdown: "Dropdown",
    date: "Date",
    people: "People",
    boolean: "Boolean",
    file: "File",
    link: "Link",
    "long-text": "Long Text",
    label: "Label",
    timezone: "Timezone",
    email: "Email",
    phone: "Phone",
    checkbox: "Checkbox",
    rating: "Rating",
    timeline: "Timeline",
    "color-picker": "Color Picker",
    hour: "Hour",
    week: "Week",
    country: "Country",
    "world-clock": "World Clock",
    tags: "Tags",
    progress: "Progress",
    team: "Team",
    dependency: "Dependency",
  };

  return typeLabels[columnType] ?? columnType;
}

/**
 * Format bytes to a human-readable string
 * @param bytes The number of bytes
 * @returns A formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format milliseconds to a human-readable duration string
 * @param ms The duration in milliseconds
 * @returns A formatted string (e.g., "1m 30s")
 */
export function formatDuration(ms: number): string {
  if (!ms) return "0s";

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

/**
 * Get the operation type display name
 * @param operation The operation type
 * @returns A user-friendly display name
 */
export function getOperationTypeLabel(operation: string): string {
  if (operation.startsWith("sync-all")) {
    return "Full Sync";
  }

  if (operation.startsWith("sync-products")) {
    return "Products Sync";
  }

  if (operation.startsWith("sync-orders")) {
    return "Orders Sync";
  }

  if (operation.startsWith("update-")) {
    return "Update";
  }

  if (operation.startsWith("create-")) {
    return "Create";
  }

  if (operation.startsWith("delete-")) {
    return "Delete";
  }

  return operation;
}

/**
 * Get the status badge color based on operation status
 * @param status The operation status
 * @returns A Tailwind CSS color class
 */
export function getOperationStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "completed-with-errors":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
