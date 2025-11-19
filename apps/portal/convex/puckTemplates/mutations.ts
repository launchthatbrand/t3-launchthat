import { mutation } from "../_generated/server";
import { v } from "convex/values";

const TEMPLATE_TYPE = v.union(v.literal("single"), v.literal("archive"));

export const create = mutation({
  args: {
    name: v.string(),
    templateType: TEMPLATE_TYPE,
    postTypeSlug: v.string(),
    pageIdentifier: v.string(),
    organizationId: v.optional(v.id("organizations")),
    scopeKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("puckTemplates")
      .withIndex("by_scope_type_slug", (q) =>
        q
          .eq("scopeKey", args.scopeKey)
          .eq("templateType", args.templateType)
          .eq("postTypeSlug", args.postTypeSlug),
      )
      .first();
    if (existing) {
      return existing;
    }
    const docId = await ctx.db.insert("puckTemplates", {
      name: args.name,
      templateType: args.templateType,
      postTypeSlug: args.postTypeSlug,
      pageIdentifier: args.pageIdentifier,
      organizationId: args.organizationId,
      scopeKey: args.scopeKey,
    });
    return ctx.db.get(docId);
  },
});

