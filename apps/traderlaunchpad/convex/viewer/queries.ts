import { query } from "../_generated/server";
import { v } from "convex/values";

type DataMode = "demo" | "live";

const normalizeDataMode = (value: unknown): DataMode => {
  return value === "demo" || value === "live" ? value : "live";
};

export const getViewerSettings = query({
  args: {},
  returns: v.object({
    isSignedIn: v.boolean(),
    isAdmin: v.boolean(),
    dataMode: v.union(v.literal("demo"), v.literal("live")),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isSignedIn: false, isAdmin: false, dataMode: "live" as const };
    }

    // Prefer tokenIdentifier (convex auth) when available.
    let existing =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first()) ?? null;

    if (
      !existing &&
      typeof identity.subject === "string" &&
      identity.subject.trim()
    ) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();
    }

    const isAdmin = Boolean(existing?.isAdmin);
    const dataMode = normalizeDataMode(existing?.dataMode);

    return { isSignedIn: true, isAdmin, dataMode };
  },
});

export const getViewerProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id("users"),
      email: v.string(),
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      avatarMediaId: v.optional(v.id("userMedia")),
      coverMediaId: v.optional(v.id("userMedia")),
      avatarUrl: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    let existing =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first()) ?? null;

    if (!existing && typeof identity.subject === "string" && identity.subject.trim()) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();
    }
    if (!existing) return null;

    const resolveMediaUrl = async (mediaId: unknown): Promise<string | undefined> => {
      if (!mediaId) return undefined;
      const row = await ctx.db.get(mediaId as any);
      const storageId = (row as any)?.storageId;
      if (!storageId) return undefined;
      const url = await ctx.storage.getUrl(storageId);
      return typeof url === "string" ? url : undefined;
    };

    const avatarUrlFromMedia = await resolveMediaUrl((existing as any).avatarMediaId);
    const coverUrlFromMedia = await resolveMediaUrl((existing as any).coverMediaId);

    return {
      userId: existing._id,
      email: String((existing as any).email ?? ""),
      name: typeof (existing as any).name === "string" ? (existing as any).name : undefined,
      bio: typeof (existing as any).bio === "string" ? (existing as any).bio : undefined,
      avatarMediaId: (existing as any).avatarMediaId ?? undefined,
      coverMediaId: (existing as any).coverMediaId ?? undefined,
      avatarUrl:
        avatarUrlFromMedia ??
        (typeof (existing as any).image === "string" ? (existing as any).image : undefined),
      coverUrl: coverUrlFromMedia,
    };
  },
});

