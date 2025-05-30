import type { User } from "../../../types/board";

export const GROUP_COLORS = [
  { name: "Green", value: "#00c875" },
  { name: "Yellow", value: "#fdab3d" },
  { name: "Red", value: "#e2445c" },
  { name: "Blue", value: "#0086c0" },
  { name: "Purple", value: "#a25ddc" },
  { name: "Teal", value: "#00a9ff" },
  { name: "Orange", value: "#ff642e" },
  { name: "Pink", value: "#ff5ac4" },
  { name: "Lime", value: "#579bfc" },
  { name: "Dark Blue", value: "#164b88" },
  { name: "Gray", value: "#808080" },
];

// Placeholder user list for Owner column
export const PLACEHOLDER_USERS: User[] = [
  { id: "u1", name: "Alice Smith", avatarUrl: undefined },
  { id: "u2", name: "Bob Johnson", avatarUrl: undefined },
  { id: "u3", name: "Charlie Lee", avatarUrl: undefined },
];

export const DEFAULT_STATUS_OPTIONS = [
  {
    id: "status_todo",
    label: "To Do",
    color: "#c4c4c4", // Gray
  },
  {
    id: "status_working_on_it",
    label: "Working on it",
    color: "#fdab3d", // Yellow/orange
  },
  {
    id: "status_done",
    label: "Done",
    color: "#00c875", // Green
  },
  {
    id: "status_stuck",
    label: "Stuck",
    color: "#e2445c", // Red
  },
];

// Default dropdown options for Dropdown columns
export const DEFAULT_DROPDOWN_OPTIONS = [
  { id: "option-1", label: "Option 1", color: "#3498db" },
  { id: "option-2", label: "Option 2", color: "#9b59b6" },
  { id: "option-3", label: "Option 3", color: "#2ecc71" },
];

// Column type display options matching Monday.com UI
export const COLUMN_TYPE_COLORS = {
  PORTAL: "#ff7575", // Orange-red
  MAINTENANCE: "#a1a1a1", // Gray
  WEBSITE_UPDATE: "#784bd1", // Purple
  OTHER: "#0086c0", // Blue
  PROJECT: "#fdab3d", // Yellow
  NEW_WEBSITE: "#784bd1", // Purple (darker)
};

// Visual styling constants for pills/badges
export const STATUS_PILL_STYLES = {
  base: "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-24 text-center",
  todo: "bg-gray-100 text-gray-800",
  working: "bg-[#fdab3d] text-white",
  done: "bg-[#00c875] text-white",
  stuck: "bg-[#e2445c] text-white",
  // Custom column type styles
  portal: "bg-[#ff7575] text-white",
  maintenance: "bg-[#a1a1a1] text-white",
  website_update: "bg-[#784bd1] text-white",
  other: "bg-[#0086c0] text-white",
  project: "bg-[#fdab3d] text-white",
};
