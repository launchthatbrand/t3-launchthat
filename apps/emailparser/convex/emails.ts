import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { ACTIONS, hasPermission, RESOURCE_TYPES } from "./permissions";

// Get all emails for the current user
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("emails"),
      subject: v.string(),
      sender: v.string(),
      receivedAt: v.number(),
      content: v.string(),
      userId: v.optional(v.string()),
      labels: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    // List emails owned by the user and shared with the user
    const userEmails = await ctx.db
      .query("emails")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Get emails shared with this user
    const sharedEmails = await ctx.db
      .query("sharedResources")
      .withIndex("by_resourceType_sharedWithUserId", (q) =>
        q
          .eq("resourceType", RESOURCE_TYPES.EMAIL)
          .eq("sharedWithUserId", userId),
      )
      .collect();

    // Get the actual email documents for shared emails
    const sharedEmailDocs = await Promise.all(
      sharedEmails.map(async (share) => {
        const email = await ctx.db.get(share.resourceId as Id<"emails">);
        return email;
      }),
    );

    // Filter out any null values and combine with user's own emails
    const filteredSharedEmails = sharedEmailDocs.filter(
      (email): email is NonNullable<typeof email> => email !== null,
    );

    return [...userEmails, ...filteredSharedEmails];
  },
});

