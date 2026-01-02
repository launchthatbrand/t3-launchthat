import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { ensureUniqueSlug, sanitizeSlug } from "./helpers";

import {
  FUNNEL_DEFAULT_SLUG,
  STEP_FUNNEL_ID_KEY,
  STEP_FUNNEL_SLUG_KEY,
  STEP_IS_DEFAULT_FUNNEL_KEY,
} from "../../../shared/funnels/routingMeta";

const metaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);
const metaRecordValidator = v.record(v.string(), metaValueValidator);

const upsertMetaEntries = async (
  ctx: any,
  postId: Id<"posts">,
  meta: Record<string, unknown>,
) => {
  const now = Date.now();
  for (const [key, rawValue] of Object.entries(meta)) {
    // Only allow our supported primitives; coerce everything else to null.
    const value =
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean" ||
      rawValue === null
        ? rawValue
        : null;

    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", postId).eq("key", key),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: now });
    } else {
      await ctx.db.insert("postsMeta", {
        postId,
        key,
        value,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
};

const ORDER_LOCKED_META_KEYS = new Set<string>([
  "order.itemsJson",
  "order.itemsSubtotal",
  "order.orderTotal",
  "order.currency",
  "order.couponCode",
]);

const ORDER_USER_ID_KEY = "order.userId";
const ORDER_LEGACY_USER_ID_KEY = "order:userId";

const coerceMetaValue = (
  rawValue: unknown,
): string | number | boolean | null => {
  return typeof rawValue === "string" ||
    typeof rawValue === "number" ||
    typeof rawValue === "boolean" ||
    rawValue === null
    ? rawValue
    : null;
};

/**
 * Paid orders should allow updating non-item fields (like assigned user),
 * but should NOT allow changing the line items / totals.
 *
 * Some admin update flows send a large meta payload including unchanged values,
 * so we only block when a locked key's value actually changes.
 */
const assertOrderItemsWritable = async (
  ctx: any,
  post: any,
  meta: Record<string, unknown>,
) => {
  if (!post || String(post.postTypeSlug ?? "") !== "orders") return;
  if (String(post.status ?? "") !== "paid") return;

  for (const key of Object.keys(meta)) {
    if (!ORDER_LOCKED_META_KEYS.has(key)) continue;

    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", post._id).eq("key", key),
      )
      .unique();

    const existingValue =
      existing && "value" in (existing as any)
        ? ((existing as any).value as unknown)
        : null;
    const nextValue = coerceMetaValue(meta[key]);

    // Treat missing existing value as null (matches storage behavior).
    const normalizedExisting = coerceMetaValue(existingValue);

    if (normalizedExisting !== nextValue) {
      throw new Error("Paid orders cannot be modified.");
    }
  }
};

const createBaselineStepsForFunnel = async (ctx: any, args: {
  funnelId: Id<"posts">;
  funnelSlug: string;
  organizationId: string | undefined;
  isDefaultFunnel: boolean;
}) => {
  const now = Date.now();

  const checkoutStepId = await ctx.db.insert("posts", {
    title: "Checkout",
    content: undefined,
    excerpt: undefined,
    slug: "checkout",
    status: "published",
    category: undefined,
    tags: undefined,
    featuredImageUrl: undefined,
    postTypeSlug: "funnel_steps",
    organizationId: args.organizationId,
    authorId: undefined,
    createdAt: now,
    updatedAt: now,
  });

  await upsertMetaEntries(ctx, checkoutStepId as Id<"posts">, {
    [STEP_FUNNEL_ID_KEY]: String(args.funnelId),
    // Denormalized/system-owned routing fields used by permalink preview resolvers.
    [STEP_FUNNEL_SLUG_KEY]: args.funnelSlug,
    [STEP_IS_DEFAULT_FUNNEL_KEY]: args.isDefaultFunnel,
    "step.kind": "checkout",
    "step.order": 0,
    "step.checkout.design": "default",
    "step.checkout.predefinedProductsJson": "[]",
  });

  const thankYouSlug = args.isDefaultFunnel ? "order-confirmed" : "thank-you";
  const thankYouTitle = args.isDefaultFunnel ? "Order confirmed" : "Thank you";
  const thankYouStepId = await ctx.db.insert("posts", {
    title: thankYouTitle,
    content: undefined,
    excerpt: undefined,
    slug: thankYouSlug,
    status: "published",
    category: undefined,
    tags: undefined,
    featuredImageUrl: undefined,
    postTypeSlug: "funnel_steps",
    organizationId: args.organizationId,
    authorId: undefined,
    createdAt: now,
    updatedAt: now,
  });

  await upsertMetaEntries(ctx, thankYouStepId as Id<"posts">, {
    [STEP_FUNNEL_ID_KEY]: String(args.funnelId),
    [STEP_FUNNEL_SLUG_KEY]: args.funnelSlug,
    [STEP_IS_DEFAULT_FUNNEL_KEY]: args.isDefaultFunnel,
    "step.kind": "thankYou",
    "step.order": 1,
  });
};

export const createPost = mutation({
  args: {
    organizationId: v.optional(v.string()),
    postTypeSlug: v.string(),
    title: v.string(),
    slug: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    status: v.union(
      v.literal("published"),
      v.literal("draft"),
      v.literal("archived"),
      // Orders: ecommerce-specific lifecycle statuses (stored in post.status)
      v.literal("unpaid"),
      v.literal("paid"),
      v.literal("failed"),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    featuredImageUrl: v.optional(v.string()),
    meta: v.optional(metaRecordValidator),
    authorId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const postTypeSlug = args.postTypeSlug.toLowerCase();
    const normalizedSlug =
      sanitizeSlug(args.slug) || `${postTypeSlug}-${Date.now()}`;
    const uniqueSlug = await ensureUniqueSlug(
      ctx as any,
      normalizedSlug,
      organizationId,
    );

    const now = Date.now();
    const createdAt = args.createdAt ?? now;

    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      slug: uniqueSlug,
      status: args.status,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImage ?? args.featuredImageUrl,
      postTypeSlug,
      organizationId,
      authorId: args.authorId,
      createdAt,
      updatedAt: args.updatedAt,
    });

    const metaToWrite: Record<string, unknown> =
      args.meta && typeof args.meta === "object" ? { ...(args.meta as any) } : {};

    if (Object.keys(metaToWrite).length > 0) {
      await upsertMetaEntries(
        ctx,
        postId as Id<"posts">,
        metaToWrite,
      );
    }

    // Funnels always start with baseline steps (checkout + thank-you).
    if (postTypeSlug === "funnels") {
      const isDefaultFunnel =
        metaToWrite["funnel.isDefault"] === true || uniqueSlug === FUNNEL_DEFAULT_SLUG;
      await createBaselineStepsForFunnel(ctx, {
        funnelId: postId as Id<"posts">,
        funnelSlug: uniqueSlug,
        organizationId,
        isDefaultFunnel,
      });
    }

    return String(postId);
  },
});

export const updatePost = mutation({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
    // Backwards compat: legacy callers may still send `patch`.
    patch: v.optional(v.any()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("published"),
        v.literal("draft"),
        v.literal("archived"),
        // Orders: ecommerce-specific lifecycle statuses (stored in post.status)
        v.literal("unpaid"),
        v.literal("paid"),
        v.literal("failed"),
      ),
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    featuredImageUrl: v.optional(v.string()),
    meta: v.optional(metaRecordValidator),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id as any);
    if (!post) {
      throw new Error(`Post not found: ${args.id}`);
    }
    if (args.organizationId && post.organizationId !== args.organizationId) {
      throw new Error("Post not found for organization");
    }

    const basePatch = (args.patch ?? {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = { ...basePatch };

    // Generic component-posts API shape: explicit fields on args override `patch`.
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
    if (args.status !== undefined) updates.status = args.status;
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.featuredImage !== undefined)
      updates.featuredImage = args.featuredImage;
    if (args.featuredImageUrl !== undefined)
      updates.featuredImageUrl = args.featuredImageUrl;
    if (args.slug !== undefined) updates.slug = args.slug;

    if (typeof updates.featuredImage === "string") {
      updates.featuredImageUrl = updates.featuredImage;
      delete updates.featuredImage;
    }

    if (typeof updates.slug === "string") {
      const sanitized = sanitizeSlug(updates.slug);
      const normalized =
        sanitized.length > 0 ? sanitized : (post.slug ?? `post-${Date.now()}`);
      if (normalized !== post.slug) {
        updates.slug = await ensureUniqueSlug(
          ctx as any,
          normalized,
          post.organizationId ?? undefined,
          String(post._id),
        );
      }
    }

    if (updates.postTypeSlug && typeof updates.postTypeSlug === "string") {
      updates.postTypeSlug = updates.postTypeSlug.toLowerCase();
    }

    if (updates.updatedAt === undefined) {
      updates.updatedAt = Date.now();
    }

    // Meta is stored in postsMeta, not on the post record.
    // Accept both args.meta and patch.meta (back-compat).
    const metaFromArgs = args.meta as Record<string, unknown> | undefined;
    const metaFromPatch =
      basePatch.meta && typeof basePatch.meta === "object"
        ? (basePatch.meta as Record<string, unknown>)
        : undefined;
    const meta = metaFromArgs ?? metaFromPatch;
    delete updates.meta;

    await ctx.db.patch(post._id, updates as any);

    if (meta && Object.keys(meta).length > 0) {
      const metaToWrite: Record<string, unknown> = { ...meta };

      // Strict consistency: funnel step routing meta is system-owned.
      if (String(post.postTypeSlug ?? "") === "funnel_steps") {
        const existingFunnelIdRow = await ctx.db
          .query("postsMeta")
          .withIndex("by_post_and_key", (q: any) =>
            q.eq("postId", post._id).eq("key", STEP_FUNNEL_ID_KEY),
          )
          .unique();
        const existingFunnelId =
          typeof existingFunnelIdRow?.value === "string"
            ? existingFunnelIdRow.value
            : "";

        const requestedFunnelIdRaw = metaToWrite[STEP_FUNNEL_ID_KEY];
        const requestedFunnelId =
          typeof requestedFunnelIdRaw === "string" ? requestedFunnelIdRaw : "";

        if (
          requestedFunnelId &&
          existingFunnelId &&
          requestedFunnelId !== existingFunnelId
        ) {
          throw new Error("Cannot change funnel step funnelId (system-owned).");
        }

        // Never allow clients to directly set the denormalized routing fields.
        delete metaToWrite[STEP_FUNNEL_SLUG_KEY];
        delete metaToWrite[STEP_IS_DEFAULT_FUNNEL_KEY];
      }

      // Back-compat: mirror assigned user id into the legacy key.
      // This lets older queries (and existing data) continue to work.
      if (
        String(post.postTypeSlug ?? "") === "orders" &&
        Object.prototype.hasOwnProperty.call(metaToWrite, ORDER_USER_ID_KEY) &&
        !Object.prototype.hasOwnProperty.call(metaToWrite, ORDER_LEGACY_USER_ID_KEY)
      ) {
        metaToWrite[ORDER_LEGACY_USER_ID_KEY] = metaToWrite[ORDER_USER_ID_KEY];
      }

      await assertOrderItemsWritable(ctx, post, metaToWrite);
      await upsertMetaEntries(ctx, post._id as Id<"posts">, metaToWrite);
    }

    // Strict consistency: ensure funnel step routing meta is correct after any write.
    if (String(post.postTypeSlug ?? "") === "funnel_steps") {
      const funnelIdRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", post._id).eq("key", STEP_FUNNEL_ID_KEY),
        )
        .unique();
      const funnelId =
        typeof funnelIdRow?.value === "string" ? funnelIdRow.value : "";
      if (!funnelId) {
        throw new Error(
          "Funnel step is missing funnelId. Run the ecommerce routing meta backfill.",
        );
      }

      const funnel = await ctx.db.get(funnelId as any);
      if (!funnel || funnel.postTypeSlug !== "funnels") {
        throw new Error("Funnel step references an invalid funnel.");
      }

      const defaultRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", funnel._id).eq("key", "funnel.isDefault"),
        )
        .unique();
      const isDefaultFunnel =
        Boolean(defaultRow?.value) || funnel.slug === FUNNEL_DEFAULT_SLUG;
      const funnelSlug = typeof funnel.slug === "string" ? funnel.slug : "";

      await upsertMetaEntries(ctx, post._id as Id<"posts">, {
        [STEP_FUNNEL_ID_KEY]: String(funnel._id),
        [STEP_FUNNEL_SLUG_KEY]: funnelSlug,
        [STEP_IS_DEFAULT_FUNNEL_KEY]: isDefaultFunnel,
      });
    }

    // Funnels own their steps' routing meta; keep it in sync when funnel changes.
    if (String(post.postTypeSlug ?? "") === "funnels") {
      const nextSlug =
        typeof updates.slug === "string" && updates.slug.trim().length > 0
          ? updates.slug
          : (post.slug ?? "");

      const defaultRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", post._id).eq("key", "funnel.isDefault"),
        )
        .unique();
      const isDefaultFunnel = Boolean(defaultRow?.value) || nextSlug === FUNNEL_DEFAULT_SLUG;

      const organizationId = post.organizationId ?? undefined;
      const candidateSteps = organizationId
        ? await ctx.db
            .query("posts")
            .withIndex("by_org_postTypeSlug", (q: any) =>
              q.eq("organizationId", organizationId).eq("postTypeSlug", "funnel_steps"),
            )
            .collect()
        : await ctx.db
            .query("posts")
            .withIndex("by_postTypeSlug", (q: any) => q.eq("postTypeSlug", "funnel_steps"))
            .filter((q: any) => q.eq(q.field("organizationId"), undefined))
            .collect();

      for (const step of candidateSteps) {
        if (!step || step.postTypeSlug !== "funnel_steps") continue;
        const funnelIdRow = await ctx.db
          .query("postsMeta")
          .withIndex("by_post_and_key", (q: any) =>
            q.eq("postId", step._id).eq("key", STEP_FUNNEL_ID_KEY),
          )
          .unique();
        if (String(funnelIdRow?.value ?? "") !== String(post._id)) continue;

        await upsertMetaEntries(ctx, step._id as Id<"posts">, {
          [STEP_FUNNEL_ID_KEY]: String(post._id),
          [STEP_FUNNEL_SLUG_KEY]: nextSlug,
          [STEP_IS_DEFAULT_FUNNEL_KEY]: isDefaultFunnel,
        });
      }
    }
    return { success: true };
  },
});

