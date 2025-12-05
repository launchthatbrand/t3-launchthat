import type { Doc, Id } from "../../../_generated/dataModel";

import { crmOrganizationIdValidator } from "./schema";
import { paginationOptsValidator } from "convex/server";
import { query } from "../../../_generated/server";
import { v } from "convex/values";

type ContactDoc = Doc<"contacts">;

const publicContactShape = v.object({
  _creationTime: v.number(),
  _id: v.id("contacts"),
  organizationId: crmOrganizationIdValidator,
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  fullName: v.optional(v.string()),
  company: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: {
    organizationId: crmOrganizationIdValidator,
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(publicContactShape),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
    const all = (await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(limit)) as ContactDoc[];

    if (!args.search) {
      return all;
    }

    const term = args.search.toLowerCase();
    return all.filter((contact) => {
      const haystack = [
        contact.fullName,
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone,
        contact.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  },
});

export const get = query({
  args: {
    contactId: v.id("contacts"),
  },
  returns: v.union(publicContactShape, v.null()),
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.contactId)) as ContactDoc | null;
  },
});

export const findByEmail = query({
  args: {
    organizationId: crmOrganizationIdValidator,
    email: v.string(),
  },
  returns: v.union(publicContactShape, v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_org_email", (q) =>
        q.eq("organizationId", args.organizationId).eq("email", args.email),
      )
      .first();
    return (existing as ContactDoc | null) ?? null;
  },
});

// Get all contacts with pagination and filtering
export const getContacts = query({
  args: {
    userId: v.string(),
    filters: v.optional(
      v.object({
        customerType: v.optional(
          v.union(
            v.literal("lead"),
            v.literal("prospect"),
            v.literal("customer"),
            v.literal("former-customer"),
            v.literal("partner"),
          ),
        ),
        leadStatus: v.optional(
          v.union(
            v.literal("new"),
            v.literal("contacted"),
            v.literal("qualified"),
            v.literal("proposal"),
            v.literal("negotiation"),
            v.literal("won"),
            v.literal("lost"),
            v.literal("dormant"),
          ),
        ),
        tags: v.optional(v.array(v.string())),
      }),
    ),
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
        query = query.filter((q) =>
          q.eq(q.field("customerType" as any), filters.customerType),
        );
      }

      if (filters.leadStatus) {
        query = query.filter((q) =>
          q.eq(q.field("leadStatus" as any), filters.leadStatus),
        );
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
        if (!contact.tags) return false;
        return filters.tags?.some(
          (tag) =>
            contact.tags &&
            Array.isArray(contact.tags) &&
            contact.tags.includes(tag),
        );
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

        return (
          firstName.includes(searchTerm) ||
          lastName.includes(searchTerm) ||
          email.includes(searchTerm) ||
          company.includes(searchTerm) ||
          phone.includes(searchTerm)
        );
      });
    }

    return {
      contacts: filteredContacts,
      hasMore: !paginationResult.isDone,
      continueCursor: paginationResult.continueCursor,
    };
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
