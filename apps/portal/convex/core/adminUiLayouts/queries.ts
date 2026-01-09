import { v } from "convex/values";

import { query } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../organizations/helpers";

const scopeValidator = v.union(v.literal("dashboard"), v.literal("singlePost"));

const areasValidator = v.object({
  main: v.array(
    v.object({
      id: v.string(),
      width: v.union(v.literal("half"), v.literal("full")),
    }),
  ),
  sidebar: v.array(
    v.object({
      id: v.string(),
    }),
  ),
});

export const getMyAdminUiLayout = query({
  args: {
    organizationId: v.id("organizations"),
    scope: scopeValidator,
    postTypeSlug: v.union(v.string(), v.null()),
  },
  returns: v.union(
    v.null(),
    v.object({
      areas: areasValidator,
      version: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return null;
    }

    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      user._id,
      ["owner", "admin"],
    );

    const layout = await ctx.db
      .query("adminUiLayouts")
      .withIndex("by_org_and_user_and_scope_and_post_type", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", user._id)
          .eq("scope", args.scope)
          .eq("postTypeSlug", args.postTypeSlug),
      )
      .unique();

    if (!layout) {
      return null;
    }

    return {
      areas: layout.areas,
      version: layout.version,
      updatedAt: layout.updatedAt,
    };
  },
});


