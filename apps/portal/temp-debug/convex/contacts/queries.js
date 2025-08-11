import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
// Get a single contact by ID
export const getContact = query({
    args: { contactId: v.id("contacts") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.contactId);
    },
});
// Get all contacts with pagination and filtering
export const getContacts = query({
    args: {
        userId: v.string(),
        filters: v.optional(v.object({
            customerType: v.optional(v.union(v.literal("lead"), v.literal("prospect"), v.literal("customer"), v.literal("former-customer"), v.literal("partner"))),
            leadStatus: v.optional(v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("proposal"), v.literal("negotiation"), v.literal("won"), v.literal("lost"), v.literal("dormant"))),
            tags: v.optional(v.array(v.string())),
        })),
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const { userId, filters, search, paginationOpts } = args;
        // Start building the query
        let query = ctx.db
            .query("contacts")
            .withIndex("by_createdBy", (q) => q.eq("createdBy", userId));
        // Apply filters if they exist
        if (filters) {
            if (filters.customerType) {
                query = query.filter((q) => q.eq(q.field("customerType"), filters.customerType));
            }
            if (filters.leadStatus) {
                query = query.filter((q) => q.eq(q.field("leadStatus"), filters.leadStatus));
            }
        }
        // Get paginated results
        const paginationResult = await query.order("desc").paginate(paginationOpts);
        // Perform post-query filtering for search and tags
        // This is done client-side since Convex doesn't fully support these operations in queries
        let filteredContacts = paginationResult.page;
        // Filter by tags if specified
        if (filters?.tags && filters.tags.length > 0) {
            filteredContacts = filteredContacts.filter((contact) => {
                if (!contact.tags)
                    return false;
                return filters.tags?.some((tag) => contact.tags &&
                    Array.isArray(contact.tags) &&
                    contact.tags.includes(tag));
            });
        }
        // Filter by search term if specified
        if (search && search.trim() !== "") {
            const searchTerm = search.trim().toLowerCase();
            filteredContacts = filteredContacts.filter((contact) => {
                const firstName = String(contact.firstName).toLowerCase();
                const lastName = String(contact.lastName).toLowerCase();
                const email = String(contact.email).toLowerCase();
                const company = String(contact.company).toLowerCase();
                const phone = String(contact.phone).toLowerCase();
                return (firstName.includes(searchTerm) ||
                    lastName.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    company.includes(searchTerm) ||
                    phone.includes(searchTerm));
            });
        }
        return {
            contacts: filteredContacts,
            hasMore: !paginationResult.isDone,
            continueCursor: paginationResult.continueCursor,
        };
    },
});
// Get all unique tags for a user's contacts
export const getTags = query({
    args: {
        userId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { userId } = args;
        // If no userId is provided, return an empty array
        if (!userId) {
            return [];
        }
        // Get all contacts for this user
        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
            .collect();
        // Extract and deduplicate tags
        const tagsSet = new Set();
        contacts.forEach((contact) => {
            if (contact.tags && Array.isArray(contact.tags)) {
                contact.tags.forEach((tag) => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet).sort();
    },
});
// Export all contacts for a user
export const exportContacts = query({
    args: {
        userId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { userId } = args;
        // If no userId is provided, return an empty array
        if (!userId) {
            return [];
        }
        // Get all contacts for this user
        return await ctx.db
            .query("contacts")
            .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
            .collect();
    },
});
