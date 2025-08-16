import { z } from "zod";

import type {
  TriggerDefinition,
  TriggerSetupContext,
  TriggerTeardownContext,
} from "../../../packages/integration-sdk/src/node-types.js";

/**
 * External Node Triggers Template
 *
 * This file defines all triggers (webhooks/events) that this service can send.
 * Triggers respond to events in the external service and start workflow scenarios.
 */

// =====================================================
// TRIGGER 1: Resource Created (Webhook)
// =====================================================

const ResourceCreatedOutputSchema = z.object({
  resourceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  createdBy: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ResourceCreatedTrigger: TriggerDefinition = {
  id: "resource_created",
  name: "Resource Created",
  description: "Triggered when a new resource is created in the service",
  outputSchema: ResourceCreatedOutputSchema,
  type: "webhook", // This trigger uses webhooks

  async setup(context: TriggerSetupContext): Promise<void> {
    const connection = context.connection;

    if (!connection) {
      throw new Error("Connection is required for webhook setup");
    }

    if (!context.webhookUrl) {
      throw new Error("Webhook URL is required for webhook setup");
    }

    try {
      // Register webhook with the external service
      const response = await fetch(`${connection.baseUrl}/api/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${connection.apiKey}`,
        },
        body: JSON.stringify({
          url: context.webhookUrl,
          events: ["resource.created"],
          name: `Integration Webhook - ${context.triggerId}`,
          description: "Webhook for resource creation events",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to register webhook: ${response.status} ${response.statusText} - ${errorData}`,
        );
      }

      const webhookData = await response.json();

      // Store webhook ID for later cleanup (you might want to store this in your database)
      console.log(`Webhook registered successfully: ${webhookData.id}`);
    } catch (error) {
      console.error("Failed to setup resource created trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    const connection = context.connection;

    if (!connection) {
      console.warn("No connection available for webhook teardown");
      return;
    }

    try {
      // List webhooks to find the one we created
      const listResponse = await fetch(`${connection.baseUrl}/api/webhooks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${connection.apiKey}`,
        },
      });

      if (listResponse.ok) {
        const webhooks = await listResponse.json();

        // Find our webhook by trigger ID or URL pattern
        const ourWebhook = webhooks.find(
          (wh: any) => wh.name && wh.name.includes(context.triggerId),
        );

        if (ourWebhook) {
          // Delete the webhook
          const deleteResponse = await fetch(
            `${connection.baseUrl}/api/webhooks/${ourWebhook.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${connection.apiKey}`,
              },
            },
          );

          if (!deleteResponse.ok) {
            console.warn(
              `Failed to delete webhook ${ourWebhook.id}: ${deleteResponse.statusText}`,
            );
          } else {
            console.log(`Webhook ${ourWebhook.id} deleted successfully`);
          }
        }
      }
    } catch (error) {
      console.error("Error during webhook teardown:", error);
      // Don't throw - teardown should be best effort
    }
  },

  ui: {
    category: "Events",
    featured: true,
    examples: [
      {
        name: "Basic Resource Creation",
        description: "Trigger when any resource is created",
        settings: {},
      },
    ],
    documentation: {
      description:
        "This trigger fires whenever a new resource is created in the connected service",
      setup:
        "A webhook will be automatically registered with your service when you activate this trigger",
      notes: [
        "Requires webhook support from the external service",
        "Webhook will be automatically removed when trigger is disabled",
        "Events are delivered in real-time",
      ],
    },
  },
};

// =====================================================
// TRIGGER 2: Resource Updated (Webhook)
// =====================================================

const ResourceUpdatedOutputSchema = z.object({
  resourceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  updatedAt: z.string(),
  updatedBy: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  changes: z
    .record(
      z.object({
        from: z.unknown(),
        to: z.unknown(),
      }),
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ResourceUpdatedTrigger: TriggerDefinition = {
  id: "resource_updated",
  name: "Resource Updated",
  description: "Triggered when a resource is updated in the service",
  outputSchema: ResourceUpdatedOutputSchema,
  type: "webhook",

  async setup(context: TriggerSetupContext): Promise<void> {
    const connection = context.connection;

    if (!connection || !context.webhookUrl) {
      throw new Error("Connection and webhook URL are required");
    }

    try {
      const response = await fetch(`${connection.baseUrl}/api/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${connection.apiKey}`,
        },
        body: JSON.stringify({
          url: context.webhookUrl,
          events: ["resource.updated"],
          name: `Integration Webhook Update - ${context.triggerId}`,
          description: "Webhook for resource update events",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to register update webhook: ${response.statusText}`,
        );
      }

      console.log("Resource update webhook registered successfully");
    } catch (error) {
      console.error("Failed to setup resource updated trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    // Similar teardown logic as above
    const connection = context.connection;

    if (!connection) return;

    try {
      const listResponse = await fetch(`${connection.baseUrl}/api/webhooks`, {
        headers: { Authorization: `Bearer ${connection.apiKey}` },
      });

      if (listResponse.ok) {
        const webhooks = await listResponse.json();
        const ourWebhook = webhooks.find(
          (wh: any) =>
            wh.name && wh.name.includes(`Update - ${context.triggerId}`),
        );

        if (ourWebhook) {
          await fetch(`${connection.baseUrl}/api/webhooks/${ourWebhook.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${connection.apiKey}` },
          });
        }
      }
    } catch (error) {
      console.error("Error during update webhook teardown:", error);
    }
  },

  ui: {
    category: "Events",
    documentation: {
      description:
        "This trigger fires whenever a resource is updated in the connected service",
      notes: [
        "Includes information about what fields were changed",
        "Only fires for actual data changes, not metadata updates",
      ],
    },
  },
};

// =====================================================
// TRIGGER 3: Periodic Sync (Polling)
// =====================================================

const PeriodicSyncOutputSchema = z.object({
  syncedAt: z.string(),
  newResources: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.string(),
    }),
  ),
  updatedResources: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      updatedAt: z.string(),
    }),
  ),
  summary: z.object({
    newCount: z.number(),
    updatedCount: z.number(),
  }),
});

