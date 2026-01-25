import { v } from "convex/values";

import { query } from "../_generated/server";

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      bio: v.optional(v.string()),
      publicUsername: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
      avatarMediaId: v.optional(v.id("userMedia")),
      coverMediaId: v.optional(v.id("userMedia")),
      organizationId: v.optional(v.string()),
      tokenIdentifier: v.optional(v.string()),
      clerkId: v.optional(v.string()),
      // Portal parity: expose a simple role string for UI decisions.
      role: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const resolveMediaUrl = async (mediaId: unknown): Promise<string | undefined> => {
      if (!mediaId) return undefined;
      const row = await ctx.db.get(mediaId as any);
      const storageId = (row as any)?.storageId;
      if (!storageId) return undefined;
      const url = await ctx.storage.getUrl(storageId);
      return typeof url === "string" ? url : undefined;
    };

    const project = async (user: any | null) => {
      if (!user) return null;
      const avatarUrlFromMedia = await resolveMediaUrl(user.avatarMediaId);
      const coverUrlFromMedia = await resolveMediaUrl(user.coverMediaId);
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        bio: typeof user.bio === "string" ? user.bio : undefined,
        publicUsername:
          typeof user.publicUsername === "string" && user.publicUsername.trim()
            ? user.publicUsername.trim().toLowerCase()
            : undefined,
        avatarMediaId: user.avatarMediaId ?? undefined,
        coverMediaId: user.coverMediaId ?? undefined,
        avatarUrl: avatarUrlFromMedia ?? (typeof user.image === "string" ? user.image : undefined),
        coverUrl: coverUrlFromMedia,
        organizationId: user.organizationId ?? undefined,
        tokenIdentifier: user.tokenIdentifier ?? undefined,
        clerkId: user.clerkId ?? undefined,
        role: user.isAdmin ? ("admin" as const) : undefined,
      };
    };

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.tokenIdentifier) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      return await project(user ?? null);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .first();
    return await project(user ?? null);
  },
});

