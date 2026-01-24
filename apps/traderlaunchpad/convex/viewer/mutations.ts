import { ConvexError, v } from "convex/values";

import { api } from "../_generated/api";
import { mutation } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { userPublicProfileConfigV1Validator } from "../publicProfiles/types";

type DataMode = "demo" | "live";

const normalizePublicUsername = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const isReservedPublicUsername = (username: string): boolean => {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  if (u === "platform") return true;
  if (u.startsWith("__")) return true;
  // Avoid obvious app routes.
  if (u === "admin" || u === "org" || u === "orgs" || u === "u") return true;
  return false;
};

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
    publicUsername: v.optional(v.union(v.string(), v.null())),
    avatarMediaId: v.optional(v.union(v.id("userMedia"), v.null())),
    coverMediaId: v.optional(v.union(v.id("userMedia"), v.null())),
    publicProfileConfig: v.optional(v.union(userPublicProfileConfigV1Validator, v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const userDocId = (await ctx.runMutation(
      api.coreTenant.mutations.createOrGetUser,
      {},
    )) as Id<"users"> | null;
    if (!userDocId) throw new ConvexError("Unauthorized");

    const now = Date.now();
    const patch: Partial<Doc<"users">> = { updatedAt: now };

    if (typeof args.name === "string") {
      const next = args.name.trim();
      patch.name = next || undefined;
    }
    if (typeof args.bio === "string") {
      const next = args.bio.trim();
      patch.bio = next || undefined;
    }
    if (args.avatarMediaId !== undefined) {
      patch.avatarMediaId = args.avatarMediaId ?? undefined;
    }
    if (args.coverMediaId !== undefined) {
      patch.coverMediaId = args.coverMediaId ?? undefined;
    }

    if (args.publicProfileConfig !== undefined) {
      patch.publicProfileConfig = args.publicProfileConfig ?? undefined;
    }

    if (args.publicUsername !== undefined) {
      if (args.publicUsername === null) {
        patch.publicUsername = undefined;
      } else {
        const normalized = normalizePublicUsername(args.publicUsername);
        if (!normalized) {
          patch.publicUsername = undefined;
        } else {
          if (isReservedPublicUsername(normalized)) {
            throw new ConvexError("Username is reserved.");
          }
          const existing = await ctx.db
            .query("users")
            .withIndex("by_public_username", (q) => q.eq("publicUsername", normalized))
            .first();
          if (existing && existing._id !== userDocId) {
            throw new ConvexError("Username is already taken.");
          }
          patch.publicUsername = normalized;
        }
      }
    }

    await ctx.db.patch(userDocId, patch);
    return null;
  },
});

