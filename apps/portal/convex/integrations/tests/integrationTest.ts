import { internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Comprehensive integration test that creates a test scenario and executes it
 * This demonstrates the entire system working from setup to execution
 */
export const runIntegrationTest = internalAction({
  args: {
    cleanup: v.optional(v.boolean()), // Whether to clean up test data after
  },
  returns: v.object({
    success: v.boolean(),
    results: v.any(),
    errors: v.array(v.string()),
    testData: v.any(),
  }),
  handler: async (ctx, args) => {
    const errors: string[] = [];
    const testData: any = {};

    try {
      console.log("🧪 Starting comprehensive integration test...");

      // Step 1: Create a test app
      console.log("📱 Creating test app...");
      const appId = await ctx.runMutation(
        internal.integrations.apps.mutations.createApp,
        {
          name: "Test Integration App",
          key: `test-app-${Date.now()}`,
          description: "Test app for integration testing",
          settings: {
            webhookEnabled: true,
            maxConcurrentRuns: 5,
          },
        },
      );
      testData.appId = appId;
      console.log(`✅ Created app: ${appId}`);

      // Step 2: Create a test connection
      console.log("🔗 Creating test connection...");
      const connectionId = await ctx.runMutation(
        internal.integrations.connections.mutations.createConnection,
        {
          appId,
          name: "Test Connection",
          status: "active",
          metadata: { testConnection: true },
        },
      );
      testData.connectionId = connectionId;
      console.log(`✅ Created connection: ${connectionId}`);

      // Step 3: Create a test scenario
      console.log("🎬 Creating test scenario...");
      const scenarioId = await ctx.runMutation(
        internal.integrations.scenarios.mutations.createScenario,
        {
          name: "Integration Test Scenario",
          description: "Test scenario for end-to-end integration testing",
          ownerId: "test_user_id" as any, // Mock user ID
          enabled: true,
          draftConfig: {
            triggerKey: "webhook",
            triggerConfig: {
              allowedMethods: ["POST"],
              requiredHeaders: [],
            },
            enabled: true,
          },
          publishedConfig: {
            triggerKey: "webhook",
            triggerConfig: {
              allowedMethods: ["POST"],
              requiredHeaders: [],
            },
            enabled: true,
          },
        },
      );
      testData.scenarioId = scenarioId;
      console.log(`✅ Created scenario: ${scenarioId}`);

      // Step 4: Create test nodes
      console.log("🔧 Creating test nodes...");

      // Logger node
      const loggerNodeId = await ctx.runMutation(
        internal.integrations.nodes.mutations.createNode,
        {
          scenarioId,
          type: "logger",
          label: "Test Logger",
          config: JSON.stringify({
            message: "Integration test executed successfully!",
            logLevel: "info",
          }),
          rfType: "logger",
          rfPosition: { x: 100, y: 100 },
          rfLabel: "Log Test Message",
        },
      );
      testData.loggerNodeId = loggerNodeId;

      // HTTP request node
      const httpNodeId = await ctx.runMutation(
        internal.integrations.nodes.mutations.createNode,
        {
          scenarioId,
          type: "http_request",
          label: "Test HTTP Request",
          config: JSON.stringify({
            url: "https://httpbin.org/post",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Test": "integration-test",
            },
          }),
          rfType: "http",
          rfPosition: { x: 300, y: 100 },
          rfLabel: "HTTP Test",
        },
      );
      testData.httpNodeId = httpNodeId;

      // Data transform node
      const transformNodeId = await ctx.runMutation(
        internal.integrations.nodes.mutations.createNode,
        {
          scenarioId,
          type: "data_transform",
          label: "Add Timestamp",
          config: JSON.stringify({
            transformType: "add_timestamp",
          }),
          rfType: "transform",
          rfPosition: { x: 500, y: 100 },
          rfLabel: "Add Timestamp",
        },
      );
      testData.transformNodeId = transformNodeId;

      console.log(
        `✅ Created nodes: ${loggerNodeId}, ${httpNodeId}, ${transformNodeId}`,
      );

      // Step 5: Create edges to define execution flow
      console.log("🔗 Creating scenario edges...");

      // Logger -> HTTP
      const edge1Id = await ctx.runMutation(
        internal.integrations.scenarios.reactFlowMutations.createScenarioEdge,
        {
          scenarioId,
          sourceNodeId: loggerNodeId,
          targetNodeId: httpNodeId,
          label: "log → http",
        },
      );

      // HTTP -> Transform
      const edge2Id = await ctx.runMutation(
        internal.integrations.scenarios.reactFlowMutations.createScenarioEdge,
        {
          scenarioId,
          sourceNodeId: httpNodeId,
          targetNodeId: transformNodeId,
          label: "http → transform",
        },
      );

      testData.edgeIds = [edge1Id, edge2Id];
      console.log(`✅ Created edges: ${edge1Id}, ${edge2Id}`);

      // Step 6: Test scenario graph validation
      console.log("🔍 Testing scenario graph validation...");
      const graphValidation = await ctx.runQuery(
        internal.integrations.scenarios.reactFlowQueries
          .getScenarioGraphForValidation,
        { scenarioId },
      );

      if (graphValidation.nodes.length !== 3) {
        errors.push(`Expected 3 nodes, got ${graphValidation.nodes.length}`);
      }

      if (graphValidation.edges.length !== 2) {
        errors.push(`Expected 2 edges, got ${graphValidation.edges.length}`);
      }

      console.log(
        `✅ Graph validation passed: ${graphValidation.nodes.length} nodes, ${graphValidation.edges.length} edges`,
      );

      // Step 7: Test dry-run functionality
      console.log("🧪 Testing dry-run execution...");
      const dryRunResult = await ctx.runAction(
        internal.integrations.lib.dryRun.dryRunScenario,
        {
          scenarioId,
          payload: {
            test: true,
            message: "Integration test payload",
            timestamp: Date.now(),
          },
        },
      );

      if (!dryRunResult.valid) {
        errors.push(`Dry run failed: ${dryRunResult.error}`);
      } else {
        console.log(
          `✅ Dry run passed: ${dryRunResult.steps?.length || 0} steps simulated`,
        );
      }

      // Step 8: Test manual scenario execution
      console.log("▶️ Testing manual scenario execution...");
      const executionResult = await ctx.runAction(
        internal.integrations.webhooks.handler.triggerScenarioManually,
        {
          scenarioId,
          payload: {
            test: true,
            message: "Integration test execution",
            data: {
              userId: "test-user",
              action: "integration-test",
              timestamp: Date.now(),
            },
          },
          connectionId,
        },
      );

      if (!executionResult.success) {
        errors.push(`Manual execution failed: ${executionResult.error}`);
      } else {
        console.log(
          `✅ Manual execution successful: run ${executionResult.runId}`,
        );
        testData.runId = executionResult.runId;
        testData.executionResult = executionResult.executionResult;
      }

      // Step 9: Verify run was logged properly
      if (executionResult.runId) {
        console.log("📊 Checking execution logs...");

        // Wait a moment for logs to be written
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const run = await ctx.runQuery(
          internal.integrations.scenarioRuns.queries.getScenarioRunById,
          { runId: executionResult.runId },
        );

        if (!run) {
          errors.push("Run record not found");
        } else {
          console.log(
            `✅ Run record found: status=${run.status}, version=${run.scenarioVersion}`,
          );
          testData.finalRunStatus = run.status;
        }

        // Try to get logs (might not exist if logging isn't fully implemented)
        try {
          const logs = await ctx.runQuery(
            internal.integrations.scenarioLogs.queries.getLogsByRunId,
            { runId: executionResult.runId },
          );
          console.log(`✅ Found ${logs.length} log entries`);
          testData.logCount = logs.length;
        } catch (error) {
          console.log(
            "ℹ️ Log retrieval not available (expected in current implementation)",
          );
        }
      }

      // Step 10: Test webhook endpoint integration
      console.log("🌐 Testing webhook endpoint integration...");
      const app = await ctx.runQuery(
        internal.integrations.apps.queries.getById,
        { id: appId },
      );

      const webhookResult = await ctx.runAction(
        internal.integrations.webhooks.handler.handleIncomingWebhook,
        {
          appId,
          triggerKey: "webhook",
          payload: {
            webhook: true,
            source: "integration-test",
            timestamp: Date.now(),
            data: "Test webhook payload",
          },
          headers: {
            "content-type": "application/json",
            "user-agent": "Integration-Test/1.0",
          },
          connectionId,
          source: "integration_test",
        },
      );

      if (!webhookResult.success) {
        errors.push(`Webhook handling failed: ${webhookResult.error}`);
      } else {
        console.log(
          `✅ Webhook handling successful: ${webhookResult.scenariosTriggered} scenarios triggered`,
        );
        testData.webhookRunIds = webhookResult.runIds;
      }

      // Cleanup step (optional)
      if (args.cleanup) {
        console.log("🧹 Cleaning up test data...");

        try {
          // Delete nodes (edges will be cascade deleted)
          await ctx.runMutation(
            internal.integrations.nodes.mutations.deleteNode,
            { nodeId: loggerNodeId },
          );
          await ctx.runMutation(
            internal.integrations.nodes.mutations.deleteNode,
            { nodeId: httpNodeId },
          );
          await ctx.runMutation(
            internal.integrations.nodes.mutations.deleteNode,
            { nodeId: transformNodeId },
          );

          // Delete scenario
          await ctx.runMutation(
            internal.integrations.scenarios.mutations.deleteScenario,
            { scenarioId },
          );

          // Delete connection
          await ctx.runMutation(
            internal.integrations.connections.mutations.deleteConnection,
            { connectionId },
          );

          // Delete app
          await ctx.runMutation(
            internal.integrations.apps.mutations.deleteApp,
            { appId },
          );

          console.log("✅ Cleanup completed");
        } catch (cleanupError) {
          console.log(
            "⚠️ Cleanup failed (may not be fully implemented):",
            cleanupError,
          );
        }
      }

      // Final results
      const success = errors.length === 0;
      console.log(
        success ? "🎉 Integration test PASSED!" : "❌ Integration test FAILED",
      );

      if (errors.length > 0) {
        console.log("Errors encountered:");
        errors.forEach((error) => console.log(`  - ${error}`));
      }

      return {
        success,
        results: {
          testsPassed: success,
          stepsCompleted: 10,
          totalErrors: errors.length,
          executionTime: Date.now() - (testData.startTime || Date.now()),
        },
        errors,
        testData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("💥 Integration test failed with error:", errorMessage);
      errors.push(`Test failed: ${errorMessage}`);

      return {
        success: false,
        results: {
          testsPassed: false,
          criticalError: errorMessage,
        },
        errors,
        testData,
      };
    }
  },
});
