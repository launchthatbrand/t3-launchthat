/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-type-assertion,
  @typescript-eslint/no-explicit-any
*/
import { v } from "convex/values";

import { components } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";

const roleRulesQueries = (components as any).launchthat_discord.roleRules
  .queries;
const roleRulesMutations = (components as any).launchthat_discord.roleRules
  .mutations;

export const listRoleRulesForProduct = query({
  args: { organizationId: v.string(), productId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      roleRulesQueries.listRoleRulesForProduct as any,
      args as any,
    );
  },
});

export const replaceProductRoleRules = mutation({
  args: {
    organizationId: v.string(),
    productId: v.string(),
    rules: v.array(
      v.object({
        guildId: v.string(),
        roleId: v.string(),
        roleName: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      roleRulesMutations.replaceProductRoleRules as any,
      args as any,
    );
    return null;
  },
});

export const replaceMarketingTagRoleRules = mutation({
  args: {
    organizationId: v.string(),
    marketingTagId: v.string(),
    rules: v.array(
      v.object({
        guildId: v.string(),
        roleId: v.string(),
        roleName: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      roleRulesMutations.replaceMarketingTagRoleRules as any,
      args as any,
    );
    return null;
  },
});

export const listRoleRulesForMarketingTags = query({
  args: { organizationId: v.string(), marketingTagIds: v.array(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      roleRulesQueries.listRoleRulesForMarketingTags as any,
      args as any,
    );
  },
});
