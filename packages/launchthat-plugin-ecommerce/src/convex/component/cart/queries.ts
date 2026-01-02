import { v } from "convex/values";

import { query } from "../_generated/server";

export const getCart = query({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const userId = args.userId ?? undefined;
    const guestSessionId = args.guestSessionId ?? undefined;

    let items: any[] = [];
    if (userId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } else if (guestSessionId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_guest", (q: any) =>
          q.eq("guestSessionId", guestSessionId),
        )
        .order("desc")
        .collect();
    }

    const metaKey = (key: string) => key;
    const getMetaValue = (meta: Array<{ key: string; value?: unknown }>, key: string) =>
      meta.find((m) => m.key === key)?.value;

    const enrichedItems: any[] = [];
    for (const row of items) {
      const product = row?.productPostId
        ? await ctx.db.get(row.productPostId as any)
        : null;
      const productMeta = product?._id
        ? await ctx.db
            .query("postsMeta")
            .withIndex("by_post", (q: any) => q.eq("postId", product._id))
            .collect()
        : [];

      const regularPrice = getMetaValue(productMeta, metaKey("product.regularPrice"));
      const salePrice = getMetaValue(productMeta, metaKey("product.salePrice"));
      const isVirtual = getMetaValue(productMeta, metaKey("product.isVirtual")) === true;
      const resolvedPrice =
        typeof salePrice === "number"
          ? salePrice
          : typeof regularPrice === "number"
            ? regularPrice
            : null;

      enrichedItems.push({
        _id: row._id,
        productPostId: row.productPostId,
        variationId: row.variationId ?? null,
        quantity: row.quantity,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        product: product
          ? {
              _id: product._id,
              title: product.title,
              slug: product.slug,
              featuredImageUrl: product.featuredImageUrl ?? null,
              postTypeSlug: product.postTypeSlug,
              isVirtual,
            }
          : null,
        unitPrice: resolvedPrice,
      });
    }

    return {
      items: enrichedItems,
      subtotal: null,
      total: null,
    };
  },
});
