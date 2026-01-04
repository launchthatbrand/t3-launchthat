// import { v } from "convex/values";

// import { internal } from "../../_generated/api";
// import { internalAction } from "../../_generated/server";
// import { createError, ErrorCode } from "../lib/errors";
// import { createCorrelationId, createIdempotencyKey } from "../lib/idempotency";

// /**
//  * Main webhook handler that processes incoming webhooks and executes scenarios
//  * This is the main entry point for webhook-triggered scenario execution
//  */
// export const handleIncomingWebhook = internalAction({
//   args: {
//     triggerKey: v.string(),
//     payload: v.any(),
//     headers: v.any(),
//     connectionId: v.optional(v.id("connections")),
//     source: v.optional(v.string()), // e.g., "http_endpoint", "manual_trigger"
//   },
//   returns: v.object({
//     success: v.boolean(),
//     runIds: v.array(v.id("scenarioRuns")),
//     scenariosTriggered: v.number(),
//     idempotent: v.optional(v.boolean()),
//     error: v.optional(v.string()),
//   }),
//   handler: async (ctx, args) => {
//     try {
//       // Process the webhook with existing validation logic
//       const webhookResult = await ctx.runAction(
//         internal.integrations.actions.webhooks.processInboundWebhook,
//         {
//           triggerKey: args.triggerKey,
//           payload: args.payload,
//           headers: args.headers,
//           connectionId: args.connectionId,
//         },
//       );

//       if (!webhookResult.success) {
//         return {
//           success: false,
//           runIds: [],
//           scenariosTriggered: 0,
//           error: webhookResult.error || "Webhook processing failed",
//         };
//       }

//       // If this was an idempotent request, return early
//       if (webhookResult.idempotent) {
//         return {
//           success: true,
//           runIds: webhookResult.runId ? [webhookResult.runId] : [],
//           scenariosTriggered: 1,
//           idempotent: true,
//         };
//       }

//       // Find all scenarios that should be triggered by this webhook
//       const matchingScenarios = await ctx.runQuery(
//         internal.integrations.scenarios.queries.findByTriggerKey,
//         { triggerKey: args.triggerKey },
//       );

//       if (matchingScenarios.length === 0) {
//         return {
//           success: false,
//           runIds: [],
//           scenariosTriggered: 0,
//           error: `No active scenarios found for trigger key: ${args.triggerKey}`,
//         };
//       }

//       // Execute each matching scenario
//       const runIds: any[] = [];
//       const executionPromises: Promise<any>[] = [];

//       for (const scenario of matchingScenarios) {
//         try {
//           // Create a correlation ID for this execution
//           const correlationId = createCorrelationId(
//             args.triggerKey,
//             scenario._id,
//             args.source || "webhook",
//           );

//           // Create a scenario run
//           const runId = await ctx.runMutation(
//             internal.integrations.scenarioRuns.mutations.createScenarioRun,
//             {
//               scenarioId: scenario._id,
//               triggerKey: args.triggerKey,
//               connectionId: args.connectionId,
//               correlationId,
//               payload: args.payload,
//             },
//           );

//           runIds.push(runId);

//           // Schedule scenario execution (async)
//           const executionPromise = ctx.runAction(
//             internal.integrations.lib.scenarioExecution.executeScenario,
//             {
//               scenarioId: scenario._id,
//               runId,
//               payload: args.payload,
//               correlationId,
//               triggerKey: args.triggerKey,
//             },
//           );

//           executionPromises.push(executionPromise);
//         } catch (error) {
//           console.error(
//             `Failed to create run for scenario ${scenario._id}:`,
//             error,
//           );
//           // Continue with other scenarios
//         }
//       }

//       // Wait for all executions to complete (or at least start)
//       // In a production system, you might want to run these truly async
//       // and just return the run IDs immediately
//       try {
//         await Promise.allSettled(executionPromises);
//       } catch (error) {
//         console.error("Some scenario executions failed:", error);
//         // Don't fail the entire webhook if some scenarios fail
//       }

