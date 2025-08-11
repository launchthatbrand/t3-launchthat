import { v } from "convex/values";
import { query } from "../_generated/server";
/**
 * Get a connection by ID
 */
export const get = query({
    args: {
        id: v.string(),
    },
    returns: v.any(),
    handler: async (ctx, args) => {
        // Check if the ID is a valid connection ID
        let connectionId;
        try {
            connectionId = args.id;
        }
        catch (error) {
            console.error("Invalid connection ID:", error);
            return null;
        }
        const connection = await ctx.db.get(connectionId);
        return connection;
    },
});
