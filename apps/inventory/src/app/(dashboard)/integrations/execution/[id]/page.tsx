"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ExecutionMonitor from "@/components/integrations/dashboard/ExecutionMonitor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeft, Download, Play } from "lucide-react";

/**
 * Execution Details Page
 *
 * Shows real-time monitoring and detailed information about a scenario execution
 */
export default function ExecutionPage() {
  const params = useParams();
  const executionId = params.id as string;

  // Get execution details
  const executionDetails = useQuery(
    api.integrations.scenarios.monitoring.getExecutionDetails,
    {
      executionId,
    },
  );

  if (!executionDetails) {
    return (
      <div className="container py-6">
        <div className="mb-6 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/integrations/scenarios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scenarios
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loading Execution</CardTitle>
            <CardDescription>Retrieving execution details...</CardDescription>
          </CardHeader>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="animate-pulse">Loading execution data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/integrations/scenarios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scenarios
            </Link>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>

          {executionDetails.status === "completed" && (
            <Button size="sm">
              <Play className="mr-2 h-4 w-4" />
              Run Again
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">{executionDetails.scenarioName}</h1>
        <p className="text-muted-foreground">
          Execution #{executionId.slice(-6)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ExecutionMonitor executionId={executionId} />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Execution Results</CardTitle>
              <CardDescription>
                Detailed output from the scenario execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="nodes">
                <TabsList>
                  <TabsTrigger value="nodes">Node Results</TabsTrigger>
                  <TabsTrigger value="data">Data Output</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="nodes" className="pt-4">
                  <div className="space-y-4">
                    {executionDetails.nodeResults.map((node, index) => (
                      <div key={index} className="rounded-md border p-4">
                        <div className="mb-2 flex justify-between">
                          <div className="font-medium">
                            {node.type || "Unknown Node"}
                            {node.operation && (
                              <span className="ml-2 text-muted-foreground">
                                ({node.operation})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {node.duration
                              ? formatDuration(node.duration)
                              : "In Progress"}
                          </div>
                        </div>

                        {node.status && (
                          <div className="mb-2 text-sm">
                            Status:{" "}
                            <span className="font-medium">{node.status}</span>
                          </div>
                        )}

                        {node.error && (
                          <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                            {node.error}
                          </div>
                        )}

                        {node.output && (
                          <div className="mt-2">
                            <div className="mb-1 text-sm font-medium">
                              Output:
                            </div>
                            <pre className="max-h-24 overflow-auto rounded bg-gray-50 p-2 text-xs">
                              {typeof node.output === "object"
                                ? JSON.stringify(node.output, null, 2)
                                : String(node.output)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="data" className="pt-4">
                  {executionDetails.output ? (
                    <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-4 text-xs">
                      {JSON.stringify(executionDetails.output, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground">
                      No output data available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs" className="pt-4">
                  {executionDetails.logs && executionDetails.logs.length > 0 ? (
                    <div className="max-h-96 overflow-auto rounded bg-gray-900 p-4 font-mono text-xs text-gray-100">
                      {executionDetails.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-gray-400">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>{" "}
                          <span
                            className={` ${log.level === "error" ? "text-red-400" : ""} ${log.level === "warn" ? "text-yellow-400" : ""} ${log.level === "info" ? "text-blue-400" : ""} `}
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      No logs available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
