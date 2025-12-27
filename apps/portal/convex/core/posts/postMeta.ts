/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
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

const looksLikeConvexId = (value: string) => /^[a-z0-9]{32}$/.test(value);

const postMetaEntryValidator = v.object({
  // NOTE: For custom-table-backed post types, meta rows are stored in other
  // tables (e.g. downloadsMeta/mediaItemsMeta). We still return them through
  // this API to keep the admin editor metabox system unified. In those cases,
  // we synthesize an `_id`, which is not a real Convex `Id<"postsMeta">`.
  _id: v.string(),
  _creationTime: v.number(),
  // Same rationale: for custom-table-backed post types, `postId` is a
  // synthetic `custom:{postType}:{rawId}` string.
  postId: v.string(),
  key: v.string(),
  value: v.optional(postMetaValueValidator),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

interface PostMetaEntry {
  _id: string;
  _creationTime: number;
  postId: string;
  key: string;
  value?: string | number | boolean | null;
  createdAt: number;
  updatedAt?: number;
}

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.array(postMetaEntryValidator),
  handler: async (ctx, args): Promise<PostMetaEntry[]> => {
    const requestedOrg = args.organizationId ?? undefined;

    // Support synthetic IDs for custom-table-backed post types.
    // Format: `custom:{postTypeSlug}:{rawId}`
    const rawPostId = args.postId;
    const isSynthetic = rawPostId.startsWith("custom:");
    const syntheticParts = isSynthetic ? rawPostId.split(":") : null;
    const syntheticPostTypeSlug =
      syntheticParts && syntheticParts.length >= 3
        ? syntheticParts[1]?.toLowerCase()
        : undefined;
    const syntheticRawId =
      syntheticParts && syntheticParts.length >= 3
        ? syntheticParts.slice(2).join(":")
        : undefined;

    const resolvedPostTypeSlug =
      (args.postTypeSlug ?? syntheticPostTypeSlug)?.toLowerCase() ?? undefined;

    if (isSynthetic && resolvedPostTypeSlug && syntheticRawId && requestedOrg) {
      const orgId = requestedOrg as Id<"organizations">;
      if (
        resolvedPostTypeSlug === "downloads" ||
        resolvedPostTypeSlug === "download"
      ) {
        if (!looksLikeConvexId(syntheticRawId)) {
          return [];
        }
        const downloadId = syntheticRawId as Id<"downloads">;
        const download = await ctx.db.get(downloadId);
        if (!download || download.organizationId !== orgId) {
          return [];
        }
        const meta = await ctx.db
          .query("downloadsMeta")
          .withIndex("by_org_and_download", (q) =>
            q.eq("organizationId", orgId).eq("downloadId", downloadId),
          )
          .collect();

        return meta.map(
          (entry): PostMetaEntry => ({
            _id: `custom:meta:downloads:${entry._id}`,
            _creationTime: entry._creationTime,
            postId: rawPostId,
            key: entry.key,
            value: entry.value,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          }),
        );
      }

      if (
        resolvedPostTypeSlug === "attachments" ||
        resolvedPostTypeSlug === "attachment"
      ) {
        if (!looksLikeConvexId(syntheticRawId)) {
          return [];
        }
        const mediaItemId = syntheticRawId as Id<"mediaItems">;
        const mediaItem = await ctx.db.get(mediaItemId);
        if (!mediaItem) {
          return [];
        }
        const meta = await ctx.db
          .query("mediaItemsMeta")
          .withIndex("by_org_and_mediaItem", (q) =>
            q.eq("organizationId", orgId).eq("mediaItemId", mediaItemId),
          )
          .collect();

        return meta.map(
          (entry): PostMetaEntry => ({
            _id: `custom:meta:mediaItems:${entry._id}`,
            _creationTime: entry._creationTime,
            postId: rawPostId,
            key: entry.key,
            value: entry.value,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          }),
        );
      }
    }

    const postId = rawPostId as Id<"posts">;

    const postType = args.postTypeSlug
      ? await getScopedPostTypeBySlug(ctx, args.postTypeSlug, requestedOrg)
      : null;
    const storageKind = postType?.storageKind;
    const storageTables = postType?.storageTables ?? [];
    const isSupportComponent =
      storageKind === "component" &&
      storageTables.some((table) => table.includes("launchthat_support:posts"));
  const isLmsComponent =
    storageKind === "component" &&
    storageTables.some((table) => table.includes("launchthat_lms:posts"));
  const isDisclaimersComponent =
    storageKind === "component" &&
    storageTables.some((table) =>
      table.includes("launchthat_disclaimers:posts"),
    );

    if (isSupportComponent) {
      const metaUnknown: unknown = await ctx.runQuery(
        api.plugins.support.queries.getSupportPostMeta,
        {
          postId,
          organizationId: requestedOrg as Id<"organizations"> | undefined,
        },
      );

      if (!Array.isArray(metaUnknown)) {
        return [];
      }

      return metaUnknown.map((entry): PostMetaEntry => {
        const record = entry as unknown as {
          _id: string;
          _creationTime: number;
          postId: string;
          key: string;
          value?: string | number | boolean | null;
          createdAt: number;
          updatedAt?: number;
        };
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

  if (isLmsComponent) {
    const metaUnknown: unknown = await ctx.runQuery(
      api.plugins.lms.posts.queries.getPostMeta,
      {
        postId: rawPostId,
        organizationId: requestedOrg ? String(requestedOrg) : undefined,
      },
    );

    return Array.isArray(metaUnknown)
      ? metaUnknown.map((entry): PostMetaEntry => {
          const record = entry as unknown as {
            _id: string;
            _creationTime: number;
            postId: string;
            key: string;
            value?: string | number | boolean | null;
            createdAt: number;
            updatedAt?: number;
          };
          return {
            _id: record._id,
            _creationTime: record._creationTime,
            postId: record.postId,
            key: record.key,
            value: record.value,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          };
        })
      : [];
  }

  if (isDisclaimersComponent) {
    const metaUnknown: unknown = await ctx.runQuery(
      api.plugins.disclaimers.posts.queries.getPostMeta,
      {
        postId: rawPostId,
        organizationId: requestedOrg ? String(requestedOrg) : undefined,
      },
    );

    return Array.isArray(metaUnknown)
      ? metaUnknown.map((entry): PostMetaEntry => {
          const record = entry as unknown as {
            _id: string;
            _creationTime: number;
            postId: string;
            key: string;
            value?: string | number | boolean | null;
            createdAt: number;
            updatedAt?: number;
          };
          return {
            _id: record._id,
            _creationTime: record._creationTime,
            postId: record.postId,
            key: record.key,
            value: record.value,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          };
        })
      : [];
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

    return meta.map(
      (entry): PostMetaEntry => ({
        _id: entry._id,
        _creationTime: entry._creationTime,
        postId: entry.postId,
        key: entry.key,
        value: entry.value,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }),
    );
  },
});