//       return {
//         success: true,
//         runIds,
//         scenariosTriggered: matchingScenarios.length,
//         idempotent: false,
//       };
//     } catch (error) {
//       console.error("Webhook handling error:", error);
//       return {
//         success: false,
//         runIds: [],
//         scenariosTriggered: 0,
//         error: error instanceof Error ? error.message : "Unknown error",
//       };
//     }
//   },
// });

// /**
//  * Manual trigger for testing scenarios without webhooks
//  */
// export const triggerScenarioManually = internalAction({
//   args: {
//     scenarioId: v.id("scenarios"),
//     payload: v.any(),
//     userId: v.optional(v.id("users")),
//     connectionId: v.optional(v.id("connections")),
//   },
//   returns: v.object({
//     success: v.boolean(),
//     runId: v.optional(v.id("scenarioRuns")),
//     executionResult: v.optional(v.any()),
//     error: v.optional(v.string()),
//   }),
//   handler: async (ctx, args) => {
//     try {
//       // Get the scenario to validate it exists and is enabled
//       const scenario = await ctx.runQuery(
//         internal.integrations.scenarios.queries.getById,
//         { id: args.scenarioId },
//       );

//       if (!scenario) {
//         return {
//           success: false,
//           error: `Scenario ${args.scenarioId} not found`,
//         };
//       }

//       if (!scenario.enabled) {
//         return {
//           success: false,
//           error: `Scenario ${args.scenarioId} is disabled`,
//         };
//       }

//       // Create correlation ID for manual trigger
//       const correlationId = createCorrelationId(
//         "manual_trigger",
//         args.scenarioId,
//         args.userId ? `user_${args.userId}` : "anonymous",
//       );

//       // Create a scenario run
//       const runId = await ctx.runMutation(
//         internal.integrations.scenarioRuns.mutations.createScenarioRun,
//         {
//           scenarioId: args.scenarioId,
//           triggerKey: "manual_trigger",
//           connectionId: args.connectionId,
//           correlationId,
//           payload: args.payload,
//         },
//       );

//       // Execute the scenario
//       const executionResult = await ctx.runAction(
//         internal.integrations.lib.scenarioExecution.executeScenario,
//         {
//           scenarioId: args.scenarioId,
//           runId,
//           payload: args.payload,
//           correlationId,
//           triggerKey: "manual_trigger",
//         },
//       );

//       return {
//         success: true,
//         runId,
//         executionResult,
//       };
//     } catch (error) {
//       console.error("Manual trigger error:", error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Unknown error",
//       };
//     }
//   },
// });

// /**
//  * Batch trigger multiple scenarios for testing
//  */
// export const batchTriggerScenarios = internalAction({
//   args: {
//     scenarioIds: v.array(v.id("scenarios")),
//     payload: v.any(),
//     userId: v.optional(v.id("users")),
//   },
//   returns: v.object({
//     success: v.boolean(),
//     results: v.array(v.any()),
//     totalTriggered: v.number(),
//     successCount: v.number(),
//     errorCount: v.number(),
//   }),
//   handler: async (ctx, args) => {
//     const results: any[] = [];
//     let successCount = 0;
//     let errorCount = 0;

//     for (const scenarioId of args.scenarioIds) {
//       try {
//         const result = await ctx.runAction(
//           internal.integrations.webhooks.handler.triggerScenarioManually,
//           {
//             scenarioId,
//             payload: args.payload,
//             userId: args.userId,
//           },
//         );

//         results.push({
//           scenarioId,
//           ...result,
//         });

//         if (result.success) {
//           successCount++;
//         } else {
//           errorCount++;
//         }
//       } catch (error) {
//         results.push({
//           scenarioId,
//           success: false,
//           error: error instanceof Error ? error.message : "Unknown error",
//         });
//         errorCount++;
//       }
//     }

//     return {
//       success: successCount > 0,
//       results,
//       totalTriggered: args.scenarioIds.length,
//       successCount,
//       errorCount,
//     };
//   },
// });
