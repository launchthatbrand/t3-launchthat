import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { formatDistance } from "date-fns";
import { AlertCircle, CheckCircle, RefreshCcw } from "lucide-react";

interface SyncStatusProps {
  boardMappingId: Id<"mondayBoardMappings">;
}

export function SyncStatus({ boardMappingId }: SyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    recordsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsFailed?: number;
  } | null>(null);

  // Get the board mapping
  const boardMapping = useQuery(api.monday.queries.getBoardMapping, {
    id: boardMappingId,
  });

  // Get the latest sync log
  const syncLogs = useQuery(api.monday.queries.getSyncLogs, {
    boardMappingId,
    paginationOpts: { numItems: 1 },
  });
  const latestSyncLog = syncLogs?.page?.[0] || null;

  // Trigger a manual sync
  const manualSync = useMutation(api.monday.actions.manualPullSync);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await manualSync({ boardMappingId });
      setSyncResult(result);
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper function to get the status badge
  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "synced":
        return <Badge className="bg-green-500">Synced</Badge>;
      case "syncing":
        return <Badge className="bg-blue-500">Syncing</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case "not_synced":
        return <Badge className="bg-gray-500">Not Synced</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Loading state
  if (!boardMapping) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sync Status</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCcw
              className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")}
            />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Status</span>
            <div>
              {getSyncStatusBadge(boardMapping.syncStatus || "not_synced")}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Last Sync</span>
            <span className="text-sm">
              {boardMapping.lastSyncTimestamp
                ? formatDistance(
                    new Date(boardMapping.lastSyncTimestamp),
                    new Date(),
                    {
                      addSuffix: true,
                    },
                  )
                : "Never"}
            </span>
          </div>

          {latestSyncLog && (
            <>
              <Separator />
              <div className="grid gap-2">
                <span className="text-sm font-medium">Last Sync Results</span>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm">{latestSyncLog.status}</span>
                </div>

                {latestSyncLog.recordsProcessed !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Items Processed
                    </span>
                    <span className="text-sm">
                      {latestSyncLog.recordsProcessed}
                    </span>
                  </div>
                )}

                {latestSyncLog.recordsCreated !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Items Created</span>
                    <span className="text-sm">
                      {latestSyncLog.recordsCreated}
                    </span>
                  </div>
                )}

                {latestSyncLog.recordsUpdated !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Items Updated</span>
                    <span className="text-sm">
                      {latestSyncLog.recordsUpdated}
                    </span>
                  </div>
                )}

                {latestSyncLog.recordsFailed !== undefined &&
                  latestSyncLog.recordsFailed > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Items Failed
                      </span>
                      <span className="text-sm text-red-500">
                        {latestSyncLog.recordsFailed}
                      </span>
                    </div>
                  )}

                {latestSyncLog.error && (
                  <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    <div className="flex items-start">
                      <AlertCircle className="mr-2 mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p>{latestSyncLog.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {syncResult && (
            <>
              <Separator />
              <div className="grid gap-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    Latest Sync Result
                  </span>
                  {syncResult.success ? (
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="text-sm">{syncResult.message}</div>

                {syncResult.recordsProcessed !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Processed</span>
                    <span className="text-sm">
                      {syncResult.recordsProcessed}
                    </span>
                  </div>
                )}

                {syncResult.recordsCreated !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm">{syncResult.recordsCreated}</span>
                  </div>
                )}

                {syncResult.recordsUpdated !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Updated</span>
                    <span className="text-sm">{syncResult.recordsUpdated}</span>
                  </div>
                )}

                {syncResult.recordsFailed !== undefined &&
                  syncResult.recordsFailed > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Failed</span>
                      <span className="text-sm text-red-500">
                        {syncResult.recordsFailed}
                      </span>
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
