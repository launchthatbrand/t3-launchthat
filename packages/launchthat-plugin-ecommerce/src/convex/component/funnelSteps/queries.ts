import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

const parsePredefinedProducts = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
  } catch {
    return [];
  }
};

const readMetaMap = async (
  ctx: any,
  postId: Id<"posts">,
): Promise<Record<string, unknown>> => {
  const rows = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q: any) => q.eq("postId", postId))
    .collect();
  const map: Record<string, unknown> = {};
  rows.forEach((row: any) => {
    map[String(row.key)] = row.value;
  });
  return map;
};

const findFunnelBySlug = async (ctx: any, organizationId: string | undefined, slug: string) => {
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
  return post;
};

const listStepsForOrg = async (ctx: any, organizationId: string | undefined) => {
  return organizationId
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
};

export const getFunnelStepsForFunnel = query({
  args: {
    funnelId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      slug: v.string(),
      title: v.optional(v.string()),
      kind: v.string(),
      order: v.number(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const funnelId = String(args.funnelId);
    const steps = await listStepsForOrg(ctx, organizationId);
    const result: Array<{ id: string; slug: string; title?: string; kind: string; order: number }> =
      [];

    for (const step of steps) {
      if (!step || step.postTypeSlug !== "funnel_steps") continue;
      const meta = await readMetaMap(ctx, step._id as Id<"posts">);
      if (String(meta["step.funnelId"] ?? "") !== funnelId) continue;
      const kind = typeof meta["step.kind"] === "string" ? String(meta["step.kind"]) : "checkout";
      const order =
        typeof meta["step.order"] === "number"
          ? meta["step.order"]
          : typeof meta["step.order"] === "string"
            ? Number(meta["step.order"])
            : 0;
      result.push({
        id: String(step._id),
        slug: String(step.slug ?? ""),
        title: typeof step.title === "string" ? step.title : undefined,
        kind,
        order: Number.isFinite(order) ? order : 0,
      });
    }

    return result.sort((a, b) => a.order - b.order);
  },
});

export const getFunnelStepBySlug = query({
  args: {
    funnelSlug: v.string(),
    stepSlug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      funnelId: v.string(),
      funnelSlug: v.string(),
      isDefaultFunnel: v.boolean(),
      stepId: v.string(),
      stepSlug: v.string(),
      stepTitle: v.optional(v.string()),
      kind: v.string(),
      order: v.number(),
      checkout: v.optional(
        v.object({
          design: v.string(),
          predefinedProductPostIds: v.array(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const funnelSlug = String(args.funnelSlug);
    const stepSlug = String(args.stepSlug);

    const funnel = await findFunnelBySlug(ctx, organizationId, funnelSlug);
    if (!funnel) return null;
    const funnelMeta = await readMetaMap(ctx, funnel._id as Id<"posts">);
    const isDefaultFunnel = Boolean(funnelMeta["funnel.isDefault"]);

    const steps = await listStepsForOrg(ctx, organizationId);
    for (const step of steps) {
      if (!step || step.postTypeSlug !== "funnel_steps") continue;
      if (String(step.slug ?? "") !== stepSlug) continue;
      const meta = await readMetaMap(ctx, step._id as Id<"posts">);
      if (String(meta["step.funnelId"] ?? "") !== String(funnel._id)) continue;

      const kind = typeof meta["step.kind"] === "string" ? String(meta["step.kind"]) : "checkout";
      const order =
        typeof meta["step.order"] === "number"
          ? meta["step.order"]
          : typeof meta["step.order"] === "string"
            ? Number(meta["step.order"])
            : 0;

      const base = {
        funnelId: String(funnel._id),
        funnelSlug,
        isDefaultFunnel,
        stepId: String(step._id),
        stepSlug,
        stepTitle: typeof step.title === "string" ? step.title : undefined,
        kind,
        order: Number.isFinite(order) ? order : 0,
      };

      if (kind === "checkout") {
        const designRaw = meta["step.checkout.design"];
        const design =
          typeof designRaw === "string" && designRaw.trim() ? designRaw : "default";
        const predefinedJson = meta["step.checkout.predefinedProductsJson"];
        const predefinedProductPostIds = parsePredefinedProducts(predefinedJson);
        return {
          ...base,
          checkout: {
            design,
            predefinedProductPostIds,
          },
        };
      }

      return base;
    }

    return null;
  },
});

export const getFunnelStepById = query({
  args: {
    stepId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      funnelId: v.string(),
      funnelSlug: v.string(),
      isDefaultFunnel: v.boolean(),
      stepId: v.string(),
      stepSlug: v.string(),
      stepTitle: v.optional(v.string()),
      kind: v.string(),
      order: v.number(),
      checkout: v.optional(
        v.object({
          design: v.string(),
          predefinedProductPostIds: v.array(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const step = await ctx.db.get(args.stepId as any);
    if (!step) return null;
    if (organizationId && step.organizationId !== organizationId) return null;
    if (step.postTypeSlug !== "funnel_steps") return null;

    const stepMeta = await readMetaMap(ctx, step._id as Id<"posts">);
    const funnelId = String(stepMeta["step.funnelId"] ?? "");
    if (!funnelId) return null;

    const funnel = await ctx.db.get(funnelId as any);
    if (!funnel) return null;
    if (organizationId && funnel.organizationId !== organizationId) return null;
    if (funnel.postTypeSlug !== "funnels") return null;

    const funnelMeta = await readMetaMap(ctx, funnel._id as Id<"posts">);
    const isDefaultFunnel = Boolean(funnelMeta["funnel.isDefault"]);
    const funnelSlug = String(funnel.slug ?? "");

    const kind =
      typeof stepMeta["step.kind"] === "string"
        ? String(stepMeta["step.kind"])
        : "checkout";
    const order =
      typeof stepMeta["step.order"] === "number"
        ? stepMeta["step.order"]
        : typeof stepMeta["step.order"] === "string"
          ? Number(stepMeta["step.order"])
          : 0;

    const base = {
      funnelId: String(funnel._id),
      funnelSlug,
      isDefaultFunnel,
      stepId: String(step._id),
      stepSlug: String(step.slug ?? ""),
      stepTitle: typeof step.title === "string" ? step.title : undefined,
      kind,
      order: Number.isFinite(order) ? order : 0,
    };

    if (kind === "checkout") {
      const designRaw = stepMeta["step.checkout.design"];
      const design =
        typeof designRaw === "string" && designRaw.trim() ? designRaw : "default";
      const predefinedJson = stepMeta["step.checkout.predefinedProductsJson"];
      const predefinedProductPostIds = parsePredefinedProducts(predefinedJson);
      return {
        ...base,
        checkout: {
          design,
          predefinedProductPostIds,
        },
      };
    }

    return base;
  },
});


