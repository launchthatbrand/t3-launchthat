import { action, internalAction } from "../../_generated/server";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { z } from "zod";

// Zod helpers to avoid unsafe-assignments from unknown/any
const ScenarioIdZ = z.string() as unknown as z.ZodType<Id<"scenarios">>;
const NodeIdZ = z.string() as unknown as z.ZodType<Id<"nodes">>;
const RunIdZ = z.string() as unknown as z.ZodType<Id<"scenarioRuns">>;

const ScenariosListSchema = z.array(z.object({ _id: ScenarioIdZ }));
const NodesListSchema = z.array(
  z.object({ _id: NodeIdZ, config: z.string(), type: z.string() }),
);

const WebhookResultSchema = z.object({
  success: z.boolean(),
  statusCode: z.number().optional(),
  statusText: z.string().optional(),
  responseHeaders: z.record(z.string()).optional(),
  responseBody: z.string().optional(),
  error: z.string().optional(),
});

const TriggerCallResultSchema = z.object({
  success: z.boolean(),
  webhooksSent: z.number(),
  errors: z.array(z.string()),
});

/**
 * Trigger webhooks for order created event
 * This is called internally when a new order is created
 */
export const triggerOrderCreated = internalAction({
  args: {
    orderId: v.id("orders"),
    orderData: v.any(), // The complete order object
  },
  returns: v.object({
    success: v.boolean(),
    webhooksSent: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let webhooksSent = 0;
    const errors: string[] = [];

    try {
      // Get all active scenarios that have order created triggers
      const scenarios = ScenariosListSchema.parse(
        await ctx.runQuery(internal.integrations.scenarios.queries.list, {
          status: "active",
        }),
      );

      for (const scenario of scenarios) {
        let runId: Id<"scenarioRuns"> | null = null;
        const startTime = Date.now();
        try {
          // Create a scenario run
          runId = RunIdZ.parse(
            await ctx.runMutation(
              internal.integrations.scenarioRuns.mutations.createScenarioRun,
              {
                scenarioId: scenario._id,
                triggerKey: "orders.created",
                correlationId: `${args.orderId}:${startTime}`,
              },
            ),
          );

          if (!runId) {
            errors.push("Failed to create scenario run");
            continue;
          }

          // Log scenario start
          await ctx.runMutation(
            internal.integrations.scenarioLogs.mutations.logScenarioStart,
            {
              scenarioId: scenario._id,
              runId,
              metadata: JSON.stringify({ orderId: args.orderId }),
            },
          );

          // Get nodes for this scenario
          const nodes = NodesListSchema.parse(
            await ctx.runQuery(
              internal.integrations.nodes.queries.listByScenario,
              {
                scenarioId: scenario._id,
              },
            ),
          );

          // Find trigger nodes for order created events
          const triggerNodes = nodes.filter(
            (node: { _id: Id<"nodes">; config: string; type: string }) => {
              try {
                const config = JSON.parse(node.config) as {
                  triggerType?: string;
                  enabled?: boolean;
                };
                return (
                  node.type === "traderlaunchpad_trigger" &&
                  config.triggerType === "orderCreated" &&
                  config.enabled !== false
                );
              } catch {
                return false;
              }
            },
          );

          if (triggerNodes.length === 0) {
            // Complete run as cancelled when no matching triggers
            await ctx.runMutation(
              internal.integrations.scenarioRuns.mutations.completeScenarioRun,
              { runId, status: "cancelled" },
            );
            continue;
          }

          // Find webhook action nodes in the same scenario
          const webhookNodes = nodes.filter(
            (node: { _id: Id<"nodes">; config: string; type: string }) => {
              try {
                const config = JSON.parse(node.config) as { enabled?: boolean };
                return (
                  node.type === "webhook_action" && config.enabled !== false
                );
              } catch {
                return false;
              }
            },
          );

          // Execute webhook for each webhook node
          for (const webhookNode of webhookNodes) {
            const nodeStart = Date.now();
            try {
              const webhookConfig = JSON.parse(webhookNode.config) as {
                webhookUrl: string;
                connectionId?: string;
                secret?: string;
                headers?: Record<string, string>;
                retryAttempts?: number;
                timeout?: number;
                method?: string;
                rateLimit?: {
                  limit: number;
                  windowMs: number;
                };
              };

              // Prepare webhook payload
              const payload = {
                event: "order.created",
                timestamp: Date.now(),
                data: {
                  order: args.orderData,
                  orderId: args.orderId,
                },
                source: "traderlaunchpad",
                version: "1.0",
              } as const;

              let result;

              // Use secure connection-based webhook if connectionId is provided
              if (webhookConfig.connectionId) {
                result = WebhookResultSchema.parse(
                  await ctx.runAction(
                    internal.integrations.actions.webhooks
                      .sendWebhookWithConnection,
                    {
                      connectionId: webhookConfig.connectionId,
                      webhookUrl: webhookConfig.webhookUrl,
                      payload,
                      eventType: "order.created",
                      retryAttempts: webhookConfig.retryAttempts ?? 3,
                      timeout: webhookConfig.timeout ?? 30_000,
                      rateLimit: webhookConfig.rateLimit,
                    },
                  ),
                );
              } else {
                // Fallback to legacy webhook sending
                result = WebhookResultSchema.parse(
                  await ctx.runAction(
                    internal.integrations.actions.webhooks.sendWebhook,
                    {
                      webhookUrl: webhookConfig.webhookUrl,
                      payload,
                      secret: webhookConfig.secret,
                      headers: webhookConfig.headers,
                      retryAttempts: webhookConfig.retryAttempts ?? 3,
                      timeout: webhookConfig.timeout ?? 30_000,
                      eventType: "order.created",
                    },
                  ),
                );
              }

              // Log node execution
              const responseInfo = result.statusCode
                ? {
                    statusCode: result.statusCode,
                    statusText: result.statusText ?? "",
                    headers: (result.responseHeaders ?? undefined) as
                      | Record<string, string>
                      | undefined,
                  }
                : undefined;

              await ctx.runMutation(
                internal.integrations.scenarioLogs.mutations.logNodeExecution,
                {
                  scenarioId: scenario._id,
                  runId,
                  nodeId: webhookNode._id,
                  action: "send_webhook",
                  status: result.success ? "success" : "error",
                  startTime: nodeStart,
                  endTime: Date.now(),
                  inputData: JSON.stringify(payload),
                  outputData: result.responseBody,
                  errorMessage: result.error,
                  requestInfo: {
                    endpoint: webhookConfig.webhookUrl,
                    method: webhookConfig.method ?? "POST",
                    headers: webhookConfig.headers,
                  },
                  responseInfo,
                },
              );

              if (result.success) {
                webhooksSent++;
              } else {
                errors.push(
                  `Webhook failed for node ${webhookNode._id}: ${result.error}`,
                );
              }
            } catch (error) {
              await ctx.runMutation(
                internal.integrations.scenarioLogs.mutations.logNodeExecution,
                {
                  scenarioId: scenario._id,
                  runId,
                  nodeId: webhookNode._id,
                  action: "send_webhook",
                  status: "error",
                  startTime: nodeStart,
                  endTime: Date.now(),
                  errorMessage:
                    error instanceof Error ? error.message : String(error),
                },
              );
              errors.push(
                `Error processing webhook node ${webhookNode._id}: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }

          // Complete the run
          await ctx.runMutation(
            internal.integrations.scenarioRuns.mutations.completeScenarioRun,
            { runId, status: errors.length ? "failed" : "succeeded" },
          );

          // Log scenario completion
          await ctx.runMutation(
            internal.integrations.scenarioLogs.mutations.logScenarioComplete,
            {
              scenarioId: scenario._id,
              runId,
              status: errors.length ? "error" : "success",
              startTime,
              errorMessage: errors.length ? errors.join("; ") : undefined,
            },
          );
        } catch (error) {
          // Ensure run completion on fatal error
          if (runId) {
            await ctx.runMutation(
              internal.integrations.scenarioRuns.mutations.completeScenarioRun,
              { runId, status: "failed" },
            );
          }
          errors.push(
            `Error processing scenario ${scenario._id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      return {
        success: errors.length === 0,
        webhooksSent,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        webhooksSent: 0,
        errors: [
          `Fatal error in triggerOrderCreated: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  },
});

/**
 * Test the order created trigger
 * This is a public action for testing webhook functionality
 */
export const testOrderCreatedTrigger = action({
  args: {
    mockOrderData: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
    webhooksSent: v.number(),
    errors: v.array(v.string()),
    testData: v.any(),
  }),
  handler: async (ctx, args) => {
    // Create mock order data for testing
    // Use a fake but valid Convex ID format for testing
    const fakeOrderId = "k178dbn46jr6y62hp38a28amt97mmys3" as Id<"orders">;
    const mockOrder =
      args.mockOrderData ??
      ({
        _id: fakeOrderId,
        orderId: "ORD-TEST-001",
        email: "test@example.com",
        customerInfo: {
          firstName: "Test",
          lastName: "Customer",
          phone: "+1234567890",
        },
        items: [
          {
            productId: "test_product_id",
            productSnapshot: {
              name: "Test Product",
              description: "A test product for webhook testing",
              price: 29.99,
            },
            quantity: 1,
            lineTotal: 29.99,
          },
        ],
        subtotal: 29.99,
        tax: 2.4,
        shipping: 5.99,
        total: 38.38,
        paymentMethod: "credit_card",
        paymentStatus: "pending",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as const);

    const result = TriggerCallResultSchema.parse(
      await ctx.runAction(
        internal.integrations.triggers.orderEvents.triggerOrderCreated,
        {
          orderId: fakeOrderId,
          orderData: mockOrder,
        },
      ),
    );

    return {
      ...result,
      testData: mockOrder,
    };
  },
});
