/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  BrainCircuit,
  Code,
  Loader2,
  Network,
  Play,
  Webhook,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@acme/ui";
import { JSONView } from "@acme/ui/json-view";

import { appActions, NodeTestResult, SupportedApp } from "../types";
import { getNodeMockData } from "../utils";

interface NodeTesterProps {
  nodeId: string;
  scenarioId: string; // Add scenarioId prop
  appId: string;
  connectionId: string;
  action: string;
  config?: Record<string, unknown>;
  isDisabled?: boolean;
  onDataReceived?: (
    data: Record<string, unknown> | null,
    schema: string[],
  ) => void;
}

/**
 * NodeTester component allows testing a node and viewing the sample data returned
 */
export function NodeTester({
  nodeId,
  scenarioId, // Add scenarioId parameter
  appId,
  connectionId,
  action,
  config = {},
  isDisabled = false,
  onDataReceived,
}: NodeTesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<NodeTestResult | null>(null);
  const [activeTab, setActiveTab] = useState("data");

  // Get app details
  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];
  const selectedApp = apps.find((app) => app._id === appId);
  const appName = selectedApp?.name ?? "";

  // Find action details
  const selectedAppType = appName.toLowerCase() as SupportedApp;
  const actionDetails = appActions[selectedAppType]
    ? appActions[selectedAppType].find((a) => a.id === action)
    : undefined;

  // Get the testNode action from Convex
  const testNodeAction = useAction(api.integrations.nodes.test.testNode);
  const testWebhookAction = useAction(
    api.integrations.actions.webhooks.testWebhook,
  );
  const saveSchema = useMutation(api.integrations.nodes.mutations.updateSchema);

  // Add scenario run lifecycle mutations
  const createScenarioRun = useMutation(
    api.integrations.scenarioRuns.mutations.createScenarioRun,
  );
  const completeScenarioRun = useMutation(
    api.integrations.scenarioRuns.mutations.completeScenarioRun,
  );

  // Add automation logging mutations
  const logNodeExecution = useMutation(
    api.integrations.scenarioLogs.mutations.logNodeExecution,
  );
  const logScenarioStart = useMutation(
    api.integrations.scenarioLogs.mutations.logScenarioStart,
  );
  const logScenarioComplete = useMutation(
    api.integrations.scenarioLogs.mutations.logScenarioComplete,
  );

  // Generate a unique run ID for this test session (used as correlation id)
  const generateRunId = () =>
    `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleWebhookTest = async () => {
    const correlationId = generateRunId();
    const startTime = Date.now();

    // Create a scenario run first
    const runId = await createScenarioRun({
      scenarioId: scenarioId as any,
      triggerKey: "manual_test",
      correlationId,
      connectionId: connectionId as any,
    });

    try {
      // Extract webhook configuration from config
      const webhookUrl = config?.webhookUrl as string;
      const method = (config?.method as string) ?? "POST";
      const contentType = (config?.contentType as string) ?? "application/json";
      const requestBody = (config?.requestBody as string) ?? "{}";
      const headers =
        (config?.headers as Array<{ key: string; value: string }>) ?? [];

      if (!webhookUrl) {
        throw new Error("Webhook URL is required");
      }

      // Log the start of webhook execution
      await logNodeExecution({
        scenarioId: scenarioId as any,
        runId,
        nodeId: nodeId as any,
        action: "webhook_send",
        status: "running",
        startTime,
        inputData: JSON.stringify({
          webhookUrl,
          method,
          contentType,
          requestBody,
          headers,
        }),
        requestInfo: {
          endpoint: webhookUrl,
          method,
          headers: headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {
            "Content-Type": contentType,
          }),
        },
        metadata: JSON.stringify({ nodeType: "webhook", testMode: true }),
      });

      // Call the webhook test action
      const webhookResult = await testWebhookAction({
        webhookUrl,
        method,
        contentType,
        requestBody,
        headers,
      });

      const endTime = Date.now();

      // Log the completion of webhook execution
      await logNodeExecution({
        scenarioId: scenarioId as any,
        runId,
        nodeId: nodeId as any,
        action: "webhook_send",
        status: webhookResult.success ? "success" : "error",
        startTime,
        endTime,
        inputData: JSON.stringify({
          webhookUrl,
          method,
          contentType,
          requestBody,
          headers,
        }),
        outputData: JSON.stringify(webhookResult),
        errorMessage: webhookResult.error,
        requestInfo: {
          endpoint: webhookUrl,
          method,
          headers: headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {
            "Content-Type": contentType,
          }),
        },
        responseInfo: {
          statusCode: webhookResult.statusCode ?? 0,
          statusText: webhookResult.statusText ?? "",
          headers: webhookResult.responseHeaders,
        },
        metadata: JSON.stringify({ nodeType: "webhook", testMode: true }),
      });

      // Complete scenario run
      await completeScenarioRun({
        runId,
        status: webhookResult.success ? "succeeded" : "failed",
      });

      // Format result for display
      const result: NodeTestResult = {
        data: {
          request: {
            url: webhookUrl,
            method,
            contentType,
            body: requestBody,
            headers,
          },
          response: {
            statusCode: webhookResult.statusCode,
            statusText: webhookResult.statusText,
            headers: webhookResult.responseHeaders,
            body: webhookResult.responseBody,
            duration: `${webhookResult.duration}ms`,
          },
          success: webhookResult.success,
        },
        schema: [
          "request.url",
          "request.method",
          "request.contentType",
          "request.body",
          "request.headers",
          "response.statusCode",
          "response.statusText",
          "response.headers",
          "response.body",
          "response.duration",
          "success",
        ],
        error: webhookResult.error,
        isProxied: false,
      };

      setTestResult(result);

      // Call the callback if provided
      if (onDataReceived && result.data) {
        onDataReceived(result.data, result.schema);
      }

      // Set the appropriate tab based on results
      if (result.error) {
        setActiveTab("error");
      } else {
        setActiveTab("data");
      }
    } catch (error) {
      console.error("Webhook test error:", error);

      const endTime = Date.now();

      // Log the error
      await logNodeExecution({
        scenarioId: scenarioId as any,
        runId,
        nodeId: nodeId as any,
        action: "webhook_send",
        status: "error",
        startTime,
        endTime,
        errorMessage:
          error instanceof Error ? error.message : "Unknown webhook test error",
        metadata: JSON.stringify({ nodeType: "webhook", testMode: true }),
      });
      await completeScenarioRun({ runId, status: "failed" });

      const errorResult: NodeTestResult = {
        data: null,
        schema: [],
        error:
          error instanceof Error ? error.message : "Unknown webhook test error",
        isProxied: false,
      };
      setTestResult(errorResult);
      setActiveTab("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle run test button click
  const handleRunTest = async () => {
    if (isDisabled || !appId || !connectionId || !action) return;

    setIsLoading(true);

    const correlationId = generateRunId();
    const startTime = Date.now();

    // Create a scenario run first
    const runId = await createScenarioRun({
      scenarioId: scenarioId as any,
      triggerKey: "manual_test",
      correlationId,
      connectionId: connectionId as any,
    });

    try {
      // Log scenario start
      await logScenarioStart({
        scenarioId: scenarioId as any,
        runId,
        metadata: JSON.stringify({
          testMode: true,
          triggeredBy: "manual",
          nodeId,
          appName,
          action,
        }),
      });

      // Special handling for webhook actions
      if (appName.toLowerCase() === "webhooks" && action === "send_webhook") {
        return await handleWebhookTest();
      }

      // Try to call the Convex action first
      let result: NodeTestResult;

      try {
        // Log the start of node execution
        await logNodeExecution({
          scenarioId: scenarioId as any,
          runId,
          nodeId: nodeId as any,
          action,
          status: "running",
          startTime,
          inputData: JSON.stringify(config),
          metadata: JSON.stringify({
            nodeType: appName,
            testMode: true,
            isProxied: true,
          }),
        });

        // Call the Convex action using the hook
        const actionResult = await testNodeAction({
          nodeId,
          connectionId,
          action,
          appName,
          config,
        });

        const endTime = Date.now();

        // Log successful node execution
        await logNodeExecution({
          scenarioId: scenarioId as any,
          runId,
          nodeId: nodeId as any,
          action,
          status: actionResult.error ? "error" : "success",
          startTime,
          endTime,
          inputData: JSON.stringify(config),
          outputData: JSON.stringify(actionResult.data),
          errorMessage: actionResult.error,
          requestInfo: actionResult.requestInfo,
          responseInfo: actionResult.responseInfo,
          metadata: JSON.stringify({
            nodeType: appName,
            testMode: true,
            isProxied: true,
          }),
        });

        // Complete scenario run status
        await completeScenarioRun({
          runId,
          status: actionResult.error ? "failed" : "succeeded",
        });

        result = {
          ...actionResult,
          isProxied: actionResult.isProxied,
        };
      } catch (convexError) {
        // If the Convex action fails, fall back to mock data
        console.error("Convex action failed, using fallback:", convexError);

        const endTime = Date.now();

        // Log the Convex error
        await logNodeExecution({
          scenarioId: scenarioId as any,
          runId,
          nodeId: nodeId as any,
          action,
          status: "error",
          startTime,
          endTime,
          inputData: JSON.stringify(config),
          errorMessage:
            convexError instanceof Error
              ? convexError.message
              : "Convex action failed",
          metadata: JSON.stringify({
            nodeType: appName,
            testMode: true,
            isProxied: false,
            fallbackUsed: true,
          }),
        });

        const mockResult = await getNodeMockData(
          nodeId,
          connectionId,
          action,
          appName,
        );

        // Complete scenario run status
        await completeScenarioRun({ runId, status: "failed" });

        // Add flag to indicate this is fallback data
        result = {
          ...mockResult,
          isProxied: false,
        };
      }

      // Log scenario completion
      await logScenarioComplete({
        scenarioId: scenarioId as any,
        runId,
        status: result.error ? "error" : "success",
        startTime,
        errorMessage: result.error,
        metadata: JSON.stringify({
          testMode: true,
          nodeCount: 1,
          totalDuration: Date.now() - startTime,
        }),
      });

      setTestResult(result);

      // Call the callback if provided
      if (onDataReceived && result.data) {
        onDataReceived(result.data, result.schema);
      }

      // Set the appropriate tab based on results
      if (result.error) {
        setActiveTab("error");
      } else {
        setActiveTab("data");
      }
    } catch (error) {
      console.error("Test execution error:", error);

      const endTime = Date.now();

      // Log the general error
      await logScenarioComplete({
        scenarioId: scenarioId as any,
        runId,
        status: "error",
        startTime,
        errorMessage:
          error instanceof Error ? error.message : "Unknown test error",
        metadata: JSON.stringify({
          testMode: true,
          errorType: "general",
          totalDuration: endTime - startTime,
        }),
      });

      // Complete scenario run
      await completeScenarioRun({ runId, status: "failed" });

      const errorResult: NodeTestResult = {
        data: null,
        schema: [],
        error: error instanceof Error ? error.message : "Unknown test error",
        isProxied: false,
      };
      setTestResult(errorResult);
      setActiveTab("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if testing is possible
  const canTest = !isDisabled && appId && connectionId && action;

  // Format the timing in ms
  const formatTiming = (ms: number) => {
    return `${ms.toFixed(0)} ms`;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Test Node</CardTitle>
          <Button
            onClick={handleRunTest}
            disabled={isLoading || !canTest}
            size="sm"
            variant={canTest ? "primary" : "outline"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run Test
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          {actionDetails
            ? `Test "${actionDetails.name}" and view sample data`
            : "Configure the node to enable testing"}
        </CardDescription>

        {testResult && (
          <div className="mt-2">
            {testResult.isProxied ? (
              <div className="flex items-center rounded-sm bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-300">
                <Network className="mr-1.5 h-3 w-3" />
                Using real data via secure backend proxy
              </div>
            ) : (
              <div className="flex items-center rounded-sm bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300">
                <BrainCircuit className="mr-1.5 h-3 w-3" />
                Using simulated data (backend proxy unavailable)
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {testResult ? (
        <CardContent>
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="data" disabled={!testResult.data}>
                <BrainCircuit className="mr-2 h-4 w-4" /> Sample Data
              </TabsTrigger>
              <TabsTrigger value="schema" disabled={!testResult.data}>
                <Code className="mr-2 h-4 w-4" /> Schema
              </TabsTrigger>
              <TabsTrigger value="request" disabled={!testResult.requestInfo}>
                <Webhook className="mr-2 h-4 w-4" /> Request
              </TabsTrigger>
              <TabsTrigger value="response" disabled={!testResult.responseInfo}>
                <Network className="mr-2 h-4 w-4" /> Response
              </TabsTrigger>
              <TabsTrigger value="error" disabled={!testResult.error}>
                Error
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="py-2">
              {testResult.data ? (
                <div className="space-y-2">
                  {testResult.error?.includes("CORS") && (
                    <div className="flex justify-end">
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300">
                        Simulated Data
                      </span>
                    </div>
                  )}
                  <div className="max-h-96 overflow-auto rounded border p-2">
                    <JSONView data={testResult.data} />
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">
                  No data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="schema" className="py-2">
              {testResult.schema.length > 0 ? (
                <div className="space-y-2">
                  {testResult.error?.includes("CORS") && (
                    <div className="flex justify-end">
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300">
                        Simulated Schema
                      </span>
                    </div>
                  )}
                  <div className="max-h-96 overflow-auto rounded border p-2">
                    <h3 className="mb-2 font-medium">Available Fields:</h3>
                    <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {testResult.schema.map((field) => (
                        <li
                          key={field}
                          className="rounded border p-1 px-2 text-sm"
                        >
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">
                  No schema available
                </div>
              )}
            </TabsContent>

            <TabsContent value="request" className="py-2">
              {testResult.requestInfo ? (
                <div className="max-h-96 overflow-auto rounded border p-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="mb-1 font-medium">Endpoint:</h3>
                        {testResult.error?.includes("CORS") && (
                          <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300">
                            Attempted Request
                          </span>
                        )}
                      </div>
                      <div className="bg-muted flex items-center rounded p-2 text-sm">
                        <span className="bg-primary text-primary-foreground mr-2 rounded px-2 py-1 text-xs font-bold">
                          {testResult.requestInfo.method}
                        </span>
                        <code>{testResult.requestInfo.endpoint}</code>
                      </div>
                    </div>

                    {testResult.requestInfo.headers && (
                      <div>
                        <h3 className="mb-1 font-medium">Headers:</h3>
                        <div className="rounded border">
                          <JSONView data={testResult.requestInfo.headers} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">
                  No request information available
                </div>
              )}
            </TabsContent>

            <TabsContent value="response" className="py-2">
              {testResult.responseInfo ? (
                <div className="max-h-96 overflow-auto rounded border p-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h3 className="mr-2 font-medium">Status:</h3>
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${
                            testResult.responseInfo.statusCode >= 200 &&
                            testResult.responseInfo.statusCode < 300
                              ? "bg-green-500 text-white"
                              : testResult.responseInfo.statusCode >= 400
                                ? "bg-red-500 text-white"
                                : "bg-yellow-500 text-white"
                          }`}
                        >
                          {testResult.responseInfo.statusCode}{" "}
                          {testResult.responseInfo.statusText}
                          {testResult.error?.includes("CORS") && (
                            <span className="ml-2 rounded bg-black/20 px-1 text-white">
                              Simulated
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        <span className="font-medium">Time:</span>{" "}
                        {formatTiming(testResult.responseInfo.timing)}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-1 font-medium">Response Body:</h3>
                      <div className="rounded border">
                        <JSONView data={testResult.data ?? {}} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">
                  No response information available
                </div>
              )}
            </TabsContent>

            <TabsContent value="error" className="py-2">
              {testResult.error ? (
                <div className="space-y-4">
                  <div className="border-destructive bg-destructive/10 text-destructive rounded border p-4">
                    {testResult.error}
                  </div>

                  {testResult.error.includes("CORS") && testResult.data && (
                    <div className="rounded border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-700 dark:text-yellow-400">
                      <h3 className="mb-2 font-medium">Using Simulated Data</h3>
                      <p className="mb-2 text-sm">
                        Due to browser security restrictions (CORS), direct API
                        calls cannot be made from client-side code. The
                        simulated data shown below represents the structure you
                        would receive from a real API call.
                      </p>
                      <p className="text-sm">
                        In a production environment, these calls should be
                        proxied through your backend API.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">
                  No errors
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      ) : (
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            {canTest
              ? "Click the Run Test button to see sample data from this node"
              : "Configure this node before testing"}
          </div>
        </CardContent>
      )}

      <CardFooter className="text-muted-foreground text-xs">
        {testResult?.data ? (
          <p>This data can be referenced in downstream nodes</p>
        ) : (
          <p>Sample data will help you configure downstream nodes</p>
        )}
      </CardFooter>
    </Card>
  );
}
