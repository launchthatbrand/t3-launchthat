import { v } from "convex/values";

import type { EntityFiltersInput } from "./types";
import { query } from "../../_generated/server";
import { entityResolvers } from "./resolvers";

const filtersValidator = v.object({
  status: v.optional(
    v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
  ),
  category: v.optional(v.string()),
  authorId: v.optional(v.string()),
  limit: v.optional(v.number()),
  slug: v.optional(v.string()),
});

export const readEntity = query({
  args: {
    postTypeSlug: v.string(),
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resolver = await entityResolvers.get(ctx, args.postTypeSlug, args.organizationId);
    return await resolver.read(ctx, args);
  },
});

export const listEntities = query({
  args: {
    postTypeSlug: v.string(),
    organizationId: v.optional(v.string()),
    filters: v.optional(filtersValidator),
  },
  handler: async (ctx, args) => {
    const resolver = await entityResolvers.get(ctx, args.postTypeSlug, args.organizationId);
    return await resolver.list(ctx, {
      postTypeSlug: args.postTypeSlug,
      organizationId: args.organizationId,
      filters: args.filters as EntityFiltersInput | undefined,
    });
  },
});
