import { ConvexError, v } from "convex/values";

import { query } from "./_generated/server";

// Helper function to get environment variables.
// Throws an error if the variable is not set.
const getEnvVariable = (name: string): string => {
  const value = process.env[name];
  if (value === undefined) {
    throw new ConvexError(`Environment variable ${name} is not set.`);
  }
  return value;
};

// Query to retrieve a specific environment variable.
// Use this in other queries/mutations if needed, though actions are more common.
export const get = query({
  args: { name: v.string() },
  handler: async (_, { name }) => {
    return getEnvVariable(name);
  },
});
