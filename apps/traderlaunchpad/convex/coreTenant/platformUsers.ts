import { ConvexError, v } from "convex/values";
import { query } from "../_generated/server";

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      clerkId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Platform-only: require admin.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    // Prefer tokenIdentifier (convex auth) when available.
    let viewer =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first()) ?? null;

    if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
      viewer = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();
    }

    if (!viewer) throw new ConvexError("Unauthorized");
    if (!viewer.isAdmin) throw new ConvexError("Forbidden: admin access required.");

    const search = String(args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Number(args.limit ?? 200), 1000));

    // NOTE: For now, simple scan + filter (platform tooling). If this grows, add indexes.
    const rows = await ctx.db.query("users").take(1000);
    const result: { clerkId: string; email: string; name?: string }[] = [];

    for (const u of rows) {
      const clerkId = typeof u.clerkId === "string" ? u.clerkId : "";
      if (!clerkId) continue;
      const email = String(u.email ?? "").trim();
      const name = typeof u.name === "string" && u.name.trim() ? u.name.trim() : undefined;

      if (search) {
        const haystack = `${email} ${name ?? ""} ${clerkId}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      result.push({ clerkId, email, name });
      if (result.length >= limit) break;
    }

    return result;
  },
});