export const deletePost = mutation({
  args: {
    id: v.string(),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id as any);
    if (!post) return { success: true };

    // System-owned invariants: the default funnel and its baseline steps must never be deleted.
    if (post.postTypeSlug === "funnels" && post.slug === FUNNEL_DEFAULT_SLUG) {
      throw new Error("The default funnel cannot be deleted.");
    }
    if (post.postTypeSlug === "funnel_steps") {
      const defaultFlagRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", post._id).eq("key", STEP_IS_DEFAULT_FUNNEL_KEY),
        )
        .unique();
      const funnelSlugRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", post._id).eq("key", STEP_FUNNEL_SLUG_KEY),
        )
        .unique();

      const isDefault =
        defaultFlagRow?.value === true || funnelSlugRow?.value === FUNNEL_DEFAULT_SLUG;
      if (isDefault) {
        throw new Error("Default funnel steps cannot be deleted.");
      }
    }

    await ctx.db.delete(post._id);
    const metaEntries = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q: any) => q.eq("postId", post._id))
      .collect();
    await Promise.all(
      metaEntries.map((entry: any) => ctx.db.delete(entry._id)),
    );
    return { success: true };
  },
});

export const setPostMeta = mutation({
  args: {
    postId: v.string(),
    key: v.string(),
    value: v.optional(metaValueValidator),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.postId as any);
    if (!post) {
      throw new Error(`Post not found: ${args.postId}`);
    }
    const value = args.value ?? null;
    await assertOrderItemsWritable(ctx, post, { [args.key]: value });

    const existing = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", post._id).eq("key", args.key),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("postsMeta", {
        postId: post._id,
        key: args.key,
        value,
        createdAt: now,
      });
    }

    // Back-compat: mirror assigned user id into the legacy key.
    if (
      String(post.postTypeSlug ?? "") === "orders" &&
      args.key === ORDER_USER_ID_KEY
    ) {
      const legacyExisting = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", post._id).eq("key", ORDER_LEGACY_USER_ID_KEY),
        )
        .unique();
      if (legacyExisting) {
        await ctx.db.patch(legacyExisting._id, { value, updatedAt: now });
      } else {
        await ctx.db.insert("postsMeta", {
          postId: post._id,
          key: ORDER_LEGACY_USER_ID_KEY,
          value,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});