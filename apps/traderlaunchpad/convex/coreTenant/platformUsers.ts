import { ConvexError, v } from "convex/values";
import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const requirePlatformAdmin = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthorized");

  // Prefer tokenIdentifier (convex auth) when available.
  let viewer =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new ConvexError("Unauthorized");
  if (!viewer.isAdmin) throw new ConvexError("Forbidden: admin access required.");

  return { viewer };
};

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userDocId: v.id("users"),
      clerkId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      isAdmin: v.optional(v.boolean()),
      organizationId: v.optional(v.string()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const search = String(args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Number(args.limit ?? 200), 1000));

    // NOTE: For now, simple scan + filter (platform tooling). If this grows, add indexes.
    const rows = await ctx.db.query("users").take(1000);
    const result: Array<{
      userDocId: Id<"users">;
      clerkId: string;
      email: string;
      name?: string;
      image?: string;
      isAdmin?: boolean;
      organizationId?: string;
      createdAt?: number;
      updatedAt?: number;
    }> = [];

    for (const u of rows) {
      const clerkId = typeof u.clerkId === "string" ? u.clerkId : "";
      if (!clerkId) continue;
      const email = String(u.email ?? "").trim();
      const name = typeof u.name === "string" && u.name.trim() ? u.name.trim() : undefined;
      const image = typeof u.image === "string" && u.image.trim() ? u.image.trim() : undefined;
      const organizationId =
        typeof u.organizationId === "string" && u.organizationId.trim()
          ? u.organizationId.trim()
          : undefined;

      if (search) {
        const haystack = `${email} ${name ?? ""} ${clerkId}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      result.push({
        userDocId: u._id,
        clerkId,
        email,
        name,
        image,
        isAdmin: u.isAdmin,
        organizationId,
        createdAt: typeof u.createdAt === "number" ? u.createdAt : undefined,
        updatedAt: typeof u.updatedAt === "number" ? u.updatedAt : undefined,
      });
      if (result.length >= limit) break;
    }

    return result;
  },
});

export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      userDocId: v.id("users"),
      clerkId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      isAdmin: v.optional(v.boolean()),
      dataMode: v.optional(v.union(v.literal("demo"), v.literal("live"))),
      organizationId: v.optional(v.string()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const clerkId = String(args.clerkId ?? "").trim();
    if (!clerkId) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return null;

    return {
      userDocId: user._id,
      clerkId: typeof user.clerkId === "string" ? user.clerkId : clerkId,
      email: String(user.email ?? "").trim(),
      name: typeof user.name === "string" && user.name.trim() ? user.name.trim() : undefined,
      image:
        typeof user.image === "string" && user.image.trim() ? user.image.trim() : undefined,
      isAdmin: user.isAdmin,
      dataMode: user.dataMode,
      organizationId:
        typeof user.organizationId === "string" && user.organizationId.trim()
          ? user.organizationId.trim()
          : undefined,
      createdAt: typeof user.createdAt === "number" ? user.createdAt : undefined,
      updatedAt: typeof user.updatedAt === "number" ? user.updatedAt : undefined,
    };
  },
});

