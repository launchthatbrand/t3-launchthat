import { v } from "convex/values";

import { internalMutation, mutation } from "../../_generated/server";

/**
 * Seed integration nodes from code definitions
 * This function will be called to sync your code-defined nodes with the database
 */
export const seedIntegrationNodes = internalMutation({
  args: {
    nodes: v.array(
      v.object({
        identifier: v.string(),
        name: v.string(),
        category: v.string(),
        integrationType: v.string(),
        description: v.string(),
        inputSchema: v.string(),
        outputSchema: v.string(),
        configSchema: v.string(),
        uiConfig: v.optional(v.string()),
        version: v.string(),
        deprecated: v.optional(v.boolean()),
        tags: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const nodeDefinition of args.nodes) {
      try {
        // Check if node already exists
        const existing = await ctx.db
          .query("integrationNodes")
          .withIndex("by_identifier", (q) =>
            q.eq("identifier", nodeDefinition.identifier),
          )
          .first();

        const now = Date.now();

        if (existing) {
          // Update existing node if version is different
          if (existing.version !== nodeDefinition.version) {
            await ctx.db.patch(existing._id, {
              ...nodeDefinition,
              updatedAt: now,
            });
            results.updated++;
          }
        } else {
          // Create new node
          await ctx.db.insert("integrationNodes", {
            ...nodeDefinition,
            createdAt: now,
            updatedAt: now,
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push(
          `Failed to process ${nodeDefinition.identifier}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return results;
  },
});

/**
 * Public mutation to trigger seeding (for development)
 */
export const triggerSeeding = mutation({
  args: {},
  handler: async (ctx) => {
    // This would typically be called with actual node definitions
    // For now, return a message indicating where to add the logic
    return "Seeding should be triggered from your deployment process";
  },
});
