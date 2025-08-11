import { v } from "convex/values";
import { mutation } from "../_generated/server";
// --- CONTACTS CRUD ---
export const createContact = mutation({
    args: {
        userId: v.string(),
        contactData: v.object({
            firstName: v.string(),
            lastName: v.string(),
            email: v.string(),
            phone: v.optional(v.string()),
            company: v.optional(v.string()),
            jobTitle: v.optional(v.string()),
            department: v.optional(v.string()),
            address: v.optional(v.object({
                street1: v.string(),
                street2: v.optional(v.string()),
                city: v.string(),
                state: v.string(),
                postalCode: v.string(),
                country: v.string(),
            })),
            socialProfiles: v.optional(v.object({
                linkedin: v.optional(v.string()),
                twitter: v.optional(v.string()),
                facebook: v.optional(v.string()),
                instagram: v.optional(v.string()),
                website: v.optional(v.string()),
            })),
            tags: v.optional(v.array(v.string())),
            leadSource: v.optional(v.string()),
            leadStatus: v.optional(v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("proposal"), v.literal("negotiation"), v.literal("won"), v.literal("lost"), v.literal("dormant"))),
            customerType: v.optional(v.union(v.literal("lead"), v.literal("prospect"), v.literal("customer"), v.literal("former-customer"), v.literal("partner"))),
            customFields: v.optional(v.any()),
            notes: v.optional(v.string()),
            emailOptOut: v.optional(v.boolean()),
            smsOptOut: v.optional(v.boolean()),
            assignedTo: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        // Check for duplicate email
        const existing = await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", args.contactData.email))
            .first();
        if (existing)
            throw new Error("Contact with this email already exists");
        const now = Date.now();
        return await ctx.db.insert("contacts", {
            ...args.contactData,
            createdBy: args.userId,
            createdAt: now,
            updatedAt: now,
        });
    },
});
export const updateContact = mutation({
    args: {
        contactId: v.id("contacts"),
        updates: v.object({
            firstName: v.optional(v.string()),
            lastName: v.optional(v.string()),
            email: v.optional(v.string()),
            phone: v.optional(v.string()),
            company: v.optional(v.string()),
            jobTitle: v.optional(v.string()),
            department: v.optional(v.string()),
            address: v.optional(v.object({
                street1: v.string(),
                street2: v.optional(v.string()),
                city: v.string(),
                state: v.string(),
                postalCode: v.string(),
                country: v.string(),
            })),
            socialProfiles: v.optional(v.object({
                linkedin: v.optional(v.string()),
                twitter: v.optional(v.string()),
                facebook: v.optional(v.string()),
                instagram: v.optional(v.string()),
                website: v.optional(v.string()),
            })),
            tags: v.optional(v.array(v.string())),
            leadSource: v.optional(v.string()),
            leadStatus: v.optional(v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("proposal"), v.literal("negotiation"), v.literal("won"), v.literal("lost"), v.literal("dormant"))),
            customerType: v.optional(v.union(v.literal("lead"), v.literal("prospect"), v.literal("customer"), v.literal("former-customer"), v.literal("partner"))),
            customFields: v.optional(v.any()),
            notes: v.optional(v.string()),
            emailOptOut: v.optional(v.boolean()),
            smsOptOut: v.optional(v.boolean()),
            assignedTo: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.patch(args.contactId, {
            ...args.updates,
            updatedAt: now,
        });
        return true;
    },
});
export const deleteContact = mutation({
    args: { contactId: v.id("contacts") },
    handler: async (ctx, args) => {
        // Soft delete: set deletedAt
        const now = Date.now();
        await ctx.db.patch(args.contactId, { updatedAt: now, deletedAt: now });
        return true;
    },
});
