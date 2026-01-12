import { v } from "convex/values";

import { components } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

const requireOrgAdmin = async (
  ctx: { db: any },
  args: { orgId: Id<"organizations">; actorUserId: Id<"users"> },
) => {
  const actor = await ctx.db.get(args.actorUserId);
  const actorRole = (actor?.role ?? "").toString().trim().toLowerCase();
  if (actorRole === "admin" || actorRole === "administrator") return;

  const membership = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_organization", (q: any) =>
      q.eq("userId", args.actorUserId).eq("organizationId", args.orgId),
    )
    .first();
  const role = membership?.role;
  if (!membership?.isActive || (role !== "owner" && role !== "admin")) {
    throw new Error("Forbidden: organization admin privileges required");
  }
};

export const listLogsForOrg = query({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    limit: v.optional(v.number()),
    filter: v.optional(
      v.object({
        pluginKey: v.optional(v.string()),
        kind: v.optional(v.string()),
        email: v.optional(v.string()),
        level: v.optional(
          v.union(
            v.literal("debug"),
            v.literal("info"),
            v.literal("warn"),
            v.literal("error"),
          ),
        ),
        status: v.optional(
          v.union(
            v.literal("scheduled"),
            v.literal("running"),
            v.literal("complete"),
            v.literal("failed"),
          ),
        ),
      }),
    ),
  },
  // Keep this loose to avoid “type instantiation is excessively deep” in portal TS.
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, { orgId: args.orgId, actorUserId: args.actorUserId });

    const limit = Math.max(1, Math.min(1000, args.limit ?? 200));

    const result: unknown = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      components.launchthat_logs.entries.queries.listLogsForOrg as any,
      {
        organizationId: String(args.orgId),
        filter: args.filter,
        limit,
      },
    );

    return Array.isArray(result) ? result : [];
  },
});

export const listEmailSuggestionsForOrg = query({
  args: {
    orgId: v.id("organizations"),
    actorUserId: v.id("users"),
    prefix: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, { orgId: args.orgId, actorUserId: args.actorUserId });

    const result: unknown = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      components.launchthat_logs.entries.queries.listRecentEmailsForOrg as any,
      {
        organizationId: String(args.orgId),
        prefix: args.prefix,
        limit: args.limit,
      },
    );

    return Array.isArray(result)
      ? result.filter((x) => typeof x === "string")
      : [];
  },
});


