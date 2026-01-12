"use node";

import { v } from "convex/values";

export const notificationEventPayloadValidator = v.object({
  orgId: v.id("organizations"),
  eventKey: v.string(),
  tabKey: v.string(),
  scopeKind: v.string(),
  scopeId: v.union(v.string(), v.null()),
  title: v.string(),
  content: v.union(v.string(), v.null()),
  actionUrl: v.union(v.string(), v.null()),
  actionData: v.union(v.record(v.string(), v.string()), v.null()),
  sourceUserId: v.union(v.id("users"), v.null()),
  expiresAt: v.union(v.number(), v.null()),
  createdAt: v.number(),

  // Precomputed recipients per channel
  emailRecipients: v.array(
    v.object({
      userId: v.id("users"),
      email: v.string(),
    }),
  ),
});


