import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { internalMutation, mutation } from "../../_generated/server";
import { generateSlug } from "../../lib/slugs";
import { r2 } from "../../r2";
import { canAccessDownload } from "./policy";

type DownloadDoc = Doc<"downloads">;
type MediaDoc = Doc<"mediaItems">;

const ensureUniqueDownloadSlug = async (
  ctx: { db: { query: any } },
  organizationId: Id<"organizations">,
  desiredSlug: string,
  excludeId?: Id<"downloads">,
): Promise<string> => {
  const base = generateSlug(desiredSlug) || "download";
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing: DownloadDoc | null = await ctx.db
      .query("downloads")
      .withIndex("by_org_and_slug", (q: any) =>
        q.eq("organizationId", organizationId).eq("slug", slug),
      )
      .unique();

    if (!existing || (excludeId && existing._id === excludeId)) {
      return slug;
    }

    suffix += 1;
    slug = `${base}-${suffix}`;
  }
};

export const createDownloadFromMediaItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    mediaItemId: v.id("mediaItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    slug: v.optional(v.string()),
    accessKind: v.optional(v.union(v.literal("public"), v.literal("gated"))),
  },
  returns: v.id("downloads"),
  handler: async (ctx, args) => {
    const media: MediaDoc | null = await ctx.db.get(args.mediaItemId);
    if (!media) {
      throw new Error("Attachment not found.");
    }

    const title = args.title ?? media.title ?? "Download";
    const desiredSlug = args.slug ?? title;
    const slug = await ensureUniqueDownloadSlug(
      ctx,
      args.organizationId,
      desiredSlug,
    );

    const now = Date.now();
    const id = await ctx.db.insert("downloads", {
      organizationId: args.organizationId,
      slug,
      title,
      description: args.description,
      content: args.content,
      mediaItemId: args.mediaItemId,
      r2Key: undefined,
      source: { kind: "mediaItem" as const },
      access: { kind: args.accessKind ?? "public" },
      status: "draft",
      downloadCountTotal: 0,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const updateDownload = mutation({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
    data: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      slug: v.optional(v.string()),
      accessKind: v.optional(v.union(v.literal("public"), v.literal("gated"))),
      status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
      mediaItemId: v.optional(v.id("mediaItems")),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const download = await ctx.db.get(args.downloadId);
    if (!download || download.organizationId !== args.organizationId) {
      throw new Error("Download not found.");
    }

    const updates: Partial<DownloadDoc> = { updatedAt: Date.now() } as any;

    if (typeof args.data.title === "string") {
      updates.title = args.data.title;
    }
    if (typeof args.data.description === "string") {
      updates.description = args.data.description;
    }
    if (typeof args.data.content === "string") {
      updates.content = args.data.content;
    }
    if (typeof args.data.accessKind === "string") {
      updates.access = { kind: args.data.accessKind } as any;
    }
    if (args.data.mediaItemId) {
      const media = await ctx.db.get(args.data.mediaItemId);
      if (!media) {
        throw new Error("Attachment not found.");
      }
      updates.mediaItemId = args.data.mediaItemId;
      // If you change the underlying media item, the R2 copy is no longer valid.
      updates.r2Key = undefined;
      // If currently published, force back to draft until republished.
      updates.status = "draft";
    }
    if (typeof args.data.slug === "string") {
      updates.slug = await ensureUniqueDownloadSlug(
        ctx,
        args.organizationId,
        args.data.slug,
        args.downloadId,
      );
    }

    // Publishing is handled by the publish action (copy to R2).
    if (args.data.status === "draft") {
      updates.status = "draft";
    }

    await ctx.db.patch(args.downloadId, updates as any);
    return null;
  },
});

export const requestDownloadUrl = mutation({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
    expiresInSeconds: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const download = await ctx.db.get(args.downloadId);
    if (!download || download.organizationId !== args.organizationId) {
      throw new Error("Download not found.");
    }

    if (download.status !== "published") {
      throw new Error("Download is not published.");
    }
    if (!download.r2Key) {
      throw new Error("Download is not ready yet.");
    }

    // v1 viewer context: gated downloads require authentication.
    const identity = await ctx.auth.getUserIdentity();
    const allowed = canAccessDownload(download, {
      isAuthenticated: Boolean(identity),
    });
    if (!allowed) {
      throw new Error("Access denied.");
    }

    // Increment totals. (We keep optional event row for future auditability.)
    await ctx.db.patch(args.downloadId, {
      downloadCountTotal: (download.downloadCountTotal ?? 0) + 1,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("downloadEvents", {
      organizationId: args.organizationId,
      downloadId: args.downloadId,
      createdAt: Date.now(),
    });

    const expiresIn = Math.max(
      30,
      Math.min(60 * 60 * 24, args.expiresInSeconds ?? 300),
    );

    return await r2.getUrl(download.r2Key, { expiresIn });
  },
});

export const finalizePublish = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
    r2Key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const download = await ctx.db.get(args.downloadId);
    if (!download || download.organizationId !== args.organizationId) {
      throw new Error("Download not found.");
    }

    await ctx.db.patch(args.downloadId, {
      r2Key: args.r2Key,
      status: "published",
      updatedAt: Date.now(),
    });
    return null;
  },
});


