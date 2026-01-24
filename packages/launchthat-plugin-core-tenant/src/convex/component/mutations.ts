import { v } from "convex/values";

import { mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { DEFAULT_ORG_PUBLIC_PROFILE_CONFIG_V1, orgPublicProfileConfigV1Validator } from "./publicProfiles/types";

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

const normalizeSlug = (raw: string): string => {
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized;
};

const isReservedOrganizationSlug = (slug: string): boolean => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "platform") return true;
  if (normalized.startsWith("__")) return true;
  return false;
};

export const createOrganization = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    logoMediaId: v.optional(v.id("organizationMedia")),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const slugBase = typeof args.slug === "string" && args.slug.trim()
      ? args.slug.trim()
      : args.name;
    const slug = normalizeSlug(slugBase);
    if (!slug) {
      throw new Error("Organization slug cannot be empty");
    }
    if (isReservedOrganizationSlug(slug)) {
      throw new Error("Organization slug is reserved");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      throw new Error("Organization slug already exists");
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      ownerId: args.userId,
      description: typeof args.description === "string" ? args.description : undefined,
      logo: typeof args.logo === "string" ? args.logo : undefined,
      logoMediaId: args.logoMediaId,
      publicProfileConfig: DEFAULT_ORG_PUBLIC_PROFILE_CONFIG_V1,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("userOrganizations", {
      userId: args.userId,
      organizationId: orgId,
      role: "owner",
      isActive: true,
      joinedAt: now,
      updatedAt: now,
    });

    return orgId;
  },
});

export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.union(v.string(), v.null())),
    logoMediaId: v.optional(v.union(v.id("organizationMedia"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const patch: Partial<Doc<"organizations">> = {};
    const now = Date.now();

    if (typeof args.name === "string" && args.name.trim() && args.name !== org.name) {
      patch.name = args.name.trim();
    }

    if (typeof args.description === "string") {
      const next = args.description.trim();
      patch.description = next ? next : undefined;
    }

    if (args.logo === null) {
      patch.logo = undefined;
    } else if (typeof args.logo === "string") {
      const next = args.logo.trim();
      patch.logo = next ? next : undefined;
    }

    if (args.logoMediaId === null) {
      patch.logoMediaId = undefined;
    } else if (typeof args.logoMediaId === "string") {
      patch.logoMediaId = args.logoMediaId;
    }

    if (typeof args.slug === "string") {
      const nextSlug = normalizeSlug(args.slug.trim());
      if (!nextSlug) throw new Error("Organization slug cannot be empty");
      if (isReservedOrganizationSlug(nextSlug)) {
        throw new Error("Organization slug is reserved");
      }
      if (nextSlug !== org.slug) {
        const existing = await ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
          .first();
        if (existing && existing._id !== org._id) {
          throw new Error("Organization slug already exists");
        }
        patch.slug = nextSlug;
      }
    }

    if (Object.keys(patch).length === 0) return null;
    patch.updatedAt = now;
    await ctx.db.patch(org._id, patch);
    return null;
  },
});

