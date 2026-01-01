import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";

const upsertMetaEntry = async (
  ctx: any,
  postId: Id<"posts">,
  key: string,
  value: string | number | boolean | null,
) => {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q: any) => q.eq("postId", postId).eq("key", key))
    .unique();

  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { value, updatedAt: now });
  } else {
    await ctx.db.insert("postsMeta", { postId, key, value, createdAt: now, updatedAt: now });
  }
};

export const ensureDefaultCheckout = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;

    const existing = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_slug", (q: any) =>
            q.eq("organizationId", organizationId).eq("slug", DEFAULT_CHECKOUT_SLUG),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q: any) => q.eq("slug", DEFAULT_CHECKOUT_SLUG))
          .filter((q: any) => q.eq(q.field("organizationId"), undefined))
          .unique();

    if (existing && existing.postTypeSlug === "checkout") {
      // Ensure required meta keys exist.
      await upsertMetaEntry(ctx, existing._id as Id<"posts">, "checkout.design", "default");
      await upsertMetaEntry(
        ctx,
        existing._id as Id<"posts">,
        "checkout.predefinedProductsJson",
        "[]",
      );
      return String(existing._id);
    }

    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      title: "Default Checkout",
      content: undefined,
      excerpt: undefined,
      slug: DEFAULT_CHECKOUT_SLUG,
      status: "published",
      category: undefined,
      tags: undefined,
      featuredImageUrl: undefined,
      postTypeSlug: "checkout",
      organizationId,
      authorId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await upsertMetaEntry(ctx, postId as Id<"posts">, "checkout.design", "default");
    // Default checkout must not have predefined products, but we store an explicit empty list.
    await upsertMetaEntry(
      ctx,
      postId as Id<"posts">,
      "checkout.predefinedProductsJson",
      "[]",
    );

    return String(postId);
  },
});


