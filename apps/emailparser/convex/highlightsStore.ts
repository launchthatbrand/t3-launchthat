import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

/**
 * List all highlights for an email
 */
export const listByEmail = query({
  args: {
    emailId: v.id("emails"),
  },
  returns: v.array(
    v.object({
      _id: v.id("highlightsStore"),
      _creationTime: v.number(),
      emailId: v.id("emails"),
      text: v.string(),
      start: v.number(),
      end: v.number(),
      userId: v.string(),
      fieldId: v.optional(v.id("fieldsStore")),
      className: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await requireUser(ctx);
      const { emailId } = args;

      // Get the email to verify it exists and belongs to the user
      const email = await ctx.db.get(emailId);
      if (!email) {
        return [];
      }

      if (email.userId && email.userId !== userId) {
        return []; // Return empty array instead of throwing error
      }

      // Get highlights for the specified email
      const highlights = await ctx.db
        .query("highlightsStore")
        .withIndex("by_emailId", (q) => q.eq("emailId", emailId))
        .collect();

      return highlights;
    } catch (error) {
      console.error("Error in listByEmail:", error);
      return []; // Return empty array on error
    }
  },
});

/**
 * Create a new highlight
 */
export const create = mutation({
  args: {
    emailId: v.id("emails"),
    text: v.string(),
    start: v.number(),
    end: v.number(),
    className: v.optional(v.string()),
  },
  returns: v.id("highlightsStore"),
  handler: async (ctx, args) => {
    try {
      const userId = await requireUser(ctx);
      const { emailId, text, start, end, className } = args;

      // Validate start and end positions
      if (start < 0) {
        throw new ConvexError("Start position cannot be negative");
      }

      if (end <= start) {
        throw new ConvexError(
          "End position must be greater than start position",
        );
      }

      // Check if the email exists and belongs to the user
      const email = await ctx.db.get(emailId);
      if (!email) {
        throw new ConvexError(`Email with ID ${emailId} not found`);
      }

      if (email.userId && email.userId !== userId) {
        throw new ConvexError("You don't have permission to access this email");
      }

      // Check for overlapping highlights
      const existingHighlights = await ctx.db
        .query("highlightsStore")
        .withIndex("by_emailId", (q) => q.eq("emailId", emailId))
        .collect();

      const isOverlapping = existingHighlights.some(
        (h) =>
          (start < h.end && end > h.start) ||
          (start === h.start && end === h.end),
      );

      if (isOverlapping) {
        throw new ConvexError(
          "Highlights cannot overlap with existing highlights",
        );
      }

      // Create the highlight
      const highlightId = await ctx.db.insert("highlightsStore", {
        emailId,
        text,
        start,
        end,
        userId,
        className: className ?? "highlight-current",
      });

      return highlightId;
    } catch (error) {
      // If it's already a ConvexError, rethrow it
      if (error instanceof ConvexError) {
        throw error;
      }
      // Otherwise, wrap it in a new ConvexError
      console.error("Error creating highlight:", error);
      throw new ConvexError("Failed to create highlight");
    }
  },
});

/**
 * Update a highlight
 */
export const update = mutation({
  args: {
    id: v.id("highlightsStore"),
    className: v.optional(v.string()),
    fieldId: v.optional(v.id("fieldsStore")),
  },
  returns: v.id("highlightsStore"),
  handler: async (ctx, args) => {
    try {
      const userId = await requireUser(ctx);
      const { id, ...updates } = args;

      // Check if the highlight exists and belongs to the user
      const highlight = await ctx.db.get(id);
      if (!highlight) {
        throw new ConvexError(`Highlight with ID ${id} not found`);
      }

      if (highlight.userId !== userId) {
        throw new ConvexError(
          "You don't have permission to update this highlight",
        );
      }

      // Update the highlight
      await ctx.db.patch(id, updates);

      return id;
    } catch (error) {
      // If it's already a ConvexError, rethrow it
      if (error instanceof ConvexError) {
        throw error;
      }
      // Otherwise, wrap it in a new ConvexError
      console.error("Error updating highlight:", error);
      throw new ConvexError("Failed to update highlight");
    }
  },
});

/**
 * Remove a highlight
 */
export const remove = mutation({
  args: {
    id: v.id("highlightsStore"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const userId = await requireUser(ctx);
      const { id } = args;

      // Check if the highlight exists and belongs to the user
      const highlight = await ctx.db.get(id);
      if (!highlight) {
        throw new ConvexError(`Highlight with ID ${id} not found`);
      }

      if (highlight.userId !== userId) {
        throw new ConvexError(
          "You don't have permission to delete this highlight",
        );
      }

      // If the highlight is linked to a field, we need to delete the field too
      if (highlight.fieldId) {
        const field = await ctx.db.get(highlight.fieldId);
        if (field) {
          await ctx.db.delete(field._id);
        }
      }

      // Delete the highlight
      await ctx.db.delete(id);

      return true;
    } catch (error) {
      // If it's already a ConvexError, rethrow it
      if (error instanceof ConvexError) {
        throw error;
      }
      // Otherwise, wrap it in a new ConvexError
      console.error("Error removing highlight:", error);
      throw new ConvexError("Failed to remove highlight");
    }
  },
});
