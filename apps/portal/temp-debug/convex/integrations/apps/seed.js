import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { mutation } from "../../_generated/server";
/**
 * Seed the default apps into the database
 * This ensures essential integration apps exist in the database
 */
export const seedDefaultApps = mutation({
    args: {},
    returns: v.object({
        numCreated: v.number(),
        connectionsCreated: v.number(),
        connectionErrors: v.array(v.string()),
    }),
    handler: async (ctx) => {
        const now = Date.now();
        let numCreated = 0;
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
            numCreated++;
        }
        // Check if Vimeo app exists
        const vimeoApp = existingApps.find((app) => app.name.toLowerCase() === "vimeo");
        if (!vimeoApp) {
            await ctx.db.insert("apps", {
                name: "Vimeo",
                description: "Connect to Vimeo to sync videos and playlists.",
                authType: "apiKey",
                configTemplate: JSON.stringify({
                    apiKey: {
                        type: "string",
                        label: "Vimeo API Key",
                        required: true,
                        secret: true,
                    },
                    playlistIds: {
                        type: "string",
                        label: "Playlist IDs (comma separated)",
                        required: false,
                    },
                    categories: {
                        type: "string",
                        label: "Categories (comma separated)",
                        required: false,
                    },
                }),
                isEnabled: true,
                createdAt: now,
                updatedAt: now,
            });
            numCreated++;
        }
        // Check if Webhooks app exists
        const webhooksApp = existingApps.find((app) => app.name.toLowerCase() === "webhooks");
        if (!webhooksApp) {
            await ctx.db.insert("apps", {
                name: "Webhooks",
                description: "Send HTTP webhooks to external services when events occur.",
                authType: "none",
                isInternal: true,
                configTemplate: JSON.stringify({
                    webhookUrl: {
                        type: "string",
                        label: "Webhook URL",
                        required: true,
                        placeholder: "https://your-service.com/webhook",
                    },
                    secret: {
                        type: "string",
                        label: "Webhook Secret (Optional)",
                        required: false,
                        secret: true,
                        placeholder: "Used for signature verification",
                    },
                    headers: {
                        type: "json",
                        label: "Custom Headers (Optional)",
                        required: false,
                        placeholder: '{"Authorization": "Bearer token", "Content-Type": "application/json"}',
                    },
                    retryAttempts: {
                        type: "number",
                        label: "Retry Attempts",
                        required: false,
                        default: 3,
                        min: 0,
                        max: 5,
                    },
                    timeout: {
                        type: "number",
                        label: "Timeout (seconds)",
                        required: false,
                        default: 30,
                        min: 5,
                        max: 300,
                    },
                    actions: {
                        type: "json",
                        label: "Available Actions",
                        required: false,
                        readOnly: true,
                        default: {
                            "Send Webhook": {
                                id: "send_webhook",
                                description: "Send HTTP POST request to the configured webhook URL",
                                parameters: {
                                    payload: {
                                        type: "any",
                                        required: true,
                                        description: "Data to send in the webhook body",
                                    },
                                    eventType: {
                                        type: "string",
                                        required: false,
                                        description: "Event type for webhook categorization",
                                    },
                                    customHeaders: {
                                        type: "json",
                                        required: false,
                                        description: "Additional headers for this specific webhook",
                                    },
                                },
                                returns: {
                                    success: "boolean",
                                    statusCode: "number",
                                    response: "string",
                                    attempts: "number",
                                    error: "string (optional)",
                                },
                            },
                        },
                    },
                }),
                isEnabled: true,
                createdAt: now,
                updatedAt: now,
            });
            numCreated++;
        }
        // Check if TraderLaunchpad app exists
        const traderLaunchpadApp = existingApps.find((app) => app.name.toLowerCase() === "traderlaunchpad");
        if (!traderLaunchpadApp) {
            await ctx.db.insert("apps", {
                name: "TraderLaunchpad",
                description: "Portal integration for TraderLaunchpad with order triggers and actions.",
                authType: "internal",
                isInternal: true,
                configTemplate: JSON.stringify({
                    enabled: {
                        type: "boolean",
                        label: "Enable Integration",
                        required: true,
                        default: true,
                    },
                    triggers: {
                        type: "json",
                        label: "Available Triggers",
                        required: false,
                        readOnly: true,
                        default: {
                            "Order Created (Instant)": {
                                id: "order_created_instant",
                                description: "Triggered immediately when a new order is created",
                                instant: true,
                                enabled: true,
                                dataFormat: {
                                    orderId: "string",
                                    orderNumber: "string",
                                    customerId: "string",
                                    total: "number",
                                    status: "string",
                                    items: "array",
                                    timestamp: "number",
                                },
                            },
                        },
                    },
                    actions: {
                        type: "json",
                        label: "Available Actions",
                        required: false,
                        readOnly: true,
                        default: {
                            "Get Posts": {
                                id: "get_posts",
                                description: "Retrieve posts from the portal",
                                parameters: {
                                    limit: { type: "number", default: 10, max: 100 },
                                    status: {
                                        type: "string",
                                        default: "published",
                                        options: ["published", "draft", "all"],
                                    },
                                    category: { type: "string", optional: true },
                                },
                                returns: {
                                    posts: "array",
                                    total: "number",
                                    hasMore: "boolean",
                                },
                            },
                        },
                    },
                }),
                isEnabled: true,
                createdAt: now,
                updatedAt: now,
            });
            numCreated++;
        }
        // After creating apps, create default connections for internal apps
        const connectionResult = await ctx.runMutation(internal.integrations.connections.internalConnections
            .createDefaultInternalConnections, {});
        console.log(`Created ${connectionResult.connectionsCreated} internal connections`);
        if (connectionResult.errors.length > 0) {
            console.error("Connection creation errors:", connectionResult.errors);
        }
        return {
            numCreated,
            connectionsCreated: connectionResult.connectionsCreated,
            connectionErrors: connectionResult.errors,
        };
    },
});
