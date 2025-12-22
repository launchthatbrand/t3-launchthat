import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import { query } from "../../_generated/server";
import { getScopedPostTypeBySlug } from "../postTypes/lib/contentTypes";

const postMetaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);

const postMetaEntryValidator = v.object({
  _id: v.id("postsMeta"),
  _creationTime: v.number(),
  postId: v.id("posts"),
  key: v.string(),
  value: v.optional(postMetaValueValidator),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

type PostMetaEntry = {
  _id: Id<"postsMeta">;
  _creationTime: number;
  postId: Id<"posts">;
  key: string;
  value?: string | number | boolean | null;
  createdAt: number;
  updatedAt?: number;
};

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(postMetaEntryValidator),
  handler: async (ctx, args): Promise<PostMetaEntry[]> => {
    const postId = args.postId as Id<"posts">;
    const requestedOrg = args.organizationId ?? undefined;

    const postType = args.postTypeSlug
      ? await getScopedPostTypeBySlug(ctx, args.postTypeSlug, requestedOrg)
      : null;
    const storageKind = postType?.storageKind;
    const storageTables = postType?.storageTables ?? [];
    const isSupportComponent =
      storageKind === "component" &&
      storageTables.some((table) => table.includes("launchthat_support:posts"));

    if (isSupportComponent) {
      const meta = await ctx.runQuery(
        api.plugins.support.queries.getSupportPostMeta,
        {
          postId,
          organizationId: requestedOrg as Id<"organizations"> | undefined,
        },
      );

      if (!Array.isArray(meta)) {
        return [];
      }

      return meta.map((entry): PostMetaEntry => {
        const record = entry as unknown as PostMetaEntry;
        return {
          _id: record._id,
          _creationTime: record._creationTime,
          postId: record.postId,
          key: record.key,
          value: record.value,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };
      });
    }

    const post = await ctx.db.get(postId);
    if (!post) {
      return [];
    }
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return [];
    }

    const meta = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    return meta as unknown as PostMetaEntry[];
  },
});
