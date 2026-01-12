"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  Timer,
  User,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

type AutomationLogData = Doc<"automationLogs">;

export default function AutomationLogDetailPage() {
  const router = useRouter();
  const params = useParams();

  const scenarioId = params.id as Id<"scenarios">;
  const logId = params.scenarioLogId as Id<"automationLogs">;

  // Get the specific log entry
  const log = useQuery(
    api.integrations.automationLogs.queries.getAutomationLogById,
    {
      logId,
    },
  );

  // Get scenario info for context
  const scenario = useQuery(api.integrations.scenarios.queries.getById, {
    id: scenarioId,
  });

  const isLoading = log === undefined || scenario === undefined;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading log details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/integrations/scenarios/${scenarioId}/logs`)
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Logs
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Log Entry Not Found</h3>
          <p className="text-muted-foreground">
            The requested log entry could not be found.
          </p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "skipped":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/integrations/scenarios/${scenarioId}/logs`)
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Logs
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/admin/integrations/scenarios/${scenarioId}`)
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Scenario
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold">Automation Log Details</h1>
          <p className="text-muted-foreground">
            Detailed execution information for log entry
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execution Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status)}
                      {log.status}
                    </div>
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Action
                  </div>
                  <div className="font-medium">{log.action}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Duration
                  </div>
                  <div className="font-medium">
                    {formatDuration(log.duration)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Execution Time
                  </div>
                  <div className="font-medium">
                    {formatDistanceToNow(new Date(log.startTime), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Information */}
          {log.requestInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Method
                    </div>
                    <Badge variant="outline">{log.requestInfo.method}</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Endpoint
                    </div>
                    <div className="break-all font-mono text-sm">
                      {log.requestInfo.endpoint}
                    </div>
                  </div>
                </div>

                {log.requestInfo.headers && (
                  <div>
                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                      Headers
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
                      {JSON.stringify(log.requestInfo.headers, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Response Information */}
          {log.responseInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Response Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Status Code
                    </div>
                    <Badge
                      variant={
                        log.responseInfo.statusCode >= 400
                          ? "destructive"
                          : "default"
                      }
                    >
                      {log.responseInfo.statusCode}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Status Text
                    </div>
                    <div className="font-medium">
                      {log.responseInfo.statusText}
                    </div>
                  </div>
                </div>

                {log.responseInfo.headers && (
                  <div>
                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                      Headers
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
                      {JSON.stringify(log.responseInfo.headers, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Input Data */}
          {log.inputData && (
            <Card>
              <CardHeader>
                <CardTitle>Input Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                  {log.inputData}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Output Data */}
          {log.outputData && (
            <Card>
              <CardHeader>
                <CardTitle>Output Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                  {log.outputData}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Error Information */}
          {log.errorMessage && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {log.errorMessage}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Context Information */}
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Run ID
                </div>
                <div className="break-all font-mono text-sm">{log.runId}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Scenario
                </div>
                <div className="font-medium">{scenario?.name || "Unknown"}</div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() =>
                    router.push(`/admin/integrations/scenarios/${scenarioId}`)
                  }
                >
                  View Scenario Details →
                </Button>
              </div>

              {/* Removed node query and its rendering */}
            </CardContent>
          </Card>

          {/* Timing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Started
                </div>
                <div className="text-sm">
                  {new Date(log.startTime).toLocaleString()}
                </div>
              </div>

              {log.endTime && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Ended
                  </div>
                  <div className="text-sm">
                    {new Date(log.endTime).toLocaleString()}
                  </div>
                </div>
              )}

              {log.duration && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Duration
                  </div>
                  <div className="text-sm font-medium">
                    {formatDuration(log.duration)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          {log.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                  {log.metadata}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
