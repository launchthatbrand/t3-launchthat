import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { sanitizeSlug } from "../posts/helpers";

import {
  FUNNEL_DEFAULT_SLUG,
  STEP_FUNNEL_ID_KEY,
  STEP_FUNNEL_SLUG_KEY,
  STEP_IS_DEFAULT_FUNNEL_KEY,
} from "../../../shared/funnels/routingMeta";

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

const ensureMetaEntry = async (
  ctx: any,
  postId: Id<"posts">,
  key: string,
  value: string | number | boolean | null,
) => {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q: any) => q.eq("postId", postId).eq("key", key))
    .unique();

  if (existing) {
    return;
  }

  const now = Date.now();
  await ctx.db.insert("postsMeta", {
    postId,
    key,
    value,
    createdAt: now,
    updatedAt: now,
  });
};

const getFunnelIdBySlug = async (
  ctx: any,
  organizationId: string | undefined,
  slug: string,
): Promise<Id<"posts"> | null> => {
  const post = organizationId
    ? await ctx.db
        .query("posts")
        .withIndex("by_org_slug", (q: any) =>
          q.eq("organizationId", organizationId).eq("slug", slug),
        )
        .unique()
    : await ctx.db
        .query("posts")
        .withIndex("by_slug", (q: any) => q.eq("slug", slug))
        .filter((q: any) => q.eq(q.field("organizationId"), undefined))
        .unique();
  if (!post) return null;
  if (post.postTypeSlug !== "funnels") return null;
  return post._id as Id<"posts">;
};

/**
 * Idempotently ensures the default funnel has the required baseline steps:
 * - checkout step at slug "checkout"
 * - thank you step at slug "order-confirmed"
 */
export const ensureDefaultFunnelSteps = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const funnelId = await getFunnelIdBySlug(ctx, organizationId, FUNNEL_DEFAULT_SLUG);
    if (!funnelId) {
      // Caller should ensure the default funnel exists via funnels.ensureDefaultFunnel.
      return null;
    }

    const now = Date.now();
    const existingSteps = organizationId
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

    const isStepForFunnel = async (step: any): Promise<boolean> => {
      const row = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", step._id).eq("key", "step.funnelId"),
        )
        .unique();
      return String(row?.value ?? "") === String(funnelId);
    };

    const matching: Record<string, any> = {};
    for (const step of existingSteps) {
      if (!step || step.postTypeSlug !== "funnel_steps") continue;
      if (!(await isStepForFunnel(step))) continue;
      if (typeof step.slug === "string" && step.slug) {
        matching[step.slug] = step;
      }
    }

    const ensureStep = async (
      slug: string,
      title: string,
      kind: string,
      order: number,
    ) => {
      if (matching[slug]) {
        // Only fill missing meta keys; never overwrite user edits.
        await ensureMetaEntry(ctx, matching[slug]._id, STEP_FUNNEL_ID_KEY, String(funnelId));
        // System-owned routing meta should always be correct.
        await upsertMetaEntry(ctx, matching[slug]._id, STEP_FUNNEL_SLUG_KEY, FUNNEL_DEFAULT_SLUG);
        await upsertMetaEntry(ctx, matching[slug]._id, STEP_IS_DEFAULT_FUNNEL_KEY, true);
        await ensureMetaEntry(ctx, matching[slug]._id, "step.kind", kind);
        await ensureMetaEntry(ctx, matching[slug]._id, "step.order", order);
        if (kind === "checkout") {
          await ensureMetaEntry(ctx, matching[slug]._id, "step.checkout.design", "default");
          await ensureMetaEntry(
            ctx,
            matching[slug]._id,
            "step.checkout.predefinedProductsJson",
            "[]",
          );
        }
        return;
      }

      const stepId = await ctx.db.insert("posts", {
        title,
        content: undefined,
        excerpt: undefined,
        slug,
        status: "published",
        category: undefined,
        tags: undefined,
        featuredImageUrl: undefined,
        postTypeSlug: "funnel_steps",
        organizationId,
        authorId: undefined,
        createdAt: now,
        updatedAt: now,
      });

      await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_FUNNEL_ID_KEY, String(funnelId));
      await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_FUNNEL_SLUG_KEY, FUNNEL_DEFAULT_SLUG);
      await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_IS_DEFAULT_FUNNEL_KEY, true);
      await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.kind", kind);
      await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.order", order);
      if (kind === "checkout") {
        await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.checkout.design", "default");
        await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.checkout.predefinedProductsJson", "[]");
      }
    };

    await ensureStep("checkout", "Checkout", "checkout", 0);
    await ensureStep("order-confirmed", "Order confirmed", "thankYou", 1);

    return null;
  },
});

