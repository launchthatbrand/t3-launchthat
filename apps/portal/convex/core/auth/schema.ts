import { defineTable } from "convex/server";
import { v } from "convex/values";

export const authExchangeCodesTable = defineTable({
  // Store only a hash of the one-time code; never store plaintext.
  codeHash: v.string(),
  organizationId: v.id("organizations"),
  clerkUserId: v.string(),
  createdAt: v.number(),
  expiresAt: v.number(),
  usedAt: v.optional(v.number()),
})
  .index("by_codeHash", ["codeHash"])
  .index("by_organizationId_and_clerkUserId", ["organizationId", "clerkUserId"])
  .index("by_expiresAt", ["expiresAt"]);

export const tenantSessionsTable = defineTable({
  // Store only a hash of the session id; cookie holds the plaintext session id.
  sessionIdHash: v.string(),
  organizationId: v.id("organizations"),
  clerkUserId: v.string(),
  createdAt: v.number(),
  expiresAt: v.number(),
  revokedAt: v.optional(v.number()),
  lastSeenAt: v.optional(v.number()),
})
  .index("by_sessionIdHash", ["sessionIdHash"])
  .index("by_organizationId_and_clerkUserId", ["organizationId", "clerkUserId"])
  .index("by_expiresAt", ["expiresAt"]);

export const authSchema = {
  authExchangeCodes: authExchangeCodesTable,
  tenantSessions: tenantSessionsTable,
};

