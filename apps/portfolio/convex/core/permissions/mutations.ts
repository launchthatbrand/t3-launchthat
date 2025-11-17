import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { requirePermission } from "../lib/permissions";

export const deletePermission = mutation({
  args: {
    permissionId: v.id("permissions"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePermission(ctx, "admin:manage_permissions");

    const existing = await ctx.db.get(args.permissionId);
    if (!existing) {
      return { success: false };
    }

    await ctx.db.delete(args.permissionId);
    return { success: true };
  },
});
