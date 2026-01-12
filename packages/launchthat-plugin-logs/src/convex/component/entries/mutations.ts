import { v } from "convex/values";

import { mutation } from "../server";

export const insertLogEntry = mutation({
  args: {
    organizationId: v.string(),
    pluginKey: v.string(),
    kind: v.string(),
    email: v.optional(v.string()),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
    ),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("running"),
        v.literal("complete"),
        v.literal("failed"),
      ),
    ),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    scopeKind: v.optional(v.string()),
    scopeId: v.optional(v.string()),
    actorUserId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.optional(v.number()),
  },
  returns: v.id("logEntries"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("logEntries", {
      organizationId: args.organizationId,
      pluginKey: args.pluginKey,
      kind: args.kind,
      email: args.email,
      level: args.level,
      status: args.status,
      message: args.message,
      actionUrl: args.actionUrl,
      scopeKind: args.scopeKind,
      scopeId: args.scopeId,
      actorUserId: args.actorUserId,
      metadata: args.metadata,
      createdAt: args.createdAt ?? Date.now(),
    });
  },
});
