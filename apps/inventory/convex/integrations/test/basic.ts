import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";

/**
 * Simple test query to verify integrations module registration
 */
export const testQuery = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return "Integrations module test query successful!";
  },
});

/**
 * Simple test mutation to verify integrations module registration
 */
export const testMutation = mutation({
  args: {
    name: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return `Hello, ${args.name} from integrations module!`;
  },
});
