import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * TraderLaunchpad app-owned tables.
 *
 * Design decision:
 * - `users` lives in the root app schema (app-owned).
 * - `organizations` + memberships live in the `launchthat_core_tenant` component.
 *   Therefore cross-boundary references (like the active org) are stored as strings.
 */
export default defineSchema({
  users: defineTable({
    email: v.string(),
    tokenIdentifier: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),

    /**
     * Per-user data source mode.
     * - "live": prefer broker-backed data when available.
     * - "demo": force demo/mock data (admin-only toggle).
     */
    dataMode: v.optional(v.union(v.literal("demo"), v.literal("live"))),

    /**
     * App-level admin flag (used for gated developer/admin tooling).
     * NOTE: this is app-owned and may be derived from an env allowlist.
     */
    isAdmin: v.optional(v.boolean()),

    /**
     * "Active org" selection.
     * This is a string because organizations live in a component and cannot be referenced by `v.id()`.
     */
    organizationId: v.optional(v.string()),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_organization", ["organizationId"]),
});

