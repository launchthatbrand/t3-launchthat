import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

type DownloadDoc = Doc<"downloads">;
type MediaDoc = Doc<"mediaItems">;

const downloadPublicValidator = v.object({
  _id: v.id("downloads"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  slug: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  content: v.optional(v.string()),
  mediaItemId: v.id("mediaItems"),
  r2Key: v.optional(v.string()),
  source: v.object({ kind: v.literal("mediaItem") }),
  access: v.object({ kind: v.union(v.literal("public"), v.literal("gated")) }),
  status: v.union(v.literal("draft"), v.literal("published")),
  downloadCountTotal: v.number(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const mediaSummaryValidator = v.object({
  _id: v.id("mediaItems"),
  title: v.optional(v.string()),
  mimeType: v.optional(v.string()),
  url: v.optional(v.string()),
});

export const getDownloadBySlug = query({
  args: {
    organizationId: v.id("organizations"),
    slug: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      download: downloadPublicValidator,
      media: mediaSummaryValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const download = await ctx.db
      .query("downloads")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug),
      )
      .unique();

    if (!download) return null;

    const media = await ctx.db.get(download.mediaItemId);

    let url: string | undefined;
    if (media?.storageId) {
      url = (await ctx.storage.getUrl(media.storageId)) ?? undefined;
    } else if (media?.externalUrl) {
      url = media.externalUrl;
    }

    return {
      download,
      media: {
        _id: download.mediaItemId,
        title: media?.title ?? undefined,
        mimeType: media?.mimeType ?? undefined,
        url,
      },
    };
  },
});

export const getDownloadById = query({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
  },
  returns: v.union(
    v.null(),
    v.object({
      download: downloadPublicValidator,
      media: v.union(v.null(), mediaSummaryValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const download = await ctx.db.get(args.downloadId);
    if (!download) return null;
    if (download.organizationId !== args.organizationId) return null;

    const media: MediaDoc | null = await ctx.db.get(download.mediaItemId);
    if (!media) {
      return { download, media: null };
    }

    let url: string | undefined;
    if (media.storageId) {
      url = (await ctx.storage.getUrl(media.storageId)) ?? undefined;
    } else if (media.externalUrl) {
      url = media.externalUrl;
    }

    return {
      download,
      media: {
        _id: media._id,
        title: media.title ?? undefined,
        mimeType: media.mimeType ?? undefined,
        url,
      },
    };
  },
});

export const listDownloads = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  returns: v.array(downloadPublicValidator),
  handler: async (ctx, args) => {
    const { organizationId, status } = args;

    const rows: DownloadDoc[] = status
      ? await ctx.db
          .query("downloads")
          .withIndex("by_org_and_status", (q) =>
            q.eq("organizationId", organizationId).eq("status", status),
          )
          .collect()
      : await ctx.db
          .query("downloads")
          .withIndex("by_org_and_status", (q) =>
            q.eq("organizationId", organizationId).eq("status", "draft"),
          )
          .collect();

    // If status isn't provided, include both draft and published.
    if (!status) {
      const published = await ctx.db
        .query("downloads")
        .withIndex("by_org_and_status", (q) =>
          q.eq("organizationId", organizationId).eq("status", "published"),
        )
        .collect();
      return [...rows, ...published].sort((a, b) => b.createdAt - a.createdAt);
    }

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});


