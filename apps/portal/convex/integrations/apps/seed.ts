import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Seed the default apps into the database
 * This ensures essential integration apps exist in the database
 */
export const seedDefaultApps = mutation({
  args: {},
  returns: v.object({ numCreated: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    let numCreated = 0;

    // Check if WordPress app exists
    const existingApps = await ctx.db.query("apps").collect();
    const wordpressApp = existingApps.find(
      (app) => app.name.toLowerCase() === "wordpress",
    );

    // If WordPress app doesn't exist, create it
    if (!wordpressApp) {
      await ctx.db.insert("apps", {
        name: "WordPress",
        description:
          "Connect to WordPress sites to import posts, users, and more.",
        authType: "apiKey",
        configTemplate: JSON.stringify({
          siteUrl: { type: "string", label: "Site URL", required: true },
          apiUsername: {
            type: "string",
            label: "API Username",
            required: true,
          },
          apiKey: {
            type: "string",
            label: "API Key",
            required: true,
            secret: true,
          },
        }),
        isEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
      numCreated++;
    }

    return { numCreated };
  },
});
