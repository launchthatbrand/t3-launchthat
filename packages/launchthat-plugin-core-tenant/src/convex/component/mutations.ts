import { v } from "convex/values";

import type { MutationCtx } from "convex/server";

import { internalMutation, mutation } from "./server";

const ensureUser = async (ctx: MutationCtx): Promise<any | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  let existing =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first()) ?? null;

  if (!existing && typeof identity.subject === "string" && identity.subject.trim()) {
    existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  const now = Date.now();

  if (existing) {
    const patch: Record<string, unknown> = { updatedAt: now };
    if (
      typeof identity.tokenIdentifier === "string" &&
      identity.tokenIdentifier.trim() &&
      existing.tokenIdentifier !== identity.tokenIdentifier
    ) {
      patch.tokenIdentifier = identity.tokenIdentifier;
    }
    if (!existing.clerkId && typeof identity.subject === "string") {
      patch.clerkId = identity.subject;
    }
    if (
      typeof identity.email === "string" &&
      identity.email.trim() &&
      existing.email !== identity.email
    ) {
      patch.email = identity.email.trim();
    }
    const nextName = identity.name ?? identity.nickname;
    if (
      typeof nextName === "string" &&
      nextName.trim() &&
      existing.name !== nextName
    ) {
      patch.name = nextName;
    }
    const nextImage =
      typeof identity.picture === "string" ? identity.picture : undefined;
    if (existing.image !== nextImage) {
      patch.image = nextImage;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch as any);
    }
    return existing._id;
  }

  const email =
    typeof identity.email === "string" && identity.email.trim()
      ? identity.email.trim()
      : "";

  const userId = await ctx.db.insert("users", {
    email,
    tokenIdentifier: identity.tokenIdentifier,
    clerkId: typeof identity.subject === "string" ? identity.subject : undefined,
    name: identity.name ?? identity.nickname ?? undefined,
    image: typeof identity.picture === "string" ? identity.picture : undefined,
    createdAt: now,
    updatedAt: now,
  } as any);
  return userId;
};

/**
 * Internal: ensure a `users` row exists for the currently authenticated identity.
 * - Creates user if missing
 * - Backfills tokenIdentifier when initially missing
 */
export const internalEnsureUser = internalMutation({
  args: {},
  returns: v.union(v.null(), v.id("users")),
  handler: async (ctx) => {
    const id = await ensureUser(ctx as unknown as MutationCtx);
    return id ?? null;
  },
});

/**
 * Public wrapper: clients can call this after sign-in to ensure a Convex user exists.
 */
export const createOrGetUser = mutation({
  args: {},
  returns: v.union(v.null(), v.id("users")),
  handler: async (ctx) => {
    const id = await ensureUser(ctx as unknown as MutationCtx);
    return id ?? null;
  },
});

const normalizeSlug = (raw: string): string => {
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized;
};

export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const userId = await ensureUser(ctx as unknown as MutationCtx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const slugBase = typeof args.slug === "string" && args.slug.trim()
      ? args.slug.trim()
      : args.name;
    const slug = normalizeSlug(slugBase);
    if (!slug) {
      throw new Error("Organization slug cannot be empty");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (existing) {
      throw new Error("Organization slug already exists");
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    } as any);

    await ctx.db.insert("userOrganizations", {
      userId,
      organizationId: orgId,
      role: "owner",
      isActive: true,
      joinedAt: now,
      updatedAt: now,
    } as any);

    // Backfill user's default org if absent.
    const user = await ctx.db.get(userId);
    if (user && !user.organizationId) {
      await ctx.db.patch(userId, { organizationId: orgId, updatedAt: now } as any);
    }

    return orgId;
  },
});

export const setActiveOrganization = mutation({
  args: { organizationId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUser(ctx as unknown as MutationCtx);
    if (!userId) throw new Error("Authentication required");

    // Verify membership.
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q: any) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
      .first();
    if (!membership || !membership.isActive) {
      throw new Error("Not a member of this organization");
    }

    const now = Date.now();
    await ctx.db.patch(userId, { organizationId: args.organizationId, updatedAt: now } as any);
    return null;
  },
});

