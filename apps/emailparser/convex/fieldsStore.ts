import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

/**
 * List all fields created by the current user
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("fieldsStore"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.string(),
      highlightId: v.id("highlightsStore"),
      order: v.number(),
    }),
  ),
  handler: async (ctx) => {
    try {
      const userId = await requireUser(ctx);

      // Get fields for the current user, sorted by order
      const fields = await ctx.db
        .query("fieldsStore")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("asc")
        .collect();

      return fields;
    } catch (error) {
      console.error("Error in list fields:", error);
      return []; // Return empty array on error
    }
  },
});

/**
 * Get a single field by ID
 */
export const get = query({
  args: {
    id: v.id("fieldsStore"),
  },
  returns: v.union(
    v.object({
      _id: v.id("fieldsStore"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.string(),
      highlightId: v.id("highlightsStore"),
      order: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await requireUser(ctx);
      const { id } = args;

      // Get the field by ID
      const field = await ctx.db.get(id);

      // Return null if the field doesn't exist or doesn't belong to the user
      if (!field || field.userId !== userId) {
        return null;
      }

      return field;
    } catch (error) {
      console.error("Error in get field:", error);
      return null; // Return null on error
    }
  },
});

/**
 * Create a new field
 */
export const create = mutation({
  args: {
    name: v.string(),
    highlightId: v.id("highlightsStore"),
  },
  returns: v.id("fieldsStore"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { name, highlightId } = args;

    // Validate the field name
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      throw new ConvexError(
        "Field name must start with a letter and contain only letters, numbers, and underscores",
      );
    }

    // Check if a field with this name already exists for this user
    const existingField = await ctx.db
      .query("fieldsStore")
      .withIndex("by_userId_name", (q) =>
        q.eq("userId", userId).eq("name", name),
      )
      .first();

    if (existingField) {
      throw new ConvexError(`Field name "${name}" already exists`);
    }

    // Verify the highlight exists and belongs to the user
    const highlight = await ctx.db.get(highlightId);
    if (!highlight) {
      throw new ConvexError(`Highlight with ID ${highlightId} not found`);
    }

    if (highlight.userId !== userId) {
      throw new ConvexError("You don't have permission to use this highlight");
    }

    // Get the next order value
    const existingFields = await ctx.db
      .query("fieldsStore")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const order = existingFields.length;

    // Insert the new field
    const fieldId = await ctx.db.insert("fieldsStore", {
      name,
      userId,
      highlightId,
      order,
    });

    // Update the highlight to link it to this field
    await ctx.db.patch(highlightId, { fieldId });

    return fieldId;
  },
});

/**
 * Update field order (for drag-and-drop reordering)
 */
export const updateOrder = mutation({
  args: {
    fields: v.array(
      v.object({
        id: v.id("fieldsStore"),
        order: v.number(),
      }),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { fields } = args;

    // Update each field's order
    for (const field of fields) {
      const existingField = await ctx.db.get(field.id);

      // Skip if field doesn't exist or doesn't belong to the user
      if (!existingField || existingField.userId !== userId) {
        continue;
      }

      await ctx.db.patch(field.id, { order: field.order });
    }

    return true;
  },
});

/**
 * Delete a field
 */
export const remove = mutation({
  args: {
    id: v.id("fieldsStore"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const { id } = args;

    // Get the field
    const field = await ctx.db.get(id);

    // Check if field exists and belongs to the user
    if (!field || field.userId !== userId) {
      throw new ConvexError(
        `Field not found or you don't have permission to delete it`,
      );
    }

    // Get the highlight to unlink it from this field
    try {
      const highlightId = field.highlightId;
      if (highlightId) {
        const highlight = await ctx.db.get(highlightId);
        if (highlight && highlight.fieldId) {
          // Remove the field reference from the highlight
          await ctx.db.patch(highlightId, { fieldId: undefined });
        }
      }
    } catch (error) {
      console.error("Error unlinking highlight:", error);
      // Continue with field deletion even if unlinking fails
    }

    // Delete the field
    await ctx.db.delete(id);

    // Reorder remaining fields to maintain sequential order
    const remainingFields = await ctx.db
      .query("fieldsStore")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();

    // Update order values to be sequential
    for (let i = 0; i < remainingFields.length; i++) {
      if (remainingFields[i].order !== i) {
        await ctx.db.patch(remainingFields[i]._id, { order: i });
      }
    }

    return true;
  },
});