/**
 * Idempotently ensures a given funnel has baseline steps:
 * - checkout step at slug "checkout"
 * - thank you step at slug "thank-you" (custom funnels) or "order-confirmed" (default funnel)
 */
export const ensureBaselineStepsForFunnel = mutation({
  args: {
    funnelId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const funnel = await ctx.db.get(args.funnelId as any);
    if (!funnel) return null;
    if (organizationId && funnel.organizationId !== organizationId) return null;
    if (funnel.postTypeSlug !== "funnels") return null;

    const funnelMetaRow = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", funnel._id).eq("key", "funnel.isDefault"),
      )
      .unique();
    const isDefaultFunnel = Boolean(funnelMetaRow?.value) || funnel.slug === FUNNEL_DEFAULT_SLUG;
    const funnelSlug = typeof funnel.slug === "string" ? funnel.slug : "";

    const now = Date.now();
    const existingSteps = organizationId
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

    const isStepForFunnel = async (step: any): Promise<boolean> => {
      const row = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", step._id).eq("key", "step.funnelId"),
        )
        .unique();
      return String(row?.value ?? "") === String(funnel._id);
    };

    const matching: Record<string, any> = {};
    for (const step of existingSteps) {
      if (!step || step.postTypeSlug !== "funnel_steps") continue;
      if (!(await isStepForFunnel(step))) continue;
      if (typeof step.slug === "string" && step.slug) {
        matching[step.slug] = step;
      }
    }

    const ensureStep = async (
      slug: string,
      title: string,
      kind: string,
      order: number,
    ) => {
      if (matching[slug]) {
        // Only fill missing meta keys; never overwrite user edits.
        await ensureMetaEntry(ctx, matching[slug]._id, "step.funnelId", String(funnel._id));
        // System-owned routing meta should always be correct.
        await upsertMetaEntry(ctx, matching[slug]._id, STEP_FUNNEL_SLUG_KEY, funnelSlug);
        await upsertMetaEntry(ctx, matching[slug]._id, STEP_IS_DEFAULT_FUNNEL_KEY, isDefaultFunnel);
        await ensureMetaEntry(ctx, matching[slug]._id, "step.kind", kind);
        await ensureMetaEntry(ctx, matching[slug]._id, "step.order", order);
        if (kind === "checkout") {
          await ensureMetaEntry(ctx, matching[slug]._id, "step.checkout.design", "default");
          await ensureMetaEntry(
            ctx,
            matching[slug]._id,
            "step.checkout.predefinedProductsJson",
            "[]",
          );
        }
        return;
      }

      const stepId = await ctx.db.insert("posts", {
        title,
        content: undefined,
        excerpt: undefined,
        slug,
        status: "published",
        category: undefined,
        tags: undefined,
        featuredImageUrl: undefined,
        postTypeSlug: "funnel_steps",
        organizationId,
        authorId: undefined,
        createdAt: now,
        updatedAt: now,
      });

      await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.funnelId", String(funnel._id));
      await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_FUNNEL_SLUG_KEY, funnelSlug);
      await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_IS_DEFAULT_FUNNEL_KEY, isDefaultFunnel);
      await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.kind", kind);
      await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.order", order);
      if (kind === "checkout") {
        await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.checkout.design", "default");
        await upsertMetaEntry(
          ctx,
          stepId as Id<"posts">,
          "step.checkout.predefinedProductsJson",
          "[]",
        );
      }
    };

    await ensureStep("checkout", "Checkout", "checkout", 0);
    await ensureStep(
      isDefaultFunnel ? "order-confirmed" : "thank-you",
      isDefaultFunnel ? "Order confirmed" : "Thank you",
      "thankYou",
      1,
    );

    return null;
  },
});

