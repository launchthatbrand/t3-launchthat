import { query } from "@convex-config/_generated/server";
import { v } from "convex/values";

// Get audit log statistics
export const getAuditLogStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalEntries: v.number(),
    entriesByCategory: v.object({
      authentication: v.number(),
      authorization: v.number(),
      data_access: v.number(),
      data_modification: v.number(),
      system: v.number(),
      ecommerce: v.number(),
      navigation: v.number(),
      security: v.number(),
    }),
    entriesBySeverity: v.object({
      info: v.number(),
      warning: v.number(),
      error: v.number(),
      critical: v.number(),
    }),
    successRate: v.number(),
    uniqueUsers: v.number(),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLogs");

    if (args.startDate || args.endDate) {
      query = query.withIndex("by_timestamp");
      if (args.startDate) {
        query = query.filter((q) =>
          q.gte(q.field("timestamp"), args.startDate),
        );
      }
      if (args.endDate) {
        query = query.filter((q) => q.lte(q.field("timestamp"), args.endDate));
      }
    }

    const entries = await query.collect();
    const totalEntries = entries.length;

    const entriesByCategory = {
      authentication: entries.filter((e) => e.category === "authentication")
        .length,
      authorization: entries.filter((e) => e.category === "authorization")
        .length,
      data_access: entries.filter((e) => e.category === "data_access").length,
      data_modification: entries.filter(
        (e) => e.category === "data_modification",
      ).length,
      system: entries.filter((e) => e.category === "system").length,
      ecommerce: entries.filter((e) => e.category === "ecommerce").length,
      navigation: entries.filter((e) => e.category === "navigation").length,
      security: entries.filter((e) => e.category === "security").length,
    };

    const entriesBySeverity = {
      info: entries.filter((e) => e.severity === "info").length,
      warning: entries.filter((e) => e.severity === "warning").length,
      error: entries.filter((e) => e.severity === "error").length,
      critical: entries.filter((e) => e.severity === "critical").length,
    };

    const successfulEntries = entries.filter((e) => e.success).length;
    const successRate =
      totalEntries > 0 ? (successfulEntries / totalEntries) * 100 : 0;

    const uniqueUserIds = new Set(entries.map((e) => e.userId).filter(Boolean));
    const uniqueUsers = uniqueUserIds.size;

    return {
      totalEntries,
      entriesByCategory,
      entriesBySeverity,
      successRate,
      uniqueUsers,
    };
  },
});
