import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";

const metaValueValidator = v.union(v.string(), v.number(), v.boolean(), v.null());

export const listDownloadMeta = query({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
  },
  returns: v.array(
    v.object({
      _id: v.id("downloadsMeta"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      downloadId: v.id("downloads"),
      key: v.string(),
      value: v.optional(metaValueValidator),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("downloadsMeta")
      .withIndex("by_org_and_download", (q) =>
        q.eq("organizationId", args.organizationId).eq("downloadId", args.downloadId),
      )
      .collect();
  },
});

export const upsertDownloadMeta = mutation({
  args: {
    organizationId: v.id("organizations"),
    downloadId: v.id("downloads"),
    meta: v.record(v.string(), metaValueValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const download = await ctx.db.get(args.downloadId);
    if (!download || download.organizationId !== args.organizationId) {
      throw new Error("Download not found");
    }

    for (const [key, value] of Object.entries(args.meta)) {
      const existing = await ctx.db
        .query("downloadsMeta")
        .withIndex("by_org_download_and_key", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("downloadId", args.downloadId)
            .eq("key", key),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
      } else {
        await ctx.db.insert("downloadsMeta", {
          organizationId: args.organizationId,
          downloadId: args.downloadId,
          key,
          value,
          createdAt: timestamp,
        });
      }
    }

    return null;
  },
});