const stepKindValidator = v.union(
  v.literal("checkout"),
  v.literal("upsell"),
  v.literal("thankYou"),
);

export const addFunnelStep = mutation({
  args: {
    funnelId: v.string(),
    organizationId: v.optional(v.string()),
    kind: stepKindValidator,
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const funnel = await ctx.db.get(args.funnelId as any);
    if (!funnel) throw new Error("Funnel not found");
    if (organizationId && funnel.organizationId !== organizationId) {
      throw new Error("Funnel not found for organization");
    }
    if (funnel.postTypeSlug !== "funnels") throw new Error("Invalid funnel");

    const funnelMetaRow = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", funnel._id).eq("key", "funnel.isDefault"),
      )
      .unique();
    const isDefaultFunnel =
      Boolean(funnelMetaRow?.value) || funnel.slug === FUNNEL_DEFAULT_SLUG;
    const funnelSlug = typeof funnel.slug === "string" ? funnel.slug : "";

    const existingSteps = organizationId
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

    const stepsForFunnel: Array<{
      id: Id<"posts">;
      slug: string;
      kind: string;
      order: number;
    }> = [];

    for (const step of existingSteps) {
      if (!step || step.postTypeSlug !== "funnel_steps") continue;
      const funnelRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", step._id).eq("key", "step.funnelId"),
        )
        .unique();
      if (String(funnelRow?.value ?? "") !== String(funnel._id)) continue;

      const kindRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", step._id).eq("key", "step.kind"),
        )
        .unique();
      const orderRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", step._id).eq("key", "step.order"),
        )
        .unique();

      stepsForFunnel.push({
        id: step._id as Id<"posts">,
        slug: typeof step.slug === "string" ? step.slug : "",
        kind: typeof kindRow?.value === "string" ? String(kindRow.value) : "",
        order: typeof orderRow?.value === "number" ? orderRow.value : 0,
      });
    }

    if (args.kind !== "upsell") {
      const existing = stepsForFunnel.find((s) => s.kind === args.kind);
      if (existing) {
        throw new Error(
          args.kind === "checkout"
            ? "This funnel already has a Checkout step."
            : "This funnel already has a Thank you step.",
        );
      }
    }

    const defaultSlugForKind = () => {
      if (args.kind === "checkout") return "checkout";
      if (args.kind === "thankYou") return "thank-you";
      const upsellCount = stepsForFunnel.filter((s) => s.kind === "upsell").length;
      return upsellCount > 0 ? `upsell-${upsellCount + 1}` : "upsell";
    };

    const normalizedSlug = sanitizeSlug(args.slug ?? "") || defaultSlugForKind();
    if (stepsForFunnel.some((s) => s.slug === normalizedSlug)) {
      throw new Error(`A step with slug "${normalizedSlug}" already exists in this funnel.`);
    }

    const maxOrder =
      stepsForFunnel.length > 0
        ? Math.max(...stepsForFunnel.map((s) => s.order))
        : 0;
    const thankYouOrder = stepsForFunnel.find((s) => s.kind === "thankYou")?.order;
    const computedOrder =
      typeof args.order === "number"
        ? args.order
        : args.kind === "checkout"
          ? 0
          : args.kind === "thankYou"
            ? maxOrder + 1
            : typeof thankYouOrder === "number"
              ? thankYouOrder - 0.5
              : maxOrder + 1;

    const defaultTitleForKind = () => {
      if (args.kind === "checkout") return "Checkout";
      if (args.kind === "thankYou") return "Thank you";
      const upsellCount = stepsForFunnel.filter((s) => s.kind === "upsell").length;
      return upsellCount > 0 ? `Upsell ${upsellCount + 1}` : "Upsell";
    };
    const title =
      typeof args.title === "string" && args.title.trim()
        ? args.title.trim()
        : defaultTitleForKind();

    const now = Date.now();
    const stepId = await ctx.db.insert("posts", {
      title,
      content: undefined,
      excerpt: undefined,
      slug: normalizedSlug,
      status: "published",
      category: undefined,
      tags: undefined,
      featuredImageUrl: undefined,
      postTypeSlug: "funnel_steps",
      organizationId,
      authorId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_FUNNEL_ID_KEY, String(funnel._id));
    await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_FUNNEL_SLUG_KEY, funnelSlug);
    await upsertMetaEntry(ctx, stepId as Id<"posts">, STEP_IS_DEFAULT_FUNNEL_KEY, isDefaultFunnel);
    await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.kind", args.kind);
    await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.order", computedOrder);

    if (args.kind === "checkout") {
      await upsertMetaEntry(ctx, stepId as Id<"posts">, "step.checkout.design", "default");
      await upsertMetaEntry(
        ctx,
        stepId as Id<"posts">,
        "step.checkout.predefinedProductsJson",
        "[]",
      );
    }

    return String(stepId);
  },
});

