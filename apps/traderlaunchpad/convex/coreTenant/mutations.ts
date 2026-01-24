import { ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import { resolveOrganizationId } from "../traderlaunchpad/lib/resolve";
import { v } from "convex/values";

const slugifyUsername = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const parseAdminEmails = (raw: string | undefined | null): Set<string> => {
  const set = new Set<string>();
  const input = String(raw ?? "").trim();
  if (!input) return set;
  for (const part of input.split(",")) {
    const email = part.trim().toLowerCase();
    if (email) set.add(email);
  }
  return set;
};

const isAdminEmail = (email: string | undefined | null): boolean => {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  const allow = parseAdminEmails(process.env.TRADERLAUNCHPAD_ADMIN_EMAILS);
  return allow.has(normalized);
};

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
    const nextIsAdmin = isAdminEmail(identity.email);
    const defaultDataMode = "live" as const;
    const email =
      typeof identity.email === "string" && identity.email.trim() ? identity.email.trim() : "";
    const emailPrefix = email ? (email.split("@")[0] ?? "") : "";
    const nextName = identity.name ?? identity.nickname;
    const derivedUsername = slugifyUsername(String(nextName ?? emailPrefix ?? ""));

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
      if (
        !existing.publicUsername &&
        typeof derivedUsername === "string" &&
        derivedUsername.trim()
      ) {
        patch.publicUsername = derivedUsername.trim();
      }
      if (typeof existing.isAdmin !== "boolean" || existing.isAdmin !== nextIsAdmin) {
        patch.isAdmin = nextIsAdmin;
      }
      if (
        existing.dataMode !== "demo" &&
        existing.dataMode !== "live"
      ) {
        patch.dataMode = defaultDataMode;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch as any);
      }
      return existing._id;
    }

    if (!email) {
      // We rely on email for admin allowlist checks; ensure it's present.
      // (Clerk/Convex identity usually provides this, but guard anyway.)
      throw new ConvexError("Missing email on authenticated identity.");
    }

    const userId = await ctx.db.insert("users", {
      email,
      tokenIdentifier: identity.tokenIdentifier,
      clerkId: typeof identity.subject === "string" ? identity.subject : undefined,
      publicUsername: derivedUsername ? derivedUsername : undefined,
      name: typeof nextName === "string" ? nextName : identity.name ?? identity.nickname ?? undefined,
      image: typeof identity.picture === "string" ? identity.picture : undefined,
      organizationId: defaultOrgId.trim(),
      isAdmin: nextIsAdmin,
      dataMode: defaultDataMode,
      createdAt: now,
      updatedAt: now,
    } as any);

    return userId;
  },
});