export const updateOrganizationPublicProfileConfig = mutation({
  args: {
    organizationId: v.id("organizations"),
    config: v.union(v.null(), orgPublicProfileConfigV1Validator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(org._id, {
      publicProfileConfig: args.config === null ? undefined : args.config,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const generateOrganizationMediaUploadUrl = mutation({
  args: { organizationId: v.id("organizations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    // AuthZ is enforced at the app wrapper layer (platform admin / org admin).
    // Here we just ensure the org exists and return an upload URL.
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createOrganizationMedia = mutation({
  args: {
    organizationId: v.id("organizations"),
    storageId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
    filename: v.optional(v.string()),
    uploadedByUserId: v.string(),
  },
  returns: v.id("organizationMedia"),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const now = Date.now();
    return await ctx.db.insert("organizationMedia", {
      organizationId: args.organizationId,
      uploadedByUserId: args.uploadedByUserId,
      storageId: args.storageId,
      contentType: args.contentType,
      size: args.size,
      filename: typeof args.filename === "string" && args.filename.trim() ? args.filename.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteOrganizationMedia = mutation({
  args: { mediaId: v.id("organizationMedia") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.mediaId);
    if (!row) return null;
    await ctx.db.delete(row._id);
    return null;
  },
});

export const ensureMembership = mutation({
  args: {
    userId: v.string(),
    organizationId: v.id("organizations"),
    role: v.optional(
      v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("editor"),
        v.literal("viewer"),
        v.literal("student"),
      ),
    ),
    setActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .first();

    const now = Date.now();
    if (!membership) {
      await ctx.db.insert("userOrganizations", {
        userId: args.userId,
        organizationId: args.organizationId,
        role: args.role ?? "viewer",
        isActive: args.setActive ?? false,
        joinedAt: now,
        updatedAt: now,
      });
      return null;
    }

    const patch: Partial<Doc<"userOrganizations">> = { updatedAt: now };
    if (args.setActive === true && membership.isActive !== true) {
      patch.isActive = true;
    }
    if (args.role && membership.role !== args.role) {
      patch.role = args.role;
    }
    if (Object.keys(patch).length > 1) {
      await ctx.db.patch(membership._id, patch);
    }
    return null;
  },
});

export const removeMembership = mutation({
  args: {
    userId: v.string(),
    organizationId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .first();
    if (!membership) return null;
    await ctx.db.delete(membership._id);
    return null;
  },
});

export const setActiveOrganizationForUser = mutation({
  args: {
    userId: v.string(),
    organizationId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    let hasMembership = false;

    for (const m of memberships) {
      if (m.organizationId === args.organizationId) {
        hasMembership = true;
      }

      const nextActive = m.organizationId === args.organizationId;
      if (m.isActive !== nextActive) {
        await ctx.db.patch(m._id, { isActive: nextActive, updatedAt: now });
      } else if (m.updatedAt !== now && nextActive) {
        // Keep a timestamp bump for the active org selection.
        await ctx.db.patch(m._id, { updatedAt: now });
      }
    }

    if (!hasMembership) {
      throw new Error("User is not a member of that organization");
    }

    return null;
  },
});

export const upsertOrganizationDomain = mutation({
  args: {
    organizationId: v.id("organizations"),
    appKey: v.string(),
    hostname: v.string(),
    status: v.optional(
      v.union(
        v.literal("unconfigured"),
        v.literal("pending"),
        v.literal("verified"),
        v.literal("error"),
      ),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appKey = args.appKey.trim().toLowerCase();
    const hostname = normalizeHostname(args.hostname);
    if (!appKey) throw new Error("appKey is required");
    if (!hostname) throw new Error("hostname is required");

    const existing = await ctx.db
      .query("organizationDomains")
      .withIndex("by_appKey_hostname", (q) =>
        q.eq("appKey", appKey).eq("hostname", hostname),
      )
      .first();

    const now = Date.now();
    const nextStatus = args.status ?? "pending";

    if (!existing) {
      await ctx.db.insert("organizationDomains", {
        organizationId: args.organizationId,
        appKey,
        hostname,
        status: nextStatus,
        createdAt: now,
        updatedAt: now,
      });
      return null;
    }

    // Domain uniqueness: (appKey, hostname) can only point to one org.
    if (existing.organizationId !== args.organizationId) {
      throw new Error("That domain is already assigned to another organization.");
    }

    const patch: Partial<Doc<"organizationDomains">> = { updatedAt: now };
    if (existing.status !== nextStatus) patch.status = nextStatus;
    if (Object.keys(patch).length > 1) {
      await ctx.db.patch(existing._id, patch);
    }
    return null;
  },
});

export const setOrganizationDomainStatus = mutation({
  args: {
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
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appKey = args.appKey.trim().toLowerCase();
    const hostname = normalizeHostname(args.hostname);
    if (!appKey) throw new Error("appKey is required");
    if (!hostname) throw new Error("hostname is required");

    const existing = await ctx.db
      .query("organizationDomains")
      .withIndex("by_appKey_hostname", (q) =>
        q.eq("appKey", appKey).eq("hostname", hostname),
      )
      .first();
    if (!existing) throw new Error("Domain mapping not found.");
    if (existing.organizationId !== args.organizationId) {
      throw new Error("Domain mapping belongs to a different organization.");
    }

    const now = Date.now();
    const patch: Partial<Doc<"organizationDomains">> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.records !== undefined) patch.records = args.records;
    if (args.lastError !== undefined) patch.lastError = args.lastError;
    if (args.status === "verified") patch.verifiedAt = now;

    await ctx.db.patch(existing._id, patch);
    return null;
  },
});

export const removeOrganizationDomain = mutation({
  args: {
    organizationId: v.id("organizations"),
    appKey: v.string(),
    hostname: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appKey = args.appKey.trim().toLowerCase();
    const hostname = normalizeHostname(args.hostname);
    if (!appKey) throw new Error("appKey is required");
    if (!hostname) throw new Error("hostname is required");

    const existing = await ctx.db
      .query("organizationDomains")
      .withIndex("by_appKey_hostname", (q) =>
        q.eq("appKey", appKey).eq("hostname", hostname),
      )
      .first();
    if (!existing) return null;
    if (existing.organizationId !== args.organizationId) {
      throw new Error("Domain mapping belongs to a different organization.");
    }

    await ctx.db.delete(existing._id);
    return null;
  },
});

