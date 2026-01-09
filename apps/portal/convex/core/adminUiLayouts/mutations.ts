import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";
import { verifyOrganizationAccessWithClerkContext } from "../organizations/helpers";

const scopeValidator = v.union(v.literal("dashboard"), v.literal("singlePost"));

const hiddenValidator = v.object({
  main: v.array(v.string()),
  sidebar: v.array(v.string()),
});

const areasValidator = v.object({
  main: v.array(
    v.object({
      id: v.string(),
      width: v.union(v.literal("half"), v.literal("full")),
    }),
  ),
  sidebar: v.array(
    v.object({
      id: v.string(),
    }),
  ),
  hidden: v.optional(hiddenValidator),
});

const normalizeMain = (
  items: Array<{ id: string; width: "half" | "full" }>,
): Array<{ id: string; width: "half" | "full" }> => {
  const seen = new Set<string>();
  const out: Array<{ id: string; width: "half" | "full" }> = [];
  for (const item of items) {
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, width: item.width === "half" ? "half" : "full" });
  }
  return out;
};

const normalizeSidebar = (items: Array<{ id: string }>): Array<{ id: string }> => {
  const seen = new Set<string>();
  const out: Array<{ id: string }> = [];
  for (const item of items) {
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id });
  }
  return out;
};

const normalizeHiddenIds = (items: Array<string>): Array<string> => {
  const seen = new Set<string>();
  const out: Array<string> = [];
  for (const item of items) {
    const id = typeof item === "string" ? item.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

export const upsertMyAdminUiLayout = mutation({
  args: {
    organizationId: v.id("organizations"),
    scope: scopeValidator,
    postTypeSlug: v.union(v.string(), v.null()),
    areas: areasValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // This is a per-user UI preference; allow any org member with access
    // (and global admins via the helper's bypass).
    await verifyOrganizationAccessWithClerkContext(ctx, args.organizationId, userId);

    const existing = await ctx.db
      .query("adminUiLayouts")
      .withIndex("by_org_and_user_and_scope_and_post_type", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", userId)
          .eq("scope", args.scope)
          .eq("postTypeSlug", args.postTypeSlug),
      )
      .unique();

    const now = Date.now();
    // Backward compatible: if `hidden` isn't provided, preserve any existing hidden list.
    const existingHidden = (existing?.areas as any)?.hidden as
      | { main?: Array<string>; sidebar?: Array<string> }
      | undefined;
    const nextHidden = args.areas.hidden
      ? {
          main: normalizeHiddenIds(args.areas.hidden.main ?? []),
          sidebar: normalizeHiddenIds(args.areas.hidden.sidebar ?? []),
        }
      : {
          main: normalizeHiddenIds(existingHidden?.main ?? []),
          sidebar: normalizeHiddenIds(existingHidden?.sidebar ?? []),
        };

    const nextAreas = {
      main: normalizeMain(args.areas.main),
      sidebar: normalizeSidebar(args.areas.sidebar),
      hidden: nextHidden,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        areas: nextAreas,
        updatedAt: now,
        version: existing.version ?? 1,
      });
      return null;
    }

    await ctx.db.insert("adminUiLayouts", {
      organizationId: args.organizationId,
      userId: userId,
      scope: args.scope,
      postTypeSlug: args.postTypeSlug,
      areas: nextAreas,
      version: 1,
      updatedAt: now,
    });
    return null;
  },
});


