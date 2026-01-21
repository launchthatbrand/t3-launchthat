import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { resolveOrganizationId } from "../traderlaunchpad/lib/resolve";

export const createOrGetUser = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Prefer tokenIdentifier (convex auth) when available.
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
    const defaultOrgId = resolveOrganizationId();

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
      if (typeof nextName === "string" && nextName.trim() && existing.name !== nextName) {
        patch.name = nextName;
      }
      const nextImage = typeof identity.picture === "string" ? identity.picture : undefined;
      if (existing.image !== nextImage) {
        patch.image = nextImage;
      }
      if (!existing.organizationId && typeof defaultOrgId === "string" && defaultOrgId.trim()) {
        patch.organizationId = defaultOrgId.trim();
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch as any);
      }
      return existing._id;
    }

    const email =
      typeof identity.email === "string" && identity.email.trim() ? identity.email.trim() : "";

    const userId = await ctx.db.insert("users", {
      email,
      tokenIdentifier: identity.tokenIdentifier,
      clerkId: typeof identity.subject === "string" ? identity.subject : undefined,
      name: identity.name ?? identity.nickname ?? undefined,
      image: typeof identity.picture === "string" ? identity.picture : undefined,
      organizationId: defaultOrgId.trim(),
      createdAt: now,
      updatedAt: now,
    } as any);

    return userId;
  },
});

