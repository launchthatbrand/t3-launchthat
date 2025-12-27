import { v } from "convex/values";

import { internalMutation, internalQuery } from "../../_generated/server";
import { verifyOrganizationAccess } from "./helpers";

interface DomainRecord {
  type: string;
  name: string;
  value: string;
}

const domainRecordValidator = v.object({
  type: v.string(),
  name: v.string(),
  value: v.string(),
});

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
    .replace(/^\*\./, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
};

export const requireOrgAdmin = internalQuery({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    organizationId: v.id("organizations"),
    customDomain: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User not found");

    await verifyOrganizationAccess(ctx, args.organizationId, user._id, [
      "owner",
      "admin",
    ]);

    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    return {
      organizationId: org._id,
      customDomain: org.customDomain ?? undefined,
    };
  },
});

export const internalFindOrgByCustomDomain = internalQuery({
  args: { hostname: v.string() },
  returns: v.union(v.id("organizations"), v.null()),
  handler: async (ctx, args) => {
    const normalized = normalizeHostname(args.hostname);
    if (!normalized) return null;
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_customDomain", (q) => q.eq("customDomain", normalized))
      .unique();
    return existing?._id ?? null;
  },
});

export const internalUpsertOrgDomainState = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    customDomain: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("unconfigured"),
        v.literal("pending"),
        v.literal("verified"),
        v.literal("error"),
      ),
    ),
    records: v.optional(v.array(domainRecordValidator)),
    verifiedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      customDomainUpdatedAt: Date.now(),
    };
    if (args.customDomain !== undefined) {
      updates.customDomain = args.customDomain;
    }
    if (args.status !== undefined) updates.customDomainStatus = args.status;
    if (args.records !== undefined) updates.customDomainRecords = args.records;
    if (args.verifiedAt !== undefined) {
      updates.customDomainVerifiedAt = args.verifiedAt;
    }
    if (args.lastError !== undefined) {
      updates.customDomainLastError = args.lastError;
    }

    await ctx.db.patch(args.organizationId, updates);
    return null;
  },
});

export const internalUpsertOrgEmailDomainState = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    emailDomain: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("unconfigured"),
        v.literal("pending"),
        v.literal("verified"),
        v.literal("error"),
      ),
    ),
    records: v.optional(v.array(domainRecordValidator)),
    verifiedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      emailDomainUpdatedAt: Date.now(),
    };

    if (args.emailDomain !== undefined) {
      updates.emailDomain = args.emailDomain;
    }
    if (args.status !== undefined) updates.emailDomainStatus = args.status;
    if (args.records !== undefined) updates.emailDomainRecords = args.records;
    if (args.verifiedAt !== undefined) {
      updates.emailDomainVerifiedAt = args.verifiedAt;
    }
    if (args.lastError !== undefined) {
      updates.emailDomainLastError = args.lastError;
    }

    await ctx.db.patch(args.organizationId, updates);
    return null;
  },
});


