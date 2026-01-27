import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

import { userPublicProfileConfigV1Validator } from "./publicProfiles/types";

const slugifyUsername = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

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
    const raw = args.username.trim().toLowerCase();
    if (!raw) return null;

    // Accept a few common variants so legacy usernames still resolve.
    // Canonical format is slug-only (a-z0-9-), but older/demo data may contain dots.
    const canonical = slugifyUsername(raw);
    const dotVariant = canonical.replace(/-/g, ".");
    const candidates = Array.from(
      new Set([raw, canonical, dotVariant].filter((x) => typeof x === "string" && x.trim())),
    );

    let user: any = null;
    let matchedUsername = "";
    for (const candidate of candidates) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user =
        (await ctx.db
          .query("users")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_public_username", (q: any) =>
            q.eq("publicUsername", candidate),
          )
          .first()) ?? null;
      if (user) {
        matchedUsername = candidate;
        break;
      }
    }
    if (!user) return null;

    // Public profile visibility is user-controlled.
    const ownerUserId = String(user._id ?? "").trim();
    if (!ownerUserId) return null;
    const visibility = await ctx.db
      .query("userVisibilitySettings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_user", (q: any) => q.eq("userId", ownerUserId))
      .first();
    if (!visibility || !Boolean((visibility as any).publicProfileEnabled)) {
      return null;
    }

    const resolvedPublicUsername =
      typeof user.publicUsername === "string" && user.publicUsername.trim()
        ? user.publicUsername.trim().toLowerCase()
        : matchedUsername;

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
      resolvedPublicUsername;

    return {
      _id: user._id,
      publicUsername: resolvedPublicUsername,
      displayName,
      bio: typeof (user as any).bio === "string" ? (user as any).bio : undefined,
      avatarUrl,
      coverUrl,
      publicProfileConfig: (user as any).publicProfileConfig ?? undefined,
    };
  },
});

