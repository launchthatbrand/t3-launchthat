import { mutation } from "./_generated/server";

/**
 * Ensure the current authenticated user exists in Convex.
 * If the user doesn't exist, create a new record.
 */
export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("--- createOrGetUser CALLED ---");
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      console.log("No authenticated user found");
      return null;
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (existingUser) {
      console.log(`User ${existingUser._id} already exists`);

      // Check if name needs updating
      const newName = identity.name ?? "Anonymous User";

      // Only update name if different
      if (newName !== existingUser.name) {
        await ctx.db.patch(existingUser._id, { name: newName });
        console.log(`Updated user ${existingUser._id} with new name`);
      }

      return existingUser._id;
    }

    console.log(`Creating new user for ${identity.tokenIdentifier}`);

    // Create a new user
    try {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: identity.name ?? "Anonymous User",
        email: identity.email ?? "",
        // Only include image if it exists and is a string
        ...(identity.picture && typeof identity.picture === "string"
          ? { image: identity.picture }
          : {}),
      });

      console.log(`New user created with ID: ${userId}`);
      return userId;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  },
});

/**
 * Alias for createOrGetUser for backward compatibility
 */
export const ensureUser = createOrGetUser;
