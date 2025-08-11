import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
/**
 * Schema definition for the Integration Apps table
 *
 * This table stores the available third-party applications that can be integrated
 * with the portal. Each app represents a service like WordPress, Monday.com, etc.
 */
export const appsTable = defineTable({
    // Name of the integration app (e.g., "WordPress", "Monday.com")
    name: v.string(),
    // Description of what the app does and what features it supports
    description: v.string(),
    // Type of authentication required (oauth, apiKey, usernamePassword, internal, none)
    authType: v.string(),
    // JSON template for app-specific configuration options
    configTemplate: v.string(),
    // URL to the app's icon image
    iconUrl: v.optional(v.string()),
    // Whether this app is enabled and available for users
    isEnabled: v.boolean(),
    // Whether this is an internal/built-in app that doesn't require external connections
    isInternal: v.optional(v.boolean()),
    // Creation timestamp
    createdAt: v.number(),
    // Last update timestamp
    updatedAt: v.number(),
})
    // Index for looking up apps by name
    .index("by_name", ["name"])
    // Index for filtering enabled/disabled apps
    .index("by_enabled", ["isEnabled"]);
/**
 * Export the apps schema
 */
export const integrationsAppsSchema = defineSchema({
    apps: appsTable,
});