const PeriodicSyncSettingsSchema = z.object({
  includeUpdated: z.boolean().default(true),
  resourceTypes: z.array(z.string()).optional(),
});

export const PeriodicSyncTrigger: TriggerDefinition = {
  id: "periodic_sync",
  name: "Periodic Sync",
  description: "Periodically check for new or updated resources",
  outputSchema: PeriodicSyncOutputSchema,
  settingsSchema: PeriodicSyncSettingsSchema,
  type: "polling",
  pollInterval: 5 * 60 * 1000, // 5 minutes in milliseconds

  async setup(context: TriggerSetupContext): Promise<void> {
    // For polling triggers, setup is usually just validation
    const connection = context.connection;

    if (!connection) {
      throw new Error("Connection is required for periodic sync");
    }

    // Test the connection
    try {
      const testResponse = await fetch(
        `${connection.baseUrl}/api/resources?limit=1`,
        {
          headers: { Authorization: `Bearer ${connection.apiKey}` },
        },
      );

      if (!testResponse.ok) {
        throw new Error(`Connection test failed: ${testResponse.statusText}`);
      }

      console.log("Periodic sync trigger setup completed");
    } catch (error) {
      console.error("Failed to setup periodic sync trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    // For polling triggers, teardown is usually just cleanup
    console.log("Periodic sync trigger teardown completed");
  },

  ui: {
    category: "Sync",
    examples: [
      {
        name: "Sync All Resources",
        description: "Check for new and updated resources every 5 minutes",
        settings: {
          includeUpdated: true,
        },
      },
      {
        name: "Sync Specific Types",
        description: "Only sync specific resource types",
        settings: {
          includeUpdated: true,
          resourceTypes: ["documents", "projects"],
        },
      },
    ],
    documentation: {
      description:
        "Regularly polls the service API to detect new or changed resources",
      setup: "No additional setup required - polling will start automatically",
      notes: [
        "Runs every 5 minutes by default",
        "Less real-time than webhooks but more reliable",
        "Good for services without webhook support",
      ],
    },
  },
};

// =====================================================
// EXPORT ALL TRIGGERS
// =====================================================

export const ServiceNameTriggers = {
  resource_created: ResourceCreatedTrigger,
  resource_updated: ResourceUpdatedTrigger,
  periodic_sync: PeriodicSyncTrigger,
  // Add more triggers as needed
};

// Default export for convenience
export default ServiceNameTriggers;
