import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define reusable field value validators to match contentTypes.ts
const fieldDefaultValue = v.optional(
  v.union(v.string(), v.number(), v.boolean(), v.null()),
);

const fieldValidationRules = v.optional(
  v.union(
    v.record(
      v.string(),
      v.union(
        v.string(),
        v.number(),
        v.boolean(),
        v.array(v.union(v.string(), v.number())),
        v.object({
          min: v.optional(v.number()),
          max: v.optional(v.number()),
          pattern: v.optional(v.string()),
          required: v.optional(v.boolean()),
          message: v.optional(v.string()),
        }),
      ),
    ),
    v.null(),
  ),
);

const fieldOptions = v.optional(
  v.union(
    // New structure: direct array of options
    v.array(
      v.object({
        label: v.string(),
        value: v.union(v.string(), v.number()),
        description: v.optional(v.string()),
        disabled: v.optional(v.boolean()),
      }),
    ),
    // Legacy structure: object with nested properties
    v.record(
      v.string(),
      v.union(
        v.string(),
        v.number(),
        v.boolean(),
        v.array(
          v.union(
            v.string(),
            v.number(),
            v.object({
              label: v.string(),
              value: v.union(v.string(), v.number()),
            }),
          ),
        ),
      ),
    ),
    v.null(),
  ),
);

const fieldUiConfig = v.optional(
  v.union(
    v.record(
      v.string(),
      v.union(
        v.string(),
        v.number(),
        v.boolean(),
        v.object({
          component: v.optional(v.string()),
          props: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
          ),
          layout: v.optional(v.string()),
          validation: v.optional(v.boolean()),
          helpText: v.optional(v.string()),
        }),
      ),
    ),
    v.null(),
  ),
);

/**
 * Content Types Table - Defines different content types in the system
 */
export const contentTypesTable = defineTable({
  // Basic Info
  name: v.string(), // Display name (e.g., "Blog Post")
  slug: v.string(), // URL/API slug (e.g., "blog-posts")
  description: v.optional(v.string()), // Description of this content type

  // Configuration
  isBuiltIn: v.boolean(), // Whether this is a built-in type or custom
  isPublic: v.boolean(), // Whether this type is exposed via public API
  enableVersioning: v.optional(v.boolean()), // Whether to track content versions
  enableApi: v.optional(v.boolean()), // Whether to expose via API
  includeTimestamps: v.optional(v.boolean()), // Whether to include created/updated timestamps

  // Stats and Metadata
  fieldCount: v.optional(v.number()), // Number of fields (denormalized for performance)
  entryCount: v.optional(v.number()), // Number of entries (denormalized for performance)

  // System
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
})
  .index("by_slug", ["slug"])
  .index("by_isBuiltIn", ["isBuiltIn"]);

/**
 * Content Type Fields Table - Defines fields for each content type
 */
export const contentTypeFieldsTable = defineTable({
  // Relationship
  contentTypeId: v.id("contentTypes"), // Parent content type

  // Basic Info
  name: v.string(), // Display name (e.g., "Title")
  key: v.string(), // API/code key (e.g., "title")
  description: v.optional(v.string()), // Description of this field

  // Field Configuration
  type: v.union(
    v.literal("text"),
    v.literal("textarea"),
    v.literal("number"),
    v.literal("boolean"),
    v.literal("date"),
    v.literal("datetime"),
    v.literal("select"),
    v.literal("multiselect"),
    v.literal("relation"),
    v.literal("file"),
    v.literal("image"),
    v.literal("richtext"),
    v.literal("json"),
    v.literal("array"),
    v.string(), // Allow custom types as fallback
  ), // Specific field types with fallback for extensibility
  required: v.boolean(), // Whether this field is required
  searchable: v.optional(v.boolean()), // Whether this field should be searchable
  filterable: v.optional(v.boolean()), // Whether this field can be filtered on

  // Validation and Format
  defaultValue: fieldDefaultValue, // Default value for this field
  validationRules: fieldValidationRules, // Structured validation rules

  // Advanced Configuration
  options: fieldOptions, // Type-specific options (e.g., select options)
  isSystem: v.boolean(), // Whether this is a system field (e.g., id, createdAt)
  isBuiltIn: v.boolean(), // Whether this is a built-in field or custom

  // UI Configuration
  uiConfig: fieldUiConfig, // UI-specific configuration

  // Order
  order: v.number(), // Display order in forms/views

  // System
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
})
  .index("by_contentType", ["contentTypeId"])
  .index("by_contentType_isSystem", ["contentTypeId", "isSystem"])
  .index("by_contentType_key", ["contentTypeId", "key"]);

/**
 * Content schema combining content types and fields
 */
export const contentTypesSchema = {
  contentTypes: contentTypesTable,
  contentTypeFields: contentTypeFieldsTable,
};

/**
 * Field types available for content type fields
 */
export const FIELD_TYPES = [
  "text", // Single line of text
  "textarea", // Multiple lines of text
  "richText", // Rich text editor
  "number", // Numeric value
  "boolean", // True/false
  "date", // Date picker
  "time", // Time picker
  "datetime", // Date and time
  "select", // Single select from options
  "multiSelect", // Multiple select from options
  "relation", // Relation to another content type
  "image", // Image upload
  "file", // File upload
  "url", // URL input
  "email", // Email input
  "color", // Color picker
  "json", // JSON editor
  "code", // Code editor
  "location", // Geolocation (lat/lng)
  "user", // User reference
];
