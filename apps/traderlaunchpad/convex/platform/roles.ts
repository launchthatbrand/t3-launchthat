/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unsafe-argument
*/

import { mutation, query } from "../_generated/server";

import { v } from "convex/values";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ROLE_KEYS = ["user", "staff", "admin"] as const;
type RoleKey = (typeof ROLE_KEYS)[number];

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

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

  if (!viewer) throw new Error("Unauthorized");
  if (!viewer.isAdmin) throw new Error("Forbidden");
  return viewer;
};

const defaultRoles = (): {
  key: RoleKey;
  label: string;
  description: string;
  isAdmin: boolean;
  updatedAt: number;
}[] => [
    {
      key: "user",
      label: "User",
      description: "Default platform access.",
      isAdmin: false,
      updatedAt: 0,
    },
    {
      key: "staff",
      label: "Staff",
      description: "Internal support and moderation access.",
      isAdmin: false,
      updatedAt: 0,
    },
    {
      key: "admin",
      label: "Admin",
      description: "Full platform administration access.",
      isAdmin: true,
      updatedAt: 0,
    },
  ];

export const listPlatformRoles = query({
  args: {},
  returns: v.array(
    v.object({
      key: v.union(v.literal("user"), v.literal("staff"), v.literal("admin")),
      label: v.string(),
      description: v.optional(v.string()),
      isAdmin: v.boolean(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const rows = await ctx.db.query("userRoles").collect();
    const map = new Map<string, any>(
      rows.map((row: any) => [
        String(row.key),
        {
          key: row.key,
          label: row.label,
          description: row.description,
          isAdmin: Boolean(row.isAdmin),
          updatedAt: Number(row.updatedAt ?? 0),
        },
      ]),
    );

    return defaultRoles().map((fallback) => {
      const row = map.get(fallback.key);
      return row
        ? {
          key: row.key,
          label: typeof row.label === "string" ? row.label : fallback.label,
          description:
            typeof row.description === "string" ? row.description : fallback.description,
          isAdmin: Boolean(row.isAdmin ?? fallback.isAdmin),
          updatedAt: Number(row.updatedAt ?? fallback.updatedAt),
        }
        : fallback;
    });
  },
});

export const upsertPlatformRole = mutation({
  args: {
    key: v.union(v.literal("user"), v.literal("staff"), v.literal("admin")),
    label: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();
    const payload = {
      key: args.key,
      label: args.label.trim() || args.key,
      description: typeof args.description === "string" ? args.description.trim() : undefined,
      isAdmin: args.key === "admin",
      updatedAt: now,
    };

    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_key", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { ok: true };
    }

    await ctx.db.insert("userRoles", { ...payload, createdAt: now });
    return { ok: true };
  },
});
