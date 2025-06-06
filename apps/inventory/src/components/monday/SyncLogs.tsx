"use client";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "../shared/EntityList/EntityList";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@acme/ui/skeleton";
import { SyncLogsViewer } from "../ui/SyncLogsViewer";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { useState } from "react";

export interface SyncLogsProps {
  integrationId: Id<"mondayIntegration">;
  ruleId?: Id<"mondaySyncRules">;
}

export function SyncLogs({ integrationId, ruleId }: SyncLogsProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedLogId, setSelectedLogId] =
    useState<Id<"mondaySyncRuleExecutions"> | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Fetch execution logs for this integration
  const logs = useQuery(api.monday.queries.getSyncRuleExecutions, {
    integrationId,
    ruleId: ruleId || undefined,
    limit: 50,
  });

  // Fetch rules for reference
  const rules = useQuery(api.monday.queries.getSyncRules, {
    integrationId,
  });

  // Get the selected log details
  const selectedLog = useQuery(
    api.monday.queries.getSyncRuleExecution,
    selectedLogId ? { executionId: selectedLogId } : "skip",
  );

  if (!logs || !rules) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Filter logs based on active tab
  const filteredLogs = logs.filter((log) => {
    if (activeTab === "all") return true;
    if (activeTab === "success") return log.status === "success";
    if (activeTab === "error") return log.status === "error";
    if (activeTab === "pending") return log.status === "pending";
    return true;
  });

  // Get stats from logs
  const successCount = logs.filter((log) => log.status === "success").length;
  const errorCount = logs.filter((log) => log.status === "error").length;
  const pendingCount = logs.filter((log) => log.status === "pending").length;
  const successRate = logs.length > 0 ? (successCount / logs.length) * 100 : 0;

  // Get rule name map for display
  const ruleNameMap = Object.fromEntries(
    rules.map((rule) => [rule._id, rule.name]),
  );

  const columns = [
    {
      id: "rule",
      header: "Rule",
      accessorKey: "ruleId",
      cell: (log: any) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">
            {ruleNameMap[log.ruleId] || "Unknown Rule"}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(log.createdAt, "MMM d, yyyy h:mm:ss a")}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (log: any) => (
        <div className="flex items-center gap-2">
          {log.status === "success" && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              <CheckCircle className="mr-1 h-3 w-3" /> Success
            </Badge>
          )}
          {log.status === "error" && (
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700"
            >
              <X className="mr-1 h-3 w-3" /> Error
            </Badge>
          )}
          {log.status === "pending" && (
            <Badge
              variant="outline"
              className="border-yellow-200 bg-yellow-50 text-yellow-700"
            >
              <Clock className="mr-1 h-3 w-3" /> Pending
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "documentId",
      header: "Document",
      accessorKey: "documentId",
      cell: (log: any) => (
        <div className="font-mono text-xs">{log.documentId || "N/A"}</div>
      ),
    },
    {
      id: "executionTime",
      header: "Execution Time",
      accessorKey: "executionTimeMs",
      cell: (log: any) => (
        <div>{log.executionTimeMs ? `${log.executionTimeMs} ms` : "N/A"}</div>
      ),
    },
    {
      id: "message",
      header: "Message",
      accessorKey: "message",
      cell: (log: any) => (
        <div className="max-w-[300px] truncate">
          {log.message || (log.error ? log.error.message : "No message")}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sync Logs</h2>
          <p className="text-muted-foreground">
            View and analyze synchronization operation logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Last 50 operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {successCount} successful / {errorCount} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.reduce((acc, log) => acc + (log.executionTimeMs || 0), 0) /
                (logs.filter((log) => log.executionTimeMs).length || 1)}
              ms
            </div>
            <p className="text-xs text-muted-foreground">Per execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Operations in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Logs List */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="error">Errors</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Alert>
              <AlertTitle>No logs found</AlertTitle>
              <AlertDescription>
                {activeTab === "all"
                  ? "No synchronization logs have been recorded yet."
                  : `No ${activeTab} logs found.`}
              </AlertDescription>
            </Alert>
          ) : (
            <EntityList
              data={filteredLogs}
              columns={columns}
              onRowClick={(log) =>
                setSelectedLogId(log._id as Id<"mondaySyncRuleExecutions">)
              }
              pagination={{
                totalItems: logs.length,
                pageSize: 10,
                currentPage: 1,
                onPageChange: () => {},
              }}
              entityActions={[
                {
                  label: "View Details",
                  icon: "Eye",
                  onClick: (log) =>
                    setSelectedLogId(log._id as Id<"mondaySyncRuleExecutions">),
                },
                {
                  label: "Retry",
                  icon: "RefreshCw",
                  onClick: () => {},
                  disabled: (log) => log.status !== "error",
                },
              ]}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      {selectedLogId && (
        <Dialog
          open={!!selectedLogId}
          onOpenChange={(open) => !open && setSelectedLogId(null)}
        >
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Execution Log Details</DialogTitle>
            </DialogHeader>

            {selectedLog ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Rule</div>
                    <div>
                      {ruleNameMap[selectedLog.ruleId] || "Unknown Rule"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="flex items-center gap-2">
                      {selectedLog.status === "success" && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" /> Success
                        </Badge>
                      )}
                      {selectedLog.status === "error" && (
                        <Badge
                          variant="outline"
                          className="border-red-200 bg-red-50 text-red-700"
                        >
                          <X className="mr-1 h-3 w-3" /> Error
                        </Badge>
                      )}
                      {selectedLog.status === "pending" && (
                        <Badge
                          variant="outline"
                          className="border-yellow-200 bg-yellow-50 text-yellow-700"
                        >
                          <Clock className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Created At</div>
                    <div>
                      {format(selectedLog.createdAt, "MMM d, yyyy h:mm:ss a")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Execution Time</div>
                    <div>
                      {selectedLog.executionTimeMs
                        ? `${selectedLog.executionTimeMs} ms`
                        : "N/A"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium">Document ID</div>
                    <div className="font-mono text-xs">
                      {selectedLog.documentId || "N/A"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium">Message</div>
                    <div>{selectedLog.message || "No message"}</div>
                  </div>
                </div>

                {selectedLog.error && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Error Details</div>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {selectedLog.error.name || "Error"}
                      </AlertTitle>
                      <AlertDescription>
                        {selectedLog.error.message}
                        {selectedLog.error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs">
                              {selectedLog.error.stack}
                            </pre>
                          </details>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {selectedLog.data && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Data</div>
                    <SyncLogsViewer data={selectedLog.data} />
                  </div>
                )}

                {selectedLog.result && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Result</div>
                    <SyncLogsViewer data={selectedLog.result} />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {selectedLog.status === "error" && (
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Execution
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLogId(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <Skeleton className="h-60" />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
