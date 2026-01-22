import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

interface OrganizationMembershipSummary {
  organizationId: Id<"organizations">;
  role: string;
  isActive: boolean;
  org: {
    _id: Id<"organizations">;
    name: string;
    slug: string;
  };
}

const normalizeSlug = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeHostname = (input: string): string => {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";

  const candidate = raw.includes("://")
    ? (() => {
        try {
          return new URL(raw).hostname;
        } catch {
          return raw;
        }
      })()
    : raw;

  return candidate
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "");
};

const orgSummary = v.object({
  _id: v.id("organizations"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  ownerId: v.string(),
  clerkOrganizationId: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

export const getOrganizationBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), orgSummary),
  handler: async (ctx, args) => {
    const slug = normalizeSlug(args.slug);
    if (!slug) return null;
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return org ?? null;
  },
});

export const getOrganizationById = query({
  args: { organizationId: v.id("organizations") },
  returns: v.union(v.null(), orgSummary),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    return org ?? null;
  },
});

export const getOrganizationByHostname = query({
  args: {
    appKey: v.string(),
    hostname: v.string(),
    requireVerified: v.optional(v.boolean()),
  },
  returns: v.union(v.null(), orgSummary),
  handler: async (ctx, args) => {
    const appKey = args.appKey.trim().toLowerCase();
    const hostname = normalizeHostname(args.hostname);
    const requireVerified = args.requireVerified !== false;
    if (!appKey || !hostname) return null;

    const domain = await ctx.db
      .query("organizationDomains")
      .withIndex("by_appKey_hostname", (q) =>
        q.eq("appKey", appKey).eq("hostname", hostname),
      )
      .first();
    if (!domain) return null;
    if (requireVerified && domain.status !== "verified") return null;

    const org = await ctx.db.get(domain.organizationId);
    return org ?? null;
  },
});

export const listDomainsForOrg = query({
  args: {
    organizationId: v.id("organizations"),
    appKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizationDomains"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      appKey: v.string(),
      hostname: v.string(),
      status: v.union(
        v.literal("unconfigured"),
        v.literal("pending"),
        v.literal("verified"),
        v.literal("error"),
      ),
      records: v.optional(
        v.array(
          v.object({
            type: v.string(),
            name: v.string(),
            value: v.string(),
          }),
        ),
      ),
      verifiedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const appKey = args.appKey?.trim().toLowerCase() ?? "";
    const rows = appKey
      ? await ctx.db
          .query("organizationDomains")
          .withIndex("by_org_appKey", (q) =>
            q.eq("organizationId", args.organizationId).eq("appKey", appKey),
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("organizationDomains")
          .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
          .order("desc")
          .collect();
    return rows;
  },
});

export const listMembersByOrganizationId = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      userId: v.string(),
      role: v.string(),
      isActive: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("userOrganizations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return rows.map((r) => ({
      userId: r.userId,
      role: String(r.role),
      isActive: Boolean(r.isActive),
    }));
  },
});

/**
 * List organizations for a user.
 *
 * NOTE: `userId` is a string because `users` is app-owned (root table).
 */
export const listOrganizationsByUserId = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      organizationId: v.id("organizations"),
      role: v.string(),
      isActive: v.boolean(),
      org: v.object({
        _id: v.id("organizations"),
        name: v.string(),
        slug: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const orgIds: Id<"organizations">[] = memberships.map((m) => m.organizationId);
    const orgs = await Promise.all(orgIds.map((id) => ctx.db.get(id)));
    const orgById = new Map<Id<"organizations">, Doc<"organizations">>();
    for (const org of orgs) {
      if (org) orgById.set(org._id, org);
    }

    const result: OrganizationMembershipSummary[] = [];
    for (const m of memberships) {
      const org = orgById.get(m.organizationId);
      if (!org) continue;
      result.push({
        organizationId: m.organizationId,
        role: String(m.role),
        isActive: Boolean(m.isActive),
        org: { _id: org._id, name: org.name, slug: org.slug },
      });
    }
    return result;
  },
});

