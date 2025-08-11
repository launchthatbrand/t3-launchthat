import { v } from "convex/values";
import { mutation } from "../_generated/server";
// --- ORGANIZATIONS (GROUPS) ---
export const createOrganization = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        description: v.optional(v.string()),
        website: v.optional(v.string()),
        industry: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("organizations", {
            name: args.name,
            description: args.description,
            website: args.website,
            industry: args.industry,
            createdBy: args.userId,
            createdAt: now,
        });
    },
});
export const updateOrganization = mutation({
    args: {
        organizationId: v.id("organizations"),
        updates: v.object({
            name: v.optional(v.string()),
            description: v.optional(v.string()),
            website: v.optional(v.string()),
            industry: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.organizationId, {
            ...args.updates,
            updatedAt: now,
        });
        return true;
    },
});
export const deleteOrganization = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.organizationId);
        return true;
    },
});
export const addContactToOrganization = mutation({
    args: {
        contactId: v.id("contacts"),
        organizationId: v.id("organizations"),
        role: v.optional(v.string()),
        isPrimary: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Add a row to contactOrganizations table
        await ctx.db.insert("contactOrganizations", {
            contactId: args.contactId,
            organizationId: args.organizationId,
            role: args.role,
            isPrimary: args.isPrimary,
        });
        return true;
    },
});
export const removeContactFromOrganization = mutation({
    args: { contactId: v.id("contacts"), organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Remove the row from contactOrganizations table
        const link = await ctx.db
            .query("contactOrganizations")
            .withIndex("by_contact_organization", (q) => q
            .eq("contactId", args.contactId)
            .eq("organizationId", args.organizationId))
            .first();
        if (link) {
            await ctx.db.delete(link._id);
        }
        return true;
    },
});