// Get a single email by ID
export const get = query({
  args: { id: v.id("emails") },
  returns: v.union(
    v.object({
      _id: v.id("emails"),
      subject: v.string(),
      sender: v.string(),
      receivedAt: v.number(),
      content: v.string(),
      userId: v.optional(v.string()),
      labels: v.optional(v.array(v.string())),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const email = await ctx.db.get(args.id);

    if (!email) {
      return null;
    }

    // If this is the user's own email, return it
    if (email.userId === userId) {
      return email;
    }

    // Check if user has read permission on this email
    const hasReadPermission = await hasPermission(
      ctx,
      RESOURCE_TYPES.EMAIL,
      ACTIONS.READ,
      args.id,
    );

    if (!hasReadPermission) {
      throw new ConvexError("You don't have permission to view this email");
    }

    return email;
  },
});

// Create a new email
export const create = mutation({
  args: {
    subject: v.string(),
    sender: v.string(),
    receivedAt: v.optional(v.number()),
    content: v.string(),
    labels: v.optional(v.array(v.string())),
  },
  returns: v.id("emails"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { subject, sender, content, labels } = args;
    const receivedAt = args.receivedAt || Date.now();

    // Check input validations
    if (subject.trim() === "") {
      throw new ConvexError("Subject cannot be empty");
    }

    if (sender.trim() === "") {
      throw new ConvexError("Sender cannot be empty");
    }

    if (content.trim() === "") {
      throw new ConvexError("Content cannot be empty");
    }

    // Create the email
    const emailId = await ctx.db.insert("emails", {
      subject,
      sender,
      receivedAt,
      content,
      userId,
      labels,
    });

    return emailId;
  },
});

// Update an existing email
export const update = mutation({
  args: {
    id: v.id("emails"),
    subject: v.optional(v.string()),
    sender: v.optional(v.string()),
    content: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
  },
  returns: v.id("emails"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { id, ...updates } = args;

    // Check if email exists
    const email = await ctx.db.get(id);
    if (!email) {
      throw new ConvexError("Email not found");
    }

    // Check ownership or permissions
    if (email.userId !== userId) {
      // Check if user has update permission on this email
      const hasUpdatePermission = await hasPermission(
        ctx,
        RESOURCE_TYPES.EMAIL,
        ACTIONS.UPDATE,
        id,
      );

      if (!hasUpdatePermission) {
        throw new ConvexError("You don't have permission to update this email");
      }
    }

    // Input validations
    if (updates.subject !== undefined && updates.subject.trim() === "") {
      throw new ConvexError("Subject cannot be empty");
    }

    if (updates.sender !== undefined && updates.sender.trim() === "") {
      throw new ConvexError("Sender cannot be empty");
    }

    if (updates.content !== undefined && updates.content.trim() === "") {
      throw new ConvexError("Content cannot be empty");
    }

    // Update the email
    await ctx.db.patch(id, updates);

    return id;
  },
});

// Delete an email
export const remove = mutation({
  args: { id: v.id("emails") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Check if email exists
    const email = await ctx.db.get(args.id);
    if (!email) {
      throw new ConvexError("Email not found");
    }

    // Check ownership or permissions
    if (email.userId !== userId) {
      // Check if user has delete permission on this email
      const hasDeletePermission = await hasPermission(
        ctx,
        RESOURCE_TYPES.EMAIL,
        ACTIONS.DELETE,
        args.id,
      );

      if (!hasDeletePermission) {
        throw new ConvexError("You don't have permission to delete this email");
      }
    }

    // Delete associated resources
    // First, find all field values associated with this email
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_emailId", (q) => q.eq("emailId", args.id))
      .collect();

    // Delete each field
    for (const field of fields) {
      await ctx.db.delete(field._id);
    }

    // Find all highlights associated with this email
    const highlights = await ctx.db
      .query("highlights")
      .withIndex("by_emailId", (q) => q.eq("emailId", args.id))
      .collect();

    // Delete each highlight
    for (const highlight of highlights) {
      await ctx.db.delete(highlight._id);
    }

    // Find all parsedResults associated with this email
    const parsedResults = await ctx.db
      .query("parsedResults")
      .withIndex("by_emailId", (q) => q.eq("emailId", args.id))
      .collect();

    // Delete each parsedResult
    for (const result of parsedResults) {
      await ctx.db.delete(result._id);
    }

    // Find all shares associated with this email
    const shares = await ctx.db
      .query("sharedResources")
      .withIndex("by_resourceType_resourceId", (q) =>
        q.eq("resourceType", RESOURCE_TYPES.EMAIL).eq("resourceId", args.id),
      )
      .collect();

    // Delete each share
    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    // Delete the email
    await ctx.db.delete(args.id);

    return true;
  },
});

// Search emails by subject
export const search = query({
  args: {
    query: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("emails"),
      subject: v.string(),
      sender: v.string(),
      receivedAt: v.number(),
      content: v.string(),
      userId: v.optional(v.string()),
      labels: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { query } = args;

    if (query.trim() === "") {
      return [];
    }

    // Search emails owned by the user
    const userEmails = await ctx.db
      .query("emails")
      .withSearchIndex("search_subject", (q) =>
        q.search("subject", query).eq("userId", userId),
      )
      .collect();

    // Find all emails shared with the user
    const sharedEmails = await ctx.db
      .query("sharedResources")
      .withIndex("by_resourceType_sharedWithUserId", (q) =>
        q
          .eq("resourceType", RESOURCE_TYPES.EMAIL)
          .eq("sharedWithUserId", userId),
      )
      .collect();

    const sharedEmailIds = sharedEmails.map((share) => share.resourceId);

    // Search among shared emails
    const matchingSharedEmails = [];
    for (const emailId of sharedEmailIds) {
      const email = await ctx.db.get(emailId as Id<"emails">);
      if (email && email.subject.toLowerCase().includes(query.toLowerCase())) {
        matchingSharedEmails.push(email);
      }
    }

    return [...userEmails, ...matchingSharedEmails];
  },
});

// Get paginated emails for the current user
export const paginatedList = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.object({
    emails: v.array(
      v.object({
        _id: v.id("emails"),
        subject: v.string(),
        sender: v.string(),
        receivedAt: v.number(),
        content: v.string(),
        userId: v.optional(v.string()),
        labels: v.optional(v.array(v.string())),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { paginationOpts, sortDirection = "desc" } = args;

    // Paginate through emails owned by the user
    let emailsQuery = ctx.db
      .query("emails")
      .withIndex("by_userId", (q) => q.eq("userId", userId));

    // Apply sorting by receivedAt
    emailsQuery =
      sortDirection === "desc"
        ? emailsQuery.order("desc")
        : emailsQuery.order("asc");

    const paginatedResults = await emailsQuery.paginate(paginationOpts);

    // Get the user's own emails
    const userEmails = paginatedResults.page;

    // If we have fewer emails than requested and haven't reached the end,
    // also fetch shared emails (this is a simplified approach - in a real app
    // you might want to have a more sophisticated pagination strategy)
    if (
      userEmails.length < paginationOpts.numItems &&
      !paginatedResults.isDone
    ) {
      return paginatedResults;
    }

    // If we've reached the end of user's own emails, also check for shared emails
    if (paginatedResults.isDone) {
      // Get emails shared with this user
      const sharedEmails = await ctx.db
        .query("sharedResources")
        .withIndex("by_resourceType_sharedWithUserId", (q) =>
          q
            .eq("resourceType", RESOURCE_TYPES.EMAIL)
            .eq("sharedWithUserId", userId),
        )
        .collect();

      // Get the actual email documents for shared emails
      const sharedEmailDocs = await Promise.all(
        sharedEmails.map(async (share) => {
          const email = await ctx.db.get(share.resourceId as Id<"emails">);
          return email;
        }),
      );

      // Filter out any null values
      const filteredSharedEmails = sharedEmailDocs.filter(
        (email): email is NonNullable<typeof email> => email !== null,
      );

      // Sort shared emails by receivedAt based on sortDirection
      const sortedSharedEmails = filteredSharedEmails.sort((a, b) => {
        return sortDirection === "desc"
          ? b.receivedAt - a.receivedAt
          : a.receivedAt - b.receivedAt;
      });

      // Add shared emails to the results
      return {
        emails: [...userEmails, ...sortedSharedEmails],
        isDone: true,
        continueCursor: null,
      };
    }

    return {
      emails: userEmails,
      isDone: paginatedResults.isDone,
      continueCursor: paginatedResults.continueCursor,
    };
  },
});
