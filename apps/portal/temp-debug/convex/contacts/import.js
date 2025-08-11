import { v } from "convex/values";
import { mutation } from "../_generated/server";
// Import multiple contacts at once
export const importContacts = mutation({
    args: {
        userId: v.id("users"),
        contacts: v.array(v.object({
            firstName: v.string(),
            lastName: v.string(),
            email: v.string(),
            phone: v.optional(v.string()),
            company: v.optional(v.string()),
            jobTitle: v.optional(v.string()),
            tags: v.optional(v.array(v.string())),
            customFields: v.optional(v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const results = {
            total: args.contacts.length,
            imported: 0,
            duplicates: 0,
            errors: 0,
            errorDetails: [],
        };
        for (const contactData of args.contacts) {
            try {
                // Check for duplicate email
                const existing = await ctx.db
                    .query("contacts")
                    .withIndex("by_email", (q) => q.eq("email", contactData.email))
                    .first();
                if (existing) {
                    results.duplicates++;
                    continue;
                }
                await ctx.db.insert("contacts", {
                    ...contactData,
                    createdBy: args.userId,
                    createdAt: now,
                    updatedAt: now,
                });
                results.imported++;
            }
            catch (error) {
                results.errors++;
                results.errorDetails.push(`Error importing ${contactData.email}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return results;
    },
});
