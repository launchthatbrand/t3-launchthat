import { v } from "convex/values";

import { query } from "../../_generated/server";
import { getOptionalAuthenticatedUserId } from "../lib/auth";
import { verifyOrganizationAccessWithClerkContext } from "../organizations/helpers";

const scopeValidator = v.union(v.literal("dashboard"), v.literal("singlePost"));

const hiddenValidator = v.object({
  main: v.array(v.string()),
  sidebar: v.array(v.string()),
});

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
  hidden: v.optional(hiddenValidator),
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
    const userId = await getOptionalAuthenticatedUserId(ctx);
    if (!userId) {
      return null;
    }

    // This is a per-user UI preference; allow any org member with access
    // (and global admins via the helper's bypass).
    await verifyOrganizationAccessWithClerkContext(ctx, args.organizationId, userId);

    const layout = await ctx.db
      .query("adminUiLayouts")
      .withIndex("by_org_and_user_and_scope_and_post_type", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", userId)
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


