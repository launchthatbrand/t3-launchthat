import { defineTable } from "convex/server";
import { v } from "convex/values";

export const usageSchema = {
  orgUsageCounters: defineTable({
    organizationId: v.id("organizations"),
    kind: v.string(),
    scope: v.union(v.string(), v.null()),
    windowStartMs: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_org_kind_scope_window", [
    "organizationId",
    "kind",
    "scope",
    "windowStartMs",
  ]),
};


