import { query } from "../_generated/server";
import { v } from "convex/values";

const TEMPLATE_TYPE = v.union(v.literal("single"), v.literal("archive"));

export const list = query({
  args: {
    scopeKey: v.string(),
  },
  handler: async (ctx, args) => {
    const results =
      args.scopeKey === "global"
        ? await ctx.db
            .query("puckTemplates")
            .withIndex("by_scope_type_slug", (q) => q.eq("scopeKey", "global"))
            .collect()
        : await ctx.db
            .query("puckTemplates")
            .withIndex("by_scope_type_slug", (q) =>
              q.eq("scopeKey", args.scopeKey),
            )
            .collect();
    const globals =
      args.scopeKey === "global"
        ? []
        : await ctx.db
            .query("puckTemplates")
            .withIndex("by_scope_type_slug", (q) => q.eq("scopeKey", "global"))
            .collect();
    const merged = new Map<string, (typeof results)[number]>();
    globals.forEach((template) => {
      const key = `${template.templateType}-${template.postTypeSlug}`;
      merged.set(key, template);
    });
    results.forEach((template) => {
      const key = `${template.templateType}-${template.postTypeSlug}`;
      merged.set(key, template);
    });
    return Array.from(merged.values());
  },
});

export const getTemplate = query({
  args: {
    templateType: TEMPLATE_TYPE,
    postTypeSlug: v.string(),
    scopeKey: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db
      .query("puckTemplates")
      .withIndex("by_scope_type_slug", (q) =>
        q
          .eq("scopeKey", args.scopeKey)
          .eq("templateType", args.templateType)
          .eq("postTypeSlug", args.postTypeSlug),
      )
      .first();
    if (match) {
      return match;
    }
    return ctx.db
      .query("puckTemplates")
      .withIndex("by_scope_type_slug", (q) =>
        q
          .eq("scopeKey", "global")
          .eq("templateType", args.templateType)
          .eq("postTypeSlug", args.postTypeSlug),
      )
      .first();
  },
});
