import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

/**
 * Get a connection by ID
 */
export const get = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the ID is a valid connection ID
    let connectionId: Id<"connections">;
    try {
      connectionId = args.id as Id<"connections">;
    } catch (error) {
      console.error("Invalid connection ID:", error);
      return null;
    }

    const connection = await ctx.db.get(connectionId);
    return connection;
  },
});