/**
 * Ensure a given funnel step has system-owned routing meta required for permalink previews:
 * - step.funnelSlug
 * - step.isDefaultFunnel
 *
 * This is safe to call repeatedly; it only (re)writes these two keys.
 */
export const ensureFunnelStepRoutingMeta = mutation({
  args: {
    stepId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const step = await ctx.db.get(args.stepId as any);
    if (!step) return null;
    if (organizationId && step.organizationId !== organizationId) return null;
    if (step.postTypeSlug !== "funnel_steps") return null;

    const funnelIdRow = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", step._id).eq("key", STEP_FUNNEL_ID_KEY),
      )
      .unique();
    const funnelId = typeof funnelIdRow?.value === "string" ? funnelIdRow.value : "";
    if (!funnelId) return null;

    const funnel = await ctx.db.get(funnelId as any);
    if (!funnel) return null;
    if (organizationId && funnel.organizationId !== organizationId) return null;
    if (funnel.postTypeSlug !== "funnels") return null;

    const funnelDefaultRow = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", funnel._id).eq("key", "funnel.isDefault"),
      )
      .unique();
    const isDefaultFunnel =
      Boolean(funnelDefaultRow?.value) || funnel.slug === FUNNEL_DEFAULT_SLUG;
    const funnelSlug = typeof funnel.slug === "string" ? funnel.slug : "";

    await upsertMetaEntry(ctx, step._id as Id<"posts">, STEP_FUNNEL_SLUG_KEY, funnelSlug);
    await upsertMetaEntry(
      ctx,
      step._id as Id<"posts">,
      STEP_IS_DEFAULT_FUNNEL_KEY,
      isDefaultFunnel,
    );

    return null;
  },
});

/**
 * One-time backfill for existing funnel steps missing system-owned routing meta.
 * This is intentionally explicit (admin-triggered) rather than a UI auto-repair.
 */
export const backfillFunnelStepRoutingMeta = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.object({
    scanned: v.number(),
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;

    const steps = organizationId
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

    let scanned = 0;
    let updated = 0;
    let skipped = 0;

    for (const step of steps) {
      scanned += 1;
      if (!step || step.postTypeSlug !== "funnel_steps") {
        skipped += 1;
        continue;
      }

      const funnelIdRow = await ctx.db
        .query("postsMeta")
        .withIndex("by_post_and_key", (q: any) =>
          q.eq("postId", step._id).eq("key", STEP_FUNNEL_ID_KEY),
        )
        .unique();
      const funnelId = typeof funnelIdRow?.value === "string" ? funnelIdRow.value : "";
      if (!funnelId) {
        skipped += 1;
        continue;
      }

      const funnel = await ctx.db.get(funnelId as any);
      if (!funnel || funnel.postTypeSlug !== "funnels") {
        skipped += 1;
        continue;
      }
      if (organizationId && funnel.organizationId !== organizationId) {
        skipped += 1;
        continue;
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

      // Only update if missing or clearly wrong; keep this idempotent.
      await upsertMetaEntry(ctx, step._id as Id<"posts">, STEP_FUNNEL_SLUG_KEY, funnelSlug);
      await upsertMetaEntry(
        ctx,
        step._id as Id<"posts">,
        STEP_IS_DEFAULT_FUNNEL_KEY,
        isDefaultFunnel,
      );
      updated += 1;
    }

    return { scanned, updated, skipped };
  },
});


