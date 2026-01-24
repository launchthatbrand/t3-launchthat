import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

import { userPublicProfileConfigV1Validator } from "./publicProfiles/types";

export const getUserPublicProfileByUsername = query({
  args: { username: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      publicUsername: v.string(),
      displayName: v.string(),
      bio: v.optional(v.string()),
      avatarUrl: v.union(v.string(), v.null()),
      coverUrl: v.union(v.string(), v.null()),
      publicProfileConfig: v.optional(userPublicProfileConfigV1Validator),
    }),
  ),
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    if (!username) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_public_username", (q) => q.eq("publicUsername", username))
      .first();
    if (!user) return null;

    const resolveMediaUrl = async (mediaId: unknown): Promise<string | null> => {
      if (!mediaId) return null;
      const media = await ctx.db.get(mediaId as Id<"userMedia">);
      if (!media) return null;
      const url = await ctx.storage.getUrl(media.storageId);
      return url;
    };

    const avatarUrl = (await resolveMediaUrl((user as any).avatarMediaId)) ?? user.image ?? null;
    const coverUrl = await resolveMediaUrl((user as any).coverMediaId);

    const displayName =
      (typeof user.name === "string" && user.name.trim() ? user.name.trim() : "") ||
      user.email.split("@")[0] ||
      username;

    return {
      _id: user._id,
      publicUsername: username,
      displayName,
      bio: typeof (user as any).bio === "string" ? (user as any).bio : undefined,
      avatarUrl,
      coverUrl,
      publicProfileConfig: (user as any).publicProfileConfig ?? undefined,
    };
  },
});

