/**
 * CMS Type Definitions
 *
 * This module defines TypeScript interfaces for the Content Management System
 * to provide strong typing and replace 'any' types throughout the CMS codebase.
 */

import { Id } from "../_generated/dataModel";

/**
 * Field default value types
 * Supports primitive values and expressions
 */
export interface FieldDefaultValue {
  value: string | number | boolean | null;
  isExpression?: boolean;
  expression?: string;
}

/**
 * Individual validation rule structure
 */
export interface FieldValidationRule {
  type: "required" | "min" | "max" | "pattern" | "email" | "url" | "custom";
  message?: string;
  value?: string | number | boolean;
  params?: Record<string, string | number | boolean>;
}

/**
 * Collection of validation rules for a field
 */
export interface FieldValidationRules {
  required?: boolean | FieldValidationRule;
  min?: number | FieldValidationRule;
  max?: number | FieldValidationRule;
  pattern?: string | FieldValidationRule;
  email?: boolean | FieldValidationRule;
  url?: boolean | FieldValidationRule;
  custom?: FieldValidationRule[];
}

/**
 * Single option for select/choice fields
 */
export interface FieldOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
  color?: string;
  icon?: string;
  group?: string;
}

/**
 * Options collection - supporting both new array format and legacy object format
 */
export type FieldOptions =
  | FieldOption[]
  | {
      options?: FieldOption[];
      allowMultiple?: boolean;
      allowCustom?: boolean;
    }
  | Record<string, string>;

/**
 * UI configuration for field rendering
 */
export interface FieldUiConfig {
  displayName?: string;
  description?: string;
  placeholder?: string;
  helperText?: string;
  width?: string | number;
  hidden?: boolean;
  readOnly?: boolean;
  group?: string;
  order?: number;
  component?: string;
  componentProps?: Record<string, string | number | boolean>;
  layout?: {
    row?: number;
    column?: number;
    span?: number;
  };
  conditional?: {
    field: string;
    value: string | number | boolean;
    operator?:
      | "equals"
      | "not_equals"
      | "contains"
      | "greater_than"
      | "less_than";
  };
}

/**
 * Complete field definition for content types
 */
export interface PostTypeField {
  type:
    | "text"
    | "textarea"
    | "number"
    | "boolean"
    | "date"
    | "select"
    | "multiselect"
    | "file"
    | "image"
    | "relation"
    | "json";
  defaultValue?: FieldDefaultValue;
  validation?: FieldValidationRules;
  options?: FieldOptions;
  ui?: FieldUiConfig;
  isSystem?: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isSortable?: boolean;
  isLocalized?: boolean;
  relationConfig?: {
    targetContentType: string;
    displayField?: string;
    allowMultiple?: boolean;
  };
}

/**
 * Arguments for creating/updating content type fields
 */
export interface ContentTypeFieldArgs {
  name: string;
  field: PostTypeField;
}

/**
 * Content type definition
 */
export interface PostType {
  _id?: Id<"postTypes">;
  name: string;
  slug: string;
  description?: string;
  fields: Record<string, PostTypeField>;
  settings?: {
    enableDrafts?: boolean;
    enableVersioning?: boolean;
    enableComments?: boolean;
    enableWorkflow?: boolean;
  };
  permissions?: {
    create?: string[];
    read?: string[];
    update?: string[];
    delete?: string[];
  };
  metadata?: {
    createdAt?: number;
    updatedAt?: number;
    createdBy?: Id<"users">;
    updatedBy?: Id<"users">;
  };
}

/**
 * Content entry (instance of a content type)
 */
export interface ContentEntry {
  _id?: Id<"posts">; // Using "posts" as the generic content table
  postTypeId: Id<"postTypes">;
  status?: "draft" | "published" | "archived";
  slug?: string;
  data: Record<string, string | number | boolean | null | string[] | number[]>; // Field data with allowed types
  metadata?: {
    createdAt?: number;
    updatedAt?: number;
    publishedAt?: number;
    createdBy?: Id<"users">;
    updatedBy?: Id<"users">;
    version?: number;
  };
}

/**
 * Query filters for content
 */
export interface ContentQueryFilters {
  status?: string;
  authorId?: Id<"users">;
  postTypeId?: Id<"postTypes">;
  dateRange?: {
    start?: number;
    end?: number;
  };
  search?: string;
  tags?: string[];
  categories?: string[];
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Content query options
 */
export interface ContentQueryOptions {
  filters?: ContentQueryFilters;
  pagination?: PaginationOptions;
  sort?: SortOptions;
  includeMetadata?: boolean;
  includeDrafts?: boolean;
}
