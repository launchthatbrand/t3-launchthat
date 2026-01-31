import type { ActionCtx, MutationCtx, QueryCtx } from "../types";

import { ConvexError } from "convex/values";
import { api, internal } from "../../_generated/api";

export const resolveOrganizationId = (): string => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars, no-restricted-properties -- set in Convex dashboard for this deployment
  const orgId = process.env.TRADERLAUNCHPAD_DEFAULT_ORG_ID;
  if (typeof orgId !== "string" || !orgId.trim()) {
    throw new ConvexError(
      "Missing TRADERLAUNCHPAD_DEFAULT_ORG_ID (set in Convex env for this deployment).",
    );
  }
  return orgId.trim();
};

export const resolveViewerUserId = async (
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> => {
  const ident = await ctx.auth.getUserIdentity();
  const subject =
    typeof ident?.subject === "string" && ident.subject.trim()
      ? ident.subject.trim()
      : null;
  if (!subject) {
    throw new ConvexError("Unauthorized: You must be logged in to perform this action.");
  }

  // We intentionally key app data by the app-owned Convex `users` document id to avoid
  // being tightly coupled to the auth provider (e.g. Clerk subject IDs).
  const tokenIdentifier =
    typeof ident?.tokenIdentifier === "string" && ident.tokenIdentifier.trim()
      ? ident.tokenIdentifier.trim()
      : null;

  // Actions do not have direct DB access; ensure the user row exists and return its id.
  if (!("db" in ctx)) {
    const userDocId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (!userDocId) throw new ConvexError("Unauthorized: user record not initialized.");
    return String(userDocId);
  }

  // Queries/mutations: resolve the app-owned user id from the local `users` table.
  type UserRow = { _id: string } & Record<string, unknown>;
  let user: UserRow | null = null;

  if (tokenIdentifier) {
    user =
      ((await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .first()) as UserRow | null) ?? null;
  }

  if (!user) {
    user =
      ((await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", subject))
        .first()) as UserRow | null) ?? null;
  }

  if (user?._id) return String(user._id);

  // Mutations can create/reconcile; queries can't.
  if ("runMutation" in ctx) {
    const userDocId = await ctx.runMutation(api.coreTenant.mutations.createOrGetUser, {});
    if (!userDocId) throw new ConvexError("Unauthorized: user record not initialized.");
    return String(userDocId);
  }

  throw new ConvexError("Unauthorized: user record not initialized.");
};

export const resolveUserIdByClerkId = async (
  ctx: QueryCtx | MutationCtx,
  clerkId: string,
): Promise<string | null> => {
  const normalized = typeof clerkId === "string" ? clerkId.trim() : "";
  if (!normalized) return null;
  type UserRow = { _id: string } & Record<string, unknown>;
  const user = (await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", normalized))
    .first()) as UserRow | null;
  return user?._id ? String(user._id) : null;
};

/**
 * Resolve whether the current viewer is an app/platform admin.
 *
 * NOTE:
 * - This is app-owned admin state stored on the `users` table (`users.isAdmin`).
 * - It can be derived from env allowlists (e.g. TRADERLAUNCHPAD_ADMIN_EMAILS) or set via admin tooling.
 * - This helper performs reads only (safe for queries).
 */
export const resolveViewerIsAdmin = async (
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> => {
  const ident = await ctx.auth.getUserIdentity();
  if (!ident) return false;

  const tokenIdentifier =
    typeof ident.tokenIdentifier === "string" && ident.tokenIdentifier.trim()
      ? ident.tokenIdentifier.trim()
      : null;
  const subject =
    typeof ident.subject === "string" && ident.subject.trim()
      ? ident.subject.trim()
      : null;

  let user: { isAdmin?: unknown } | null = null;

  // Prefer tokenIdentifier (Convex auth) when available.
  if (tokenIdentifier) {
    const row = (await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first()) as unknown;
    user = (row as { isAdmin?: unknown } | null) ?? null;
  }

  // Fallback to Clerk subject lookup.
  if (!user && subject) {
    const row = (await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subject))
      .first()) as unknown;
    user = (row as { isAdmin?: unknown } | null) ?? null;
  }

  return Boolean(user?.isAdmin);
};

export const requirePlatformAdmin = async (
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<void> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    if (process.env.NODE_ENV !== "production") return;
    throw new ConvexError("Unauthorized");
  }
  if (!("db" in ctx)) {
    await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
    return;
  }
  const isAdmin = await resolveViewerIsAdmin(ctx);
  if (!isAdmin) {
    throw new ConvexError("Forbidden");
  }
};


