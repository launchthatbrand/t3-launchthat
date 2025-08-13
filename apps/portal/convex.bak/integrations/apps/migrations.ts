import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Migration to add isInternal field to existing apps
 * This identifies apps that are built-in and don't require external connections
 */
export const migrateInternalApps = mutation({
  args: {},
  returns: v.object({
    appsUpdated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    let appsUpdated = 0;
    const errors: string[] = [];

    try {
      // Get all apps
      const allApps = await ctx.db.query("apps").collect();

      console.log(`Found ${allApps.length} apps to check for migration`);

      for (const app of allApps) {
        try {
          // Skip if app already has isInternal field
          if ("isInternal" in app && app.isInternal !== undefined) {
            continue;
          }

          // Determine if app should be internal based on authType
          const shouldBeInternal =
            app.authType === "internal" ||
            (app.authType === "none" && app.name === "Webhooks");

          await ctx.db.patch(app._id, {
            isInternal: shouldBeInternal,
          });

          console.log(`Updated ${app.name} - isInternal: ${shouldBeInternal}`);
          appsUpdated++;
        } catch (error) {
          const errorMessage = `Failed to update app ${app.name}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      return {
        appsUpdated,
        errors,
      };
    } catch (error) {
      const errorMessage = `Migration failed: ${error}`;
      console.error(errorMessage);
      return {
        appsUpdated,
        errors: [errorMessage],
      };
    }
  },
});

/**
 * Migration to update app configurations with new triggers and actions
 */
export const updateAppConfigurations = mutation({
  args: {},
  returns: v.object({
    appsUpdated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    let appsUpdated = 0;
    const errors: string[] = [];

    try {
      // Get all apps
      const allApps = await ctx.db.query("apps").collect();

      console.log(`Found ${allApps.length} apps to update configurations`);

      for (const app of allApps) {
        try {
          let newConfigTemplate: string | null = null;

          // Update TraderLaunchpad app configuration
          if (app.name === "TraderLaunchpad") {
            newConfigTemplate = JSON.stringify({
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
                    description:
                      "Triggered immediately when a new order is created",
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
            });
          }

          // Update Webhooks app configuration
          if (app.name === "Webhooks") {
            const currentConfig = JSON.parse(app.configTemplate);
            const newConfig = {
              ...currentConfig,
              actions: {
                type: "json",
                label: "Available Actions",
                required: false,
                readOnly: true,
                default: {
                  "Send Webhook": {
                    id: "send_webhook",
                    description:
                      "Send HTTP POST request to the configured webhook URL",
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
                        description:
                          "Additional headers for this specific webhook",
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
            };
            newConfigTemplate = JSON.stringify(newConfig);
          }

          // Apply the update if we have a new configuration
          if (newConfigTemplate) {
            await ctx.db.patch(app._id, {
              configTemplate: newConfigTemplate,
              updatedAt: Date.now(),
            });

            console.log(`Updated ${app.name} configuration`);
            appsUpdated++;
          }
        } catch (error) {
          const errorMessage = `Failed to update app configuration for ${app.name}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      return {
        appsUpdated,
        errors,
      };
    } catch (error) {
      const errorMessage = `Configuration update failed: ${error}`;
      console.error(errorMessage);
      return {
        appsUpdated,
        errors: [errorMessage],
      };
    }
  },
});
