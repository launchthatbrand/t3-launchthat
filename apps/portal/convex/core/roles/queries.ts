import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Return role names assigned to a user (global scope + optionally scoped roles).
 * Portal uses this for frontend access-control decisions.
 */
export const getRoleNamesForUser = query({
  args: {
    userId: v.id("users"),
    scopeType: v.optional(
      v.union(
        v.literal("global"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
    ),
    scopeId: v.optional(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const scopeType = args.scopeType ?? "global";
    const scopeId = args.scopeId ?? null;

    const assignments = await ctx.db
      .query("userRoleAssignments")
      .withIndex("by_user_scope", (q) =>
        q.eq("userId", args.userId).eq("scopeType", scopeType as any).eq("scopeId", scopeId),
      )
      .collect();

    const roleNames: string[] = [];
    for (const assignment of assignments) {
      const role = await ctx.db.get(assignment.roleId);
      if (role?.name) roleNames.push(role.name);
    }

    // Always include global roles when checking a non-global scope.
    if (scopeType !== "global") {
      const globals = await ctx.db
        .query("userRoleAssignments")
        .withIndex("by_user_scope", (q) =>
          q.eq("userId", args.userId).eq("scopeType", "global" as any).eq("scopeId", null),
        )
        .collect();
      for (const assignment of globals) {
        const role = await ctx.db.get(assignment.roleId);
        if (role?.name) roleNames.push(role.name);
      }
    }

    // De-dupe while preserving order.
    return Array.from(new Set(roleNames));
  },
});


