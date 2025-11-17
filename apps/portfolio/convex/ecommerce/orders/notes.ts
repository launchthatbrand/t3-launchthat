import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";

/**
 * Add a note to an order
 */
export const addOrderNote = mutation({
  args: {
    orderId: v.id("orders"),
    content: v.string(),
    authorId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify the order exists
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // Create the new note
    const newNote = {
      id: Math.random().toString(36).substring(2, 15), // Generate unique ID
      content: args.content.trim(),
      authorId: args.authorId,
      authorName: args.authorName ?? "Admin",
      createdAt: Date.now(),
      isPrivate: args.isPrivate ?? false,
    };

    // Get existing notes or initialize empty array
    const existingNotes = order.orderNotes ?? [];

    // Add the new note to the beginning of the array (most recent first)
    const updatedNotes = [newNote, ...existingNotes];

    // Update the order with the new notes
    await ctx.db.patch(args.orderId, {
      orderNotes: updatedNotes,
      updatedAt: Date.now(),
    });

    return newNote;
  },
});

/**
 * Update an existing order note
 */
export const updateOrderNote = mutation({
  args: {
    orderId: v.id("orders"),
    noteId: v.string(),
    content: v.string(),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify the order exists
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // Get existing notes
    const existingNotes = order.orderNotes ?? [];

    // Find and update the note
    const updatedNotes = existingNotes.map((note) => {
      if (note.id === args.noteId) {
        return {
          ...note,
          content: args.content.trim(),
          isPrivate: args.isPrivate ?? note.isPrivate,
        };
      }
      return note;
    });

    // Check if note was found and updated
    const noteExists = existingNotes.some((note) => note.id === args.noteId);
    if (!noteExists) {
      throw new ConvexError({
        message: "Note not found",
        code: "NOTE_NOT_FOUND",
      });
    }

    // Update the order with the modified notes
    await ctx.db.patch(args.orderId, {
      orderNotes: updatedNotes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an order note
 */
export const deleteOrderNote = mutation({
  args: {
    orderId: v.id("orders"),
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the order exists
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // Get existing notes
    const existingNotes = order.orderNotes ?? [];

    // Remove the note
    const updatedNotes = existingNotes.filter(
      (note) => note.id !== args.noteId,
    );

    // Check if note was found and removed
    if (updatedNotes.length === existingNotes.length) {
      throw new ConvexError({
        message: "Note not found",
        code: "NOTE_NOT_FOUND",
      });
    }

    // Update the order with the filtered notes
    await ctx.db.patch(args.orderId, {
      orderNotes: updatedNotes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get order notes for a specific order
 */
export const getOrderNotes = query({
  args: {
    orderId: v.id("orders"),
    includePrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify the order exists
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // Get notes and filter based on privacy settings if requested
    const notes = order.orderNotes ?? [];

    if (args.includePrivate === false) {
      return notes.filter((note) => !note.isPrivate);
    }

    return notes;
  },
});
