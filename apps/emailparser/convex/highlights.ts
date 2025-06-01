import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getUser, requireUser } from "./auth";

// List highlights for an email
export const listByEmail = query({
  args: {
    emailId: v.id("emails"),
  },
  returns: v.array(
    v.object({
      _id: v.id("highlights"),
      _creationTime: v.number(),
      emailId: v.id("emails"),
      fieldId: v.id("fields"),
      text: v.string(),
      start: v.number(),
      end: v.number(),
      userId: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
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

      // Get highlights for the specified email
      const highlights = await ctx.db
        .query("highlights")
        .withIndex("by_emailId", (q) => q.eq("emailId", emailId))
        .collect();

      return highlights;
    } catch (error) {
      console.error("Error in list highlights by email:", error);
      throw error;
    }
  },
});

// List highlights for a field
export const listByField = query({
  args: {
    fieldId: v.id("fields"),
  },
  returns: v.array(
    v.object({
      _id: v.id("highlights"),
      _creationTime: v.number(),
      emailId: v.id("emails"),
      fieldId: v.id("fields"),
      text: v.string(),
      start: v.number(),
      end: v.number(),
      userId: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      const { fieldId } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      // Get highlights for the specified field
      let highlights = await ctx.db
        .query("highlights")
        .withIndex("by_fieldId", (q) => q.eq("fieldId", fieldId))
        .collect();

      // If authenticated, filter to only show highlights belonging to the user
      if (userId) {
        highlights = highlights.filter(
          (highlight) => highlight.userId === userId,
        );
      }

      return highlights;
    } catch (error) {
      console.error("Error in list highlights by field:", error);
      throw error;
    }
  },
});

// Get a single highlight by ID
export const get = query({
  args: {
    id: v.id("highlights"),
  },
  returns: v.union(
    v.object({
      _id: v.id("highlights"),
      _creationTime: v.number(),
      emailId: v.id("emails"),
      fieldId: v.id("fields"),
      text: v.string(),
      start: v.number(),
      end: v.number(),
      userId: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Get the authenticated user's ID (allow unauthenticated for development)
      const userId = await getUser(ctx, true);

      // Get the highlight by ID
      const highlight = await ctx.db.get(id);

      // If highlight doesn't exist, return null
      if (!highlight) {
        return null;
      }

      // If authenticated, ensure the highlight belongs to the user
      if (userId && highlight.userId !== userId) {
        return null;
      }

      return highlight;
    } catch (error) {
      console.error("Error in get highlight:", error);
      throw error;
    }
  },
});

// Create a new highlight
export const create = mutation({
  args: {
    emailId: v.id("emails"),
    fieldId: v.id("fields"),
    text: v.string(),
    start: v.number(),
    end: v.number(),
  },
  returns: v.id("highlights"),
  handler: async (ctx, args) => {
    try {
      const { emailId, fieldId, text, start, end } = args;

      // Require authentication for creating highlights
      const userId = await requireUser(ctx);

      // Validate start and end positions
      if (start < 0) {
        throw new ConvexError("Start position cannot be negative");
      }

      if (end <= start) {
        throw new ConvexError(
          "End position must be greater than start position",
        );
      }

      // Check if the email exists
      const email = await ctx.db.get(emailId);
      if (!email) {
        throw new ConvexError(`Email with ID ${emailId} not found`);
      }

      // Check if the field exists
      const field = await ctx.db.get(fieldId);
      if (!field) {
        throw new ConvexError(`Field with ID ${fieldId} not found`);
      }

      // Ensure the text is within the bounds of the email content
      if (end > email.content.length) {
        throw new ConvexError(
          "Highlight position is outside the bounds of the email content",
        );
      }

      // Ensure the highlighted text matches the text at the specified position
      const textAtPosition = email.content.substring(start, end);
      if (textAtPosition !== text) {
        throw new ConvexError(
          "Highlighted text does not match the text at the specified position",
        );
      }

      const now = Date.now();

      // Insert the new highlight
      const highlightId = await ctx.db.insert("highlights", {
        emailId,
        fieldId,
        text,
        start,
        end,
        userId,
        createdAt: now,
      });

      return highlightId;
    } catch (error) {
      console.error("Error in create highlight:", error);
      throw error;
    }
  },
});

// Update an existing highlight
export const update = mutation({
  args: {
    id: v.id("highlights"),
    fieldId: v.optional(v.id("fields")),
    text: v.optional(v.string()),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
  },
  returns: v.id("highlights"),
  handler: async (ctx, args) => {
    try {
      const { id, ...updates } = args;

      // Require authentication for updating highlights
      const userId = await requireUser(ctx);

      // Get the current highlight
      const highlight = await ctx.db.get(id);

      if (!highlight) {
        throw new ConvexError(`Highlight with ID ${id} not found`);
      }

      // Ensure the highlight belongs to the user
      if (highlight.userId !== userId) {
        throw new ConvexError(
          "You don't have permission to update this highlight",
        );
      }

      // If updating start or end positions, need to validate
      if (
        (updates.start !== undefined || updates.end !== undefined) &&
        updates.text !== undefined
      ) {
        const start = updates.start ?? highlight.start;
        const end = updates.end ?? highlight.end;
        const text = updates.text;

        // Validate start and end positions
        if (start < 0) {
          throw new ConvexError("Start position cannot be negative");
        }

        if (end <= start) {
          throw new ConvexError(
            "End position must be greater than start position",
          );
        }

        // Get the email to validate the text
        const email = await ctx.db.get(highlight.emailId);
        if (!email) {
          throw new ConvexError(`Email with ID ${highlight.emailId} not found`);
        }

        // Ensure the highlighted text matches the text at the specified position
        const textAtPosition = email.content.substring(start, end);
        if (textAtPosition !== text) {
          throw new ConvexError(
            "Highlighted text does not match the text at the specified position",
          );
        }
      }

      // Update the highlight with new values
      await ctx.db.patch(id, {
        ...updates,
        updatedAt: Date.now(),
      });

      return id;
    } catch (error) {
      console.error("Error in update highlight:", error);
      throw error;
    }
  },
});

// Delete a highlight
export const remove = mutation({
  args: {
    id: v.id("highlights"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Require authentication for deleting highlights
      const userId = await requireUser(ctx);

      // Get the highlight to check if it exists
      const highlight = await ctx.db.get(id);

      if (!highlight) {
        throw new ConvexError(`Highlight with ID ${id} not found`);
      }

      // Ensure the highlight belongs to the user
      if (highlight.userId !== userId) {
        throw new ConvexError(
          "You don't have permission to delete this highlight",
        );
      }

      // Delete the highlight
      await ctx.db.delete(id);

      return true;
    } catch (error) {
      console.error("Error in delete highlight:", error);
      throw error;
    }
  },
});
