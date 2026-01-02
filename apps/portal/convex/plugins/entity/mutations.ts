import { v } from "convex/values";

import type { EntitySaveInput } from "./types";
import { mutation } from "../../_generated/server";
import { entityResolvers } from "./resolvers";

const baseEntityInput = v.any();
const updateEntityInput = v.any();

export const saveEntity = mutation({
  args: {
    postTypeSlug: v.string(),
    organizationId: v.optional(v.string()),
    data: baseEntityInput,
  },
  handler: async (ctx, args) => {
    const data = args.data as Record<string, unknown>;
    const organizationId =
      args.organizationId ??
      (typeof data.organizationId === "string" ? data.organizationId : undefined);
    const {
      organizationId: _omitOrganizationId,
      postTypeSlug: _omitPostTypeSlug,
      ...sanitizedData
    } = data;
    const resolver = await entityResolvers.get(ctx, args.postTypeSlug, organizationId);
    return await resolver.create(ctx, {
      postTypeSlug: args.postTypeSlug,
      data: sanitizedData as EntitySaveInput,
      organizationId,
    });
  },
});

export const updateEntity = mutation({
  args: {
    postTypeSlug: v.string(),
    id: v.string(),
    organizationId: v.optional(v.string()),
    data: updateEntityInput,
  },
  handler: async (ctx, args) => {
    const data = args.data as Record<string, unknown>;
    const organizationId =
      args.organizationId ??
      (typeof data.organizationId === "string" ? data.organizationId : undefined);
    const {
      organizationId: _omitOrganizationId,
      postTypeSlug: _omitPostTypeSlug,
      ...sanitizedData
    } = data;
    const resolver = await entityResolvers.get(ctx, args.postTypeSlug, organizationId);
    return await resolver.update(ctx, {
      postTypeSlug: args.postTypeSlug,
      id: args.id,
      data: sanitizedData as Partial<EntitySaveInput>,
      organizationId,
    });
  },
});

export const deleteEntity = mutation({
  args: {
    postTypeSlug: v.string(),
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resolver = await entityResolvers.get(
      ctx,
      args.postTypeSlug,
      args.organizationId ?? undefined,
    );
    await resolver.remove(ctx, {
      postTypeSlug: args.postTypeSlug,
      id: args.id,
    });
    return null;
  },
});
