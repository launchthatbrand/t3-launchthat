import { v } from "convex/values";
import { query } from "../_generated/server";

const normalizeCurrency = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return s || "USD";
};

export const getCreditBalance = query({
  args: { userId: v.string(), currency: v.optional(v.string()) },
  returns: v.object({
    userId: v.string(),
    currency: v.string(),
    balanceCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const currency = normalizeCurrency(args.currency);

    const rows = await ctx.db
      .query("affiliateCreditEvents")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId_and_createdAt", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(5000);

    let balance = 0;
    for (const row of rows) {
      const rowCurrency =
        typeof (row as any).currency === "string"
          ? String((row as any).currency).toUpperCase()
          : "USD";
      if (rowCurrency !== currency) continue;
      const amount =
        typeof (row as any).amountCents === "number" ? Number((row as any).amountCents) : 0;
      balance += amount;
    }

    return { userId, currency, balanceCents: balance };
  },
});

