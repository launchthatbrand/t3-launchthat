import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../../core/organizations/helpers";
import { getAuthenticatedUserId } from "../../lib/permissions/userAuth";

const discordUserLinksMutations = components.launchthat_discord.userLinks
  .mutations as any;

export const unlinkMyDiscordLink = mutation({
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

    await ctx.runMutation(discordUserLinksMutations.unlinkUser, {
      organizationId: args.organizationId,
      userId: String(userId),
    });

    return null;
  },
});


