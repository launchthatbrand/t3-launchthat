/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unsafe-argument
*/

import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";

const crmQueries = components.launchthat_crm.queries as any;
const crmContactsQueries = components.launchthat_crm.contacts.queries as any;
const crmContactsMutations = components.launchthat_crm.contacts.mutations as any;
const crmMarketingTagsQueries = components.launchthat_crm.marketingTags.queries as any;

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  let viewer =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new Error("Unauthorized");
  if (!viewer.isAdmin) throw new Error("Forbidden");
  return viewer;
};

const contactValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  slug: v.string(),
  status: v.string(),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featuredImageUrl: v.optional(v.string()),
  postTypeSlug: v.string(),
  organizationId: v.optional(v.string()),
  authorId: v.optional(v.string()),
  userId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const contactMetaValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  contactId: v.string(),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const listContacts = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(contactValidator),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(crmContactsQueries.listContacts, {
      status: args.status,
      limit: args.limit,
    });
  },
});

export const getCrmDashboardMetrics = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    contacts: v.object({ total: v.number(), isTruncated: v.boolean() }),
    tags: v.object({ total: v.number(), isTruncated: v.boolean() }),
    tagAssignments: v.object({ total: v.number(), isTruncated: v.boolean() }),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(crmQueries.getCrmDashboardMetrics, {
      limit: args.limit,
    });
  },
});

export const getContactCoverage = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    totalUsers: v.number(),
    usersWithContacts: v.number(),
    isTruncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limitRaw = typeof args.limit === "number" ? args.limit : 5000;
    const limit = Math.max(100, Math.min(20000, Math.floor(limitRaw)));

    const users = await ctx.db.query("users").take(limit);
    const userIds = users.map((user) => String(user._id));

    const contacts = await ctx.runQuery(crmContactsQueries.listContacts, {
      limit,
    });
    const contactUserIds = new Set<string>();
    for (const contact of Array.isArray(contacts) ? contacts : []) {
      if (typeof contact?.userId === "string" && contact.userId.trim()) {
        contactUserIds.add(contact.userId.trim());
      }
    }

    const usersWithContacts = userIds.filter((id) =>
      contactUserIds.has(id),
    ).length;

    return {
      totalUsers: userIds.length,
      usersWithContacts,
      isTruncated: users.length >= limit || contacts.length >= limit,
    };
  },
});

export const getContact = query({
  args: {
    contactId: v.string(),
  },
  returns: v.union(v.null(), contactValidator),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(crmContactsQueries.getContactById, {
      contactId: args.contactId as any,
    });
  },
});

export const getContactMeta = query({
  args: {
    contactId: v.string(),
  },
  returns: v.array(contactMetaValidator),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(crmContactsQueries.getContactMeta, {
      contactId: args.contactId as any,
    });
  },
});

export const getUserContactSummary = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    contactId: v.union(v.string(), v.null()),
    tags: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        slug: v.optional(v.string()),
        color: v.optional(v.string()),
        category: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const contactId = await ctx.runQuery(
      crmMarketingTagsQueries.getContactIdForUser,
      { userId: args.userId },
    );
    if (!contactId) {
      return { contactId: null, tags: [] };
    }

    const rows = await ctx.runQuery(
      crmMarketingTagsQueries.getContactMarketingTags,
      { contactId },
    );

    const tags = (Array.isArray(rows) ? rows : []).map((row: any) => {
      const tag = row?.marketingTag ?? {};
      return {
        id: String(tag?._id ?? ""),
        name: String(tag?.name ?? "Tag"),
        slug: typeof tag?.slug === "string" ? tag.slug : undefined,
        color: typeof tag?.color === "string" ? tag.color : undefined,
        category: typeof tag?.category === "string" ? tag.category : undefined,
      };
    });

    return { contactId: String(contactId), tags };
  },
});

export const createContact = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    status: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImageUrl: v.optional(v.string()),
    authorId: v.optional(v.string()),
    userId: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  returns: v.object({ contactId: v.string() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const contactId = await ctx.runMutation(crmContactsMutations.createContact, {
      postTypeSlug: "contact",
      title: args.title,
      slug: args.slug,
      status: args.status,
      content: args.content,
      excerpt: args.excerpt,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImageUrl,
      authorId: args.authorId,
      userId: args.userId,
      meta: args.meta,
    });
    return { contactId: String(contactId) };
  },
});

export const updateContact = mutation({
  args: {
    contactId: v.string(),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featuredImageUrl: v.optional(v.string()),
    authorId: v.optional(v.string()),
    userId: v.optional(v.string()),
    meta: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(crmContactsMutations.updateContact, {
      contactId: args.contactId as any,
      title: args.title,
      slug: args.slug,
      status: args.status,
      content: args.content,
      excerpt: args.excerpt,
      category: args.category,
      tags: args.tags,
      featuredImageUrl: args.featuredImageUrl,
      authorId: args.authorId,
      userId: args.userId,
      meta: args.meta,
    });
    return null;
  },
});

export const deleteContact = mutation({
  args: {
    contactId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(crmContactsMutations.deleteContact, {
      contactId: args.contactId as any,
    });
    return null;
  },
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const importMissingContacts = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({ imported: v.number() }),
  handler: async (ctx, args) => {
    const viewer = await requirePlatformAdmin(ctx);
    const limitRaw = typeof args.limit === "number" ? args.limit : 5000;
    const limit = Math.max(100, Math.min(20000, Math.floor(limitRaw)));

    const users = await ctx.db.query("users").take(limit);
    const contacts = await ctx.runQuery(crmContactsQueries.listContacts, {
      limit,
    });
    const contactUserIds = new Set<string>();
    for (const contact of Array.isArray(contacts) ? contacts : []) {
      if (typeof contact?.userId === "string" && contact.userId.trim()) {
        contactUserIds.add(contact.userId.trim());
      }
    }

    let imported = 0;
    for (const user of users) {
      const userId = String(user._id);
      if (contactUserIds.has(userId)) continue;

      const email = typeof user.email === "string" ? user.email.trim() : "";
      const name = typeof user.name === "string" ? user.name.trim() : "";
      const title = name || email || "Contact";
      const slugBase = slugify(title) || "contact";
      const slug = `${slugBase}-${userId.slice(-6)}`;

      await ctx.runMutation(crmContactsMutations.createContact, {
        postTypeSlug: "contact",
        title,
        slug,
        status: "active",
        userId,
        authorId: String(viewer._id),
        meta: {
          "contact.firstName": name.split(" ")[0] ?? "",
          "contact.lastName": name.split(" ").slice(1).join(" "),
          "contact.email": email,
        },
      });

      imported += 1;
    }

    return { imported };
  },
});
