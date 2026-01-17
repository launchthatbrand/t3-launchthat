import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../../core/organizations/helpers";
import { getAuthenticatedUserId } from "../../lib/permissions/userAuth";

export const requireOrgMember = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId as Id<"organizations">,
      userId,
    );
    return null;
  },
});

export const requireOrgAdmin = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId as Id<"organizations">,
      userId,
      ["owner", "admin"],
    );
    return null;
  },
});
