import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../../core/organizations/helpers";
import { getAuthenticatedUserId } from "../../lib/permissions/userAuth";

/**
 * Throws if the caller is not an org owner/admin (or global portal admin).
 * Intended to be called from actions (node runtime) via ctx.runQuery.
 */
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

/**
 * Throws if the caller is not a member of the org (or global portal admin).
 * Used for user-scoped operations like linking a Discord account.
 */
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

