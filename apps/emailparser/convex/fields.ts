import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

// List fields for a template
export const listByTemplate = query({
  args: {
    templateId: v.id("templates"),
  },
  returns: v.array(
    v.object({
      _id: v.id("fields"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      templateId: v.id("templates"),
      order: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const { templateId } = args;

    // Get fields for the specified template, sorted by order
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
      .order("asc")
      .collect();

    return fields;
  },
});

// Get a single field by ID
export const get = query({
  args: {
    id: v.id("fields"),
  },
  returns: v.union(
    v.object({
      _id: v.id("fields"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      templateId: v.id("templates"),
      order: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      const { id } = args;

      // Get the field by ID
      const field = await ctx.db.get(id);

      // Return null if the field doesn't exist
      if (!field) {
        return null;
      }

      return field;
    } catch (error) {
      console.error("Error in get field:", error);
      throw error;
    }
  },
});

// Create a new field
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    templateId: v.id("templates"),
    order: v.optional(v.number()),
  },
  returns: v.id("fields"),
  handler: async (ctx, args) => {
    const { name, description, templateId } = args;

    // If order is not provided, place the new field at the end
    let { order } = args;
    if (order === undefined) {
      // Count existing fields to determine the next order value
      const existingFields = await ctx.db
        .query("fields")
        .withIndex("by_templateId", (q) => q.eq("templateId", templateId))
        .collect();

      order = existingFields.length;
    }

    // Insert the new field
    const fieldId = await ctx.db.insert("fields", {
      name,
      description,
      templateId,
      order,
    });

    return fieldId;
  },
});

// Update an existing field
export const update = mutation({
  args: {
    id: v.id("fields"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.id("fields"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get the current field
    const field = await ctx.db.get(id);

    if (!field) {
      throw new ConvexError(`Field with ID ${id} not found`);
    }

    // Update the field with new values
    await ctx.db.patch(id, updates);

    return id;
  },
});

// Delete a field
export const remove = mutation({
  args: {
    id: v.id("fields"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { id } = args;

    // Get the field to check if it exists and to get the templateId
    const field = await ctx.db.get(id);

    if (!field) {
      throw new ConvexError(`Field with ID ${id} not found`);
    }

    // Delete the field
    await ctx.db.delete(id);

    // Reorder remaining fields to maintain sequential order
    const remainingFields = await ctx.db
      .query("fields")
      .withIndex("by_templateId", (q) => q.eq("templateId", field.templateId))
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
