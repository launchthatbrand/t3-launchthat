import { v } from "convex/values";

import { mutation } from "../_generated/server";

/**
 * Ensures a user with the given Monday.com email exists in the system
 * If the user doesn't exist, creates a new user account
 *
 * @param email The email address from Monday.com
 * @param mondayUserId The Monday.com user ID
 * @param name The user's name from Monday.com
 * @returns The user ID
 */
export const ensureMondayUser = mutation({
  args: {
    email: v.string(),
    mondayUserId: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, name, photoUrl } = args;
    // Rename mondayUserId to _mondayUserId to comply with unused var pattern
    const _mondayUserId = args.mondayUserId;

    // Check if a user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingUser) {
      // User exists, update the name and image if needed
      await ctx.db.patch(existingUser._id, {
        name: existingUser.name ?? name, // Keep existing name if present
        image: photoUrl ?? existingUser.image,
        // Add any extra metadata we want to store about the Monday user
        // in a separate table or as JSON string in a custom field
      });

      return existingUser._id;
    }

    // Create a new user
    const userId = await ctx.db.insert("users", {
      email,
      name,
      image: photoUrl ?? undefined,
      role: "user", // Default role
      // Store Monday-specific info in localStorage or a separate table
      // instead of adding custom fields to the users table
    });

    // Store additional Monday.com specific info in a separate table
    // if needed for complex data that doesn't fit the users schema

    return userId;
  },
});
