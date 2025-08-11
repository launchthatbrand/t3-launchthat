import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { action, internalAction } from "../../_generated/server";
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
        const errors = [];
        try {
            // Get all active scenarios that have order created triggers
            const scenarios = await ctx.runQuery(internal.integrations.scenarios.queries.list, {
                status: "active",
            });
            for (const scenario of scenarios) {
                try {
                    // Get nodes for this scenario
                    const nodes = await ctx.runQuery(internal.integrations.nodes.queries.listByScenario, {
                        scenarioId: scenario._id,
                    });
                    // Find trigger nodes for order created events
                    const triggerNodes = nodes.filter((node) => {
                        try {
                            const config = JSON.parse(node.config);
                            return (node.type === "traderlaunchpad_trigger" &&
                                config.triggerType === "orderCreated" &&
                                config.enabled !== false);
                        }
                        catch {
                            return false;
                        }
                    });
                    if (triggerNodes.length === 0)
                        continue;
                    // Find webhook action nodes in the same scenario
                    const webhookNodes = nodes.filter((node) => {
                        try {
                            const config = JSON.parse(node.config);
                            return node.type === "webhook_action" && config.enabled !== false;
                        }
                        catch {
                            return false;
                        }
                    });
                    // Execute webhook for each webhook node
                    for (const webhookNode of webhookNodes) {
                        try {
                            const webhookConfig = JSON.parse(webhookNode.config);
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
                            };
                            // Send webhook
                            const result = await ctx.runAction(internal.integrations.actions.webhooks.sendWebhook, {
                                webhookUrl: webhookConfig.webhookUrl,
                                payload,
                                secret: webhookConfig.secret,
                                headers: webhookConfig.headers,
                                retryAttempts: webhookConfig.retryAttempts || 3,
                                timeout: webhookConfig.timeout || 30,
                                eventType: "order.created",
                            });
                            if (result.success) {
                                webhooksSent++;
                            }
                            else {
                                errors.push(`Webhook failed for node ${webhookNode._id}: ${result.error}`);
                            }
                        }
                        catch (error) {
                            errors.push(`Error processing webhook node ${webhookNode._id}: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    }
                }
                catch (error) {
                    errors.push(`Error processing scenario ${scenario._id}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            return {
                success: errors.length === 0,
                webhooksSent,
                errors,
            };
        }
        catch (error) {
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
        const fakeOrderId = "k178dbn46jr6y62hp38a28amt97mmys3";
        const mockOrder = args.mockOrderData || {
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
        };
        const result = await ctx.runAction(internal.integrations.triggers.orderEvents.triggerOrderCreated, {
            orderId: fakeOrderId,
            orderData: mockOrder,
        });
        return {
            ...result,
            testData: mockOrder,
        };
    },
});
