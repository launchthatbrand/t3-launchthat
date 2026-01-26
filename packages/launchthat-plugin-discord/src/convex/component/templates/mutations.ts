import { v } from "convex/values";

import { mutation } from "../server";

export const createTemplate = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    template: v.string(),
    templateJson: v.optional(v.string()),
  },
  returns: v.id("messageTemplates"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("messageTemplates", {
      organizationId: args.organizationId,
      guildId: args.guildId,
      kind: args.kind,
      name: args.name,
      description: args.description,
      template: args.template,
      templateJson: args.templateJson,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTemplate = mutation({
  args: {
    organizationId: v.string(),
    templateId: v.id("messageTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.optional(v.string()),
    templateJson: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.templateId);
    if (!row || row.organizationId !== args.organizationId) {
      throw new Error("Template not found");
    }
    await ctx.db.patch(args.templateId, {
      name: typeof args.name === "string" ? args.name : row.name,
      description:
        typeof args.description === "string" ? args.description : row.description,
      template: typeof args.template === "string" ? args.template : row.template,
      templateJson:
        typeof args.templateJson === "string" ? args.templateJson : row.templateJson,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteTemplate = mutation({
  args: {
    organizationId: v.string(),
    templateId: v.id("messageTemplates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.templateId);
    if (!row || row.organizationId !== args.organizationId) {
      return null;
    }
    await ctx.db.delete(args.templateId);
    return null;
  },
});

export const upsertTemplate = mutation({
  args: {
    organizationId: v.string(),
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.string(),
    templateJson: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guildId = args.guildId ?? undefined;
    const existing = await ctx.db
      .query("messageTemplates")
      .withIndex("by_organizationId_and_guildId_and_kind", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("guildId", guildId)
          .eq("kind", args.kind),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        template: args.template,
        templateJson: args.templateJson,
        name:
          typeof args.name === "string"
            ? args.name
            : existing.name ?? "Default template",
        description:
          typeof args.description === "string"
            ? args.description
            : existing.description,
        guildId: args.guildId,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("messageTemplates", {
      organizationId: args.organizationId,
      guildId: args.guildId,
      kind: args.kind,
      name: typeof args.name === "string" ? args.name : "Default template",
      description: args.description,
      template: args.template,
      templateJson: args.templateJson,
      createdAt: now,
      updatedAt: now,
    });
    return null;
  },
});
