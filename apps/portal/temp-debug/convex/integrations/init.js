import { v } from "convex/values";
import { mutation } from "../_generated/server";
/**
 * Initialize the integrations system
 * This ensures all required data and configurations exist
 */
export const initialize = mutation({
    args: {},
    returns: v.object({
        success: v.boolean(),
        appsCreated: v.number(),
        message: v.string(),
    }),
    handler: async (ctx) => {
        const now = Date.now();
        let appsCreated = 0;
        try {
            // Check if WordPress app exists
            const existingApps = await ctx.db.query("apps").collect();
            const wordpressApp = existingApps.find((app) => app.name.toLowerCase() === "wordpress");
            // If WordPress app doesn't exist, create it
            if (!wordpressApp) {
                await ctx.db.insert("apps", {
                    name: "WordPress",
                    description: "Connect to WordPress sites to import posts, users, and more.",
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
                appsCreated++;
            }
            return {
                success: true,
                appsCreated,
                message: `Integrations system initialized successfully. Created ${appsCreated} apps.`,
            };
        }
        catch (error) {
            return {
                success: false,
                appsCreated,
                message: `Error initializing integrations system: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
});
