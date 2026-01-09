import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../organizations/helpers";

const scopeValidator = v.union(v.literal("dashboard"), v.literal("singlePost"));

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

export const upsertMyAdminUiLayout = mutation({
  args: {
    organizationId: v.id("organizations"),
    scope: scopeValidator,
    postTypeSlug: v.union(v.string(), v.null()),
    areas: areasValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      user._id,
      ["owner", "admin"],
    );

    const existing = await ctx.db
      .query("adminUiLayouts")
      .withIndex("by_org_and_user_and_scope_and_post_type", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", user._id)
          .eq("scope", args.scope)
          .eq("postTypeSlug", args.postTypeSlug),
      )
      .unique();

    const now = Date.now();
    const nextAreas = {
      main: normalizeMain(args.areas.main),
      sidebar: normalizeSidebar(args.areas.sidebar),
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
      userId: user._id,
      scope: args.scope,
      postTypeSlug: args.postTypeSlug,
      areas: nextAreas,
      version: 1,
      updatedAt: now,
    });
    return null;
  },
});


