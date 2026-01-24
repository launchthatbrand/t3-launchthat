import { ConvexError, v } from "convex/values";

import { api } from "../_generated/api";
import { mutation } from "../_generated/server";

type DataMode = "demo" | "live";

export const setDataMode = mutation({
  args: {
    dataMode: v.union(v.literal("demo"), v.literal("live")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Ensure root user exists and has up-to-date admin flag.
    const userDocId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (!userDocId) throw new ConvexError("Unauthorized");

    const user = await ctx.db.get(userDocId);
    if (!user) throw new ConvexError("User not found");

    if (!user.isAdmin) {
      throw new ConvexError("Forbidden: admin access required.");
    }

    await ctx.db.patch(user._id, {
      dataMode: args.dataMode as DataMode,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateViewerProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarMediaId: v.optional(v.union(v.id("userMedia"), v.null())),
    coverMediaId: v.optional(v.union(v.id("userMedia"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const userDocId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (!userDocId) throw new ConvexError("Unauthorized");

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (typeof args.name === "string") {
      const next = args.name.trim();
      patch.name = next || undefined;
    }
    if (typeof args.bio === "string") {
      const next = args.bio.trim();
      patch.bio = next || undefined;
    }
    if (args.avatarMediaId !== undefined) {
      patch.avatarMediaId = args.avatarMediaId === null ? undefined : args.avatarMediaId;
    }
    if (args.coverMediaId !== undefined) {
      patch.coverMediaId = args.coverMediaId === null ? undefined : args.coverMediaId;
    }

    await ctx.db.patch(userDocId, patch as any);
    return null;
  },
});

