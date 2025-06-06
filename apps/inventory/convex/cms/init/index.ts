import { v } from "convex/values";

/**
 * CMS Initialization Module
 *
 * This module provides initialization functions for the CMS,
 * including creating built-in content types.
 */
import { mutation } from "../../_generated/server";
import { initializeBuiltInContentTypes } from "./builtInContentTypes";

/**
 * Initialize the CMS system with built-in content types
 */
export const initSystem = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log("Initializing CMS system...");

    // Initialize built-in content types
    await initializeBuiltInContentTypes(ctx);

    console.log("CMS system initialization complete");

    return "CMS system initialized successfully";
  },
});

/**
 * Reset and re-initialize the CMS system (for development only)
 * WARNING: This will delete all content types and their fields
 */
export const resetSystem = mutation({
  args: {
    confirmReset: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Require confirmation code
    if (args.confirmReset !== "RESET_CMS_SYSTEM") {
      throw new Error("Invalid confirmation code. Must be 'RESET_CMS_SYSTEM'");
    }

    console.log("Resetting CMS system...");

    // Get all content types
    const contentTypes = await ctx.db.query("contentTypes").collect();

    // Delete all content type fields
    for (const contentType of contentTypes) {
      const fields = await ctx.db
        .query("contentTypeFields")
        .withIndex("by_contentType", (q) =>
          q.eq("contentTypeId", contentType._id),
        )
        .collect();

      for (const field of fields) {
        await ctx.db.delete(field._id);
      }

      // Delete the content type
      await ctx.db.delete(contentType._id);
    }

    // Re-initialize built-in content types
    await initializeBuiltInContentTypes(ctx);

    console.log("CMS system reset complete");

    return "CMS system reset successfully";
  },
});
