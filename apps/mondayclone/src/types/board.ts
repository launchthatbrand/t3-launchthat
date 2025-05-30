// Data models for Monday.com clone

export enum ColumnType {
  Text = "text",
  LongText = "long_text",
  Number = "number",
  Email = "email",
  Phone = "phone",
  Date = "date",
  Dropdown = "dropdown",
  User = "user",
  Checkbox = "checkbox",
  Link = "link",
  Name = "name",
  Status = "status",
}

export interface Folder {
  id: string;
  name: string;
  boards: string[]; // Array of Board IDs
}

export interface Board {
  id: string;
  name: string;
  groups: string[]; // Array of Group IDs
  columns: Column[];
  folderId?: string; // Optional, if board is in a folder
}

export interface Group {
  id: string;
  name: string;
  boardId: string;
  items: string[]; // Array of Item IDs
  color: string; // Hex or Tailwind color
}

export interface Item {
  id: string;
  name: string;
  groupId: string;
  // Dynamic columns: key is columnId, value is unknown
  [columnId: string]: unknown;
}

export interface StatusOption {
  id: string;
  label: string;
  color: string;
}

export interface DropdownOption {
  id: string;
  label: string;
  color: string;
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  boardId: string;
  config?:
    | { type: ColumnType.Status; options: StatusOption[] }
    | { type: ColumnType.Dropdown; options: DropdownOption[] }
    | Record<string, unknown>;
}

// User model for Owner column
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string; // Added for placeholder styling
}
