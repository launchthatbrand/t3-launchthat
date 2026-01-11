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

    const safeParseStringArray = (value: unknown): string[] => {
      if (typeof value !== "string") return [];
      const raw = value.trim();
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
          .map((v) => (typeof v === "string" ? v : ""))
          .map((v) => v.trim())
          .filter(Boolean);
      } catch {
        return [];
      }
    };

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
      const productTypeRaw = getMetaValue(productMeta, metaKey("product.type"));
      const productType =
        typeof productTypeRaw === "string" ? productTypeRaw.toLowerCase() : "";
      const subscriptionAmountMonthlyCents = getMetaValue(
        productMeta,
        metaKey("product.subscription.amountMonthly"),
      );
      const isVirtual = getMetaValue(productMeta, metaKey("product.isVirtual")) === true;
      const featuresRaw = getMetaValue(productMeta, metaKey("product.features"));
      const features = safeParseStringArray(featuresRaw);
      const resolvedPrice =
        productType === "simple_subscription"
          ? typeof subscriptionAmountMonthlyCents === "number"
            ? subscriptionAmountMonthlyCents / 100
            : null
          : typeof salePrice === "number"
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
              features,
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
