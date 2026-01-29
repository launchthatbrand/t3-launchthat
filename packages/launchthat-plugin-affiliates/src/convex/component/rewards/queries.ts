import { v } from "convex/values";
import { query } from "../_generated/server";

export const listActiveBenefitsForUser = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      kind: v.string(),
      value: v.any(),
      startsAt: v.number(),
      endsAt: v.optional(v.number()),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return [];
    const rows = await ctx.db
      .query("affiliateBenefits")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId_and_status", (q: any) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .order("desc")
      .take(100);
    return rows.map((row: any) => ({
      kind: String(row.kind),
      value: row.value,
      startsAt: Number(row.startsAt),
      endsAt: typeof row.endsAt === "number" ? Number(row.endsAt) : undefined,
      status: String(row.status),
    }));
  },
});

