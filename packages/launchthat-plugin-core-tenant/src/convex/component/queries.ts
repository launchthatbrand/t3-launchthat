import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { orgPublicProfileConfigV1Validator } from "./publicProfiles/types";

interface OrganizationMembershipSummary {
  organizationId: Id<"organizations">;
  role: string;
  isActive: boolean;
  org: {
    _id: Id<"organizations">;
    name: string;
    slug: string;
    logoUrl: string | null;
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
  description: v.optional(v.string()),
  logo: v.optional(v.string()),
  logoMediaId: v.optional(v.id("organizationMedia")),
  publicProfileConfig: v.optional(orgPublicProfileConfigV1Validator),
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
        logoUrl: v.union(v.string(), v.null()),
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

      let logoUrl: string | null = null;
      if (org.logoMediaId) {
        const media = await ctx.db.get(org.logoMediaId as Id<"organizationMedia">);
        if (media) {
          logoUrl = await ctx.storage.getUrl(media.storageId);
        }
      }
      if (!logoUrl && typeof org.logo === "string" && org.logo.trim()) {
        logoUrl = org.logo.trim();
      }

      result.push({
        organizationId: m.organizationId,
        role: String(m.role),
        isActive: Boolean(m.isActive),
        org: { _id: org._id, name: org.name, slug: org.slug, logoUrl },
      });
    }
    return result;
  },
});

export const listOrganizationMedia = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizationMedia"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      uploadedByUserId: v.string(),
      storageId: v.id("_storage"),
      url: v.union(v.string(), v.null()),
      contentType: v.string(),
      size: v.number(),
      filename: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Number(args.limit ?? 100), 500));
    const rowsRaw = await ctx.db
      .query("organizationMedia")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(limit);
    interface OrganizationMediaDoc {
      _id: Id<"organizationMedia">;
      _creationTime: number;
      organizationId: Id<"organizations">;
      uploadedByUserId: string;
      storageId: Id<"_storage">;
      contentType: string;
      size: number;
      filename?: string;
      createdAt: number;
      updatedAt: number;
    }
    const rows = rowsRaw as unknown as OrganizationMediaDoc[];

    const result: {
      _id: Id<"organizationMedia">;
      _creationTime: number;
      organizationId: Id<"organizations">;
      uploadedByUserId: string;
      storageId: Id<"_storage">;
      url: string | null;
      contentType: string;
      size: number;
      filename?: string;
      createdAt: number;
      updatedAt: number;
    }[] = [];

    for (const row of rows) {
      const url = await ctx.storage.getUrl(row.storageId);
      result.push({
        _id: row._id,
        _creationTime: row._creationTime,
        organizationId: row.organizationId,
        uploadedByUserId: row.uploadedByUserId,
        storageId: row.storageId,
        url,
        contentType: row.contentType,
        size: row.size,
        filename: row.filename,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }

    return result;
  },
});

export const getOrganizationMediaById = query({
  args: { mediaId: v.id("organizationMedia") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizationMedia"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      uploadedByUserId: v.string(),
      storageId: v.id("_storage"),
      url: v.union(v.string(), v.null()),
      contentType: v.string(),
      size: v.number(),
      filename: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rowRaw = await ctx.db.get(args.mediaId);
    interface OrganizationMediaDoc {
      _id: Id<"organizationMedia">;
      _creationTime: number;
      organizationId: Id<"organizations">;
      uploadedByUserId: string;
      storageId: Id<"_storage">;
      contentType: string;
      size: number;
      filename?: string;
      createdAt: number;
      updatedAt: number;
    }
    const row = rowRaw as unknown as OrganizationMediaDoc | null;
    if (!row) return null;
    const url = await ctx.storage.getUrl(row.storageId);
    return {
      _id: row._id,
      _creationTime: row._creationTime,
      organizationId: row.organizationId,
      uploadedByUserId: row.uploadedByUserId,
      storageId: row.storageId,
      url,
      contentType: row.contentType,
      size: row.size,
      filename: row.filename,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
});

export const listOrganizations = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(orgSummary),
  handler: async (ctx, args) => {
    const search = String(args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Number(args.limit ?? 200), 1000));

    // NOTE: For platform admin tooling, a scan is acceptable for now.
    // If this grows, add an index-backed search strategy.
    const rows = await ctx.db.query("organizations").take(1000);
    const result: Doc<"organizations">[] = [];

    for (const org of rows) {
      if (search) {
        const haystack = `${org.name} ${org.slug} ${org.ownerId}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }
      result.push(org);
      if (result.length >= limit) break;
    }

    return result;
  },
});

const orgPublicRow = v.object({
  _id: v.id("organizations"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  logoUrl: v.union(v.string(), v.null()),
});

export const listOrganizationsPublic = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    includePlatform: v.optional(v.boolean()),
  },
  returns: v.array(orgPublicRow),
  handler: async (ctx, args) => {
    const search = String(args.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Number(args.limit ?? 200), 1000));
    const includePlatform = args.includePlatform === true;

    const rows = await ctx.db.query("organizations").take(1000);
    const result: Array<{
      _id: Id<"organizations">;
      name: string;
      slug: string;
      description?: string;
      logoUrl: string | null;
    }> = [];

    for (const org of rows) {
      if (!includePlatform && org.slug === "platform") continue;
      if (search) {
        const haystack = `${org.name} ${org.slug}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }

      let logoUrl: string | null = null;
      if (org.logoMediaId) {
        const media = await ctx.db.get(org.logoMediaId as Id<"organizationMedia">);
        if (media) {
          logoUrl = await ctx.storage.getUrl(media.storageId);
        }
      }
      if (!logoUrl && typeof org.logo === "string" && org.logo.trim()) {
        logoUrl = org.logo.trim();
      }

      result.push({
        _id: org._id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        logoUrl,
      });
      if (result.length >= limit) break;
    }

    return result;
  },
});

