import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const metaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);

export const sanitizeSlug = (value: string | undefined) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const ensureUniqueSlug = async (
  ctx: MutationCtx,
  baseSlug: string,
  organizationId: string | undefined,
  excludeId?: Id<"posts">,
) => {
  let attempt = baseSlug || `post-${Date.now()}`;
  let counter = 2;

  while (true) {
    const existing = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_slug", (q) =>
            q.eq("organizationId", organizationId).eq("slug", attempt),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q) => q.eq("slug", attempt))
          .filter((q) => q.eq(q.field("organizationId"), undefined))
          .unique();

    if (!existing || (excludeId && existing._id === excludeId)) {
      return attempt;
    }

    attempt = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

export const upsertPostMeta = async (
  ctx: MutationCtx,
  postId: Id<"posts">,
  meta: Record<string, string | number | boolean | null>,
) => {
  const timestamp = Date.now();
  for (const [key, value] of Object.entries(meta)) {
    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q) =>
        q.eq("postId", postId).eq("key", key),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
    } else {
      await ctx.db.insert("postsMeta", {
        postId,
        key,
        value,
        createdAt: timestamp,
      });
    }
  }
};

export const organizationMatches = (
  recordOrg: string | undefined,
  requestedOrg?: string,
) => {
  const normalizedRequested = requestedOrg ?? undefined;
  return (recordOrg ?? undefined) === normalizedRequested;
};

