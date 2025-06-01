import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";

// List parsed results for a template
export const listByTemplate = query({
  args: {
    templateId: v.id("templates"),
  },
  returns: v.array(
    v.object({
      _id: v.id("parsedResults"),
      _creationTime: v.number(),
      templateId: v.id("templates"),
      emailId: v.id("emails"),
      userId: v.string(),
      result: v.string(),
      createdAt: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const { templateId } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      let resultsQuery = ctx.db
        .query("parsedResults")
        .withIndex("by_templateId", (q) => q.eq("templateId", templateId));

      // If authenticated, only show the user's parsed results
      if (userId) {
        resultsQuery = resultsQuery.filter((q) =>
          q.eq(q.field("userId"), userId),
        );
      }

      // Get all parsed results for the template, newest first
      const results = await resultsQuery.order("desc").collect();
      return results;
    } catch (error) {
      console.error("Error in list parsed results by template:", error);
      throw error;
    }
  },
});

// List parsed results for an email
export const listByEmail = query({
  args: {
    emailId: v.id("emails"),
  },
  returns: v.array(
    v.object({
      _id: v.id("parsedResults"),
      _creationTime: v.number(),
      templateId: v.id("templates"),
      emailId: v.id("emails"),
      userId: v.string(),
      result: v.string(),
      createdAt: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const { emailId } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      // Get the email to check permissions
      const email = await ctx.db.get(emailId);

      // If email doesn't exist, return empty array
      if (!email) {
        return [];
      }

      // If authenticated, ensure the email belongs to the user
      if (userId && email.userId && email.userId !== userId) {
        return [];
      }

      // Get all parsed results for the email, newest first
      const results = await ctx.db
        .query("parsedResults")
        .withIndex("by_emailId", (q) => q.eq("emailId", emailId))
        .order("desc")
        .collect();

      return results;
    } catch (error) {
      console.error("Error in list parsed results by email:", error);
      throw error;
    }
  },
});

// List parsed results by status
export const listByStatus = query({
  args: {
    status: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("parsedResults"),
      _creationTime: v.number(),
      templateId: v.id("templates"),
      emailId: v.id("emails"),
      userId: v.string(),
      result: v.string(),
      createdAt: v.number(),
      status: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const { status } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      let resultsQuery = ctx.db
        .query("parsedResults")
        .withIndex("by_status", (q) => q.eq("status", status));

      // If authenticated, only show the user's parsed results
      if (userId) {
        resultsQuery = resultsQuery.filter((q) =>
          q.eq(q.field("userId"), userId),
        );
      }

      // Get all parsed results with the specified status, newest first
      const results = await resultsQuery.order("desc").collect();
      return results;
    } catch (error) {
      console.error("Error in list parsed results by status:", error);
      throw error;
    }
  },
});

// Get a single parsed result by ID
export const get = query({
  args: {
    id: v.id("parsedResults"),
  },
  returns: v.union(
    v.object({
      _id: v.id("parsedResults"),
      _creationTime: v.number(),
      templateId: v.id("templates"),
      emailId: v.id("emails"),
      userId: v.string(),
      result: v.string(),
      createdAt: v.number(),
      status: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      // Get the parsed result by ID
      const parsedResult = await ctx.db.get(id);

      // If parsed result doesn't exist, return null
      if (!parsedResult) {
        return null;
      }

      // If authenticated, ensure the parsed result belongs to the user
      if (userId && parsedResult.userId !== userId) {
        return null;
      }

      return parsedResult;
    } catch (error) {
      console.error("Error in get parsed result:", error);
      throw error;
    }
  },
});

// Create a new parsed result
export const create = mutation({
  args: {
    templateId: v.id("templates"),
    emailId: v.id("emails"),
    result: v.string(),
    status: v.optional(v.string()),
  },
  returns: v.id("parsedResults"),
  handler: async (ctx, args) => {
    try {
      const { templateId, emailId, result, status = "completed" } = args;

      // Require authentication for creating parsed results
      const userId = await requireUser(ctx);

      // Check if the template exists
      const template = await ctx.db.get(templateId);
      if (!template) {
        throw new ConvexError(`Template with ID ${templateId} not found`);
      }

      // Check if the email exists
      const email = await ctx.db.get(emailId);
      if (!email) {
        throw new ConvexError(`Email with ID ${emailId} not found`);
      }

      // Verify the result is a valid JSON string
      try {
        JSON.parse(result);
      } catch {
        // Handle JSON parse error
        throw new ConvexError("Result must be a valid JSON string");
      }

      const now = Date.now();

      // Insert the new parsed result
      const parsedResultId = await ctx.db.insert("parsedResults", {
        templateId,
        emailId,
        userId,
        result,
        createdAt: now,
        status,
      });

      return parsedResultId;
    } catch (error) {
      console.error("Error in create parsed result:", error);
      throw error;
    }
  },
});

// Update an existing parsed result
export const update = mutation({
  args: {
    id: v.id("parsedResults"),
    result: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("parsedResults"),
  handler: async (ctx, args) => {
    try {
      const { id, ...updates } = args;

      // Require authentication for updating parsed results
      const userId = await requireUser(ctx);

      // Get the current parsed result
      const parsedResult = await ctx.db.get(id);

      if (!parsedResult) {
        throw new ConvexError(`Parsed result with ID ${id} not found`);
      }

      // Ensure the parsed result belongs to the user
      if (parsedResult.userId !== userId) {
        throw new ConvexError(
          "You don't have permission to update this parsed result",
        );
      }

      // If updating the result, verify it's a valid JSON string
      if (updates.result) {
        try {
          JSON.parse(updates.result);
        } catch {
          // Handle JSON parse error
          throw new ConvexError("Result must be a valid JSON string");
        }
      }

      // Update the parsed result with new values
      await ctx.db.patch(id, updates);

      return id;
    } catch (error) {
      console.error("Error in update parsed result:", error);
      throw error;
    }
  },
});

// Delete a parsed result
export const remove = mutation({
  args: {
    id: v.id("parsedResults"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Require authentication for deleting parsed results
      const userId = await requireUser(ctx);

      // Get the parsed result to check if it exists
      const parsedResult = await ctx.db.get(id);

      if (!parsedResult) {
        throw new ConvexError(`Parsed result with ID ${id} not found`);
      }

      // Ensure the parsed result belongs to the user
      if (parsedResult.userId !== userId) {
        throw new ConvexError(
          "You don't have permission to delete this parsed result",
        );
      }

      // Delete the parsed result
      await ctx.db.delete(id);

      return true;
    } catch (error) {
      console.error("Error in delete parsed result:", error);
      throw error;
    }
  },
});

// Start parsing an email (sets status to "processing")
export const startParsing = mutation({
  args: {
    templateId: v.id("templates"),
    emailId: v.id("emails"),
  },
  returns: v.id("parsedResults"),
  handler: async (ctx, args) => {
    try {
      const { templateId, emailId } = args;

      // Require authentication for creating parsed results
      const userId = await requireUser(ctx);

      // Check if the template exists
      const template = await ctx.db.get(templateId);
      if (!template) {
        throw new ConvexError(`Template with ID ${templateId} not found`);
      }

      // Check if the email exists
      const email = await ctx.db.get(emailId);
      if (!email) {
        throw new ConvexError(`Email with ID ${emailId} not found`);
      }

      const now = Date.now();

      // Insert a new parsed result with "processing" status
      const parsedResultId = await ctx.db.insert("parsedResults", {
        templateId,
        emailId,
        userId,
        result: "{}",
        createdAt: now,
        status: "processing",
      });

      return parsedResultId;
    } catch (error) {
      console.error("Error in start parsing:", error);
      throw error;
    }
  },
});
