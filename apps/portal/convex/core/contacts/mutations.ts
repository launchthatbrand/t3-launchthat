import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";

type ContactDoc = Doc<"contacts">;

const upsertArgs = {
  organizationId: v.id("organizations"),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  fullName: v.optional(v.string()),
  company: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  metadata: v.optional(v.any()),
};

const normalizeNames = (input: typeof upsertArgs) => {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const fullName =
    input.fullName?.trim() ??
    ([firstName, lastName].filter(Boolean).join(" ").trim() || undefined);
  return { firstName, lastName, fullName };
};

export const upsert = mutation({
  args: upsertArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const now = Date.now();
    const email = args.email?.trim().toLowerCase();

    const names = normalizeNames(args);

    let existing: ContactDoc | null = null;
    if (email) {
      existing = (await ctx.db
        .query("contacts")
        .withIndex("by_org_email", (q) =>
          q.eq("organizationId", args.organizationId).eq("email", email),
        )
        .first()) as ContactDoc | null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: existing.email ?? email,
        phone: args.phone ?? existing.phone,
        firstName: names.firstName ?? existing.firstName,
        lastName: names.lastName ?? existing.lastName,
        fullName: names.fullName ?? existing.fullName,
        company: args.company ?? existing.company,
        tags: args.tags ?? existing.tags,
        metadata: args.metadata ?? existing.metadata,
        updatedAt: now,
        updatedBy: userId,
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      organizationId: args.organizationId,
      email,
      phone: args.phone,
      firstName: names.firstName,
      lastName: names.lastName,
      fullName: names.fullName,
      company: args.company,
      tags: args.tags,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    contactId: v.id("contacts"),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    company: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const names = normalizeNames(args);

    await ctx.db.patch(args.contactId, {
      email: args.email?.trim().toLowerCase() ?? contact.email,
      phone: args.phone ?? contact.phone,
      firstName: names.firstName ?? contact.firstName,
      lastName: names.lastName ?? contact.lastName,
      fullName: names.fullName ?? contact.fullName,
      company: args.company ?? contact.company,
      tags: args.tags ?? contact.tags,
      metadata: args.metadata ?? contact.metadata,
      updatedAt: Date.now(),
      updatedBy: userId,
    });
    return args.contactId;
  },
});

export const remove = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contactId);
    return true;
  },
});
