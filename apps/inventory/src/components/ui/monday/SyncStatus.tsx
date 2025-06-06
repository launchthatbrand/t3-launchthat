import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export type SyncDirection = "pull" | "push" | "both";
export type SyncMode = "boards" | "orders" | "all";

export interface SyncStatusProps {
  boardMappingId?: string;
  showControls?: boolean;
  initialDirection?: SyncDirection;
  initialMode?: SyncMode;
  connectionId?: string;
}

export default function SyncStatus({
  boardMappingId,
  showControls = true,
  initialDirection = "pull",
  initialMode = "boards",
  connectionId,
}: SyncStatusProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDirection, setSyncDirection] =
    useState<SyncDirection>(initialDirection);
  const [syncMode, setSyncMode] = useState<SyncMode>(initialMode);

  // Get the sync status
  const syncStatus = useQuery(api.monday.queries.getSyncStatus, {
    boardMappingId: boardMappingId,
  });

  // Mutations for triggering sync
  const syncBoard = useMutation(api.monday.mutations.syncBoard);
  const syncAllBoards = useMutation(api.monday.mutations.syncAllBoards);
  const syncOrder = useMutation(api.monday.mutations.syncOrder);
  const syncAllOrders = useMutation(api.monday.mutations.syncAllOrders);

  // Get sync logs
  const syncLogs = useQuery(api.monday.queries.getSyncLogs, {
    boardMappingId: boardMappingId,
    limit: 5,
  });

  // Get recent sync logs
  const logs = useQuery(
    api.monday.client.getSyncLogs,
    connectionId ? { integrationId: connectionId } : { limit: 10 },
  );

  // Calculate stats
  const totalItemsProcessed =
    logs?.reduce((total, log) => total + (log.itemsProcessed || 0), 0) || 0;
  const totalItemsSucceeded =
    logs?.reduce((total, log) => total + (log.itemsSucceeded || 0), 0) || 0;
  const successRate =
    totalItemsProcessed > 0
      ? Math.round((totalItemsSucceeded / totalItemsProcessed) * 100)
      : 0;

  // Get most recent sync
  const lastSync = logs?.length ? logs[0] : null;

  // Format last sync time
  const formattedLastSync = lastSync
    ? formatDistanceToNow(new Date(lastSync.timestamp), { addSuffix: true })
    : "Never";

  // Handle sync trigger
  const handleSync = async () => {
    try {
      setIsSyncing(true);

      if (syncMode === "boards" || syncMode === "all") {
        if (boardMappingId) {
          // Sync specific board
          const result = await syncBoard({
            boardMappingId,
            direction: syncDirection,
          });
          if (result.success) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        } else {
          // Sync all boards
          const result = await syncAllBoards({
            direction: syncDirection,
          });
          if (result.success) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        }
      }

      if (syncMode === "orders" || syncMode === "all") {
        if (boardMappingId && syncDirection === "push") {
          // Get order for this specific board mapping
          // We'd need to have an order ID to sync a specific order
          toast.info(
            "To sync a specific order, you need to select it from the orders page",
          );
        } else {
          // Sync all orders (push only makes sense for orders)
          const result = await syncAllOrders({});
          if (result.success) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        }
      }
    } catch (error) {
      toast.error(
        "Error starting sync: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      // Give UI time to update before removing loading state
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  // Auto-refresh status when syncing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isSyncing) {
      // Poll every 2 seconds when actively syncing
      interval = setInterval(() => {
        // This will cause the query to refresh
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSyncing]);

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "syncing":
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case "synced":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Synced
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-yellow-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Partial
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500">{status || "Unknown"}</Badge>;
    }
  };

  if (!syncStatus) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-xl">
          <span>Sync Status</span>
          {syncStatus.status && getStatusBadge(syncStatus.status)}
        </CardTitle>
        <CardDescription>
          {syncStatus.lastSync
            ? `Last synced ${formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true })}`
            : "Never synced"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {logs === undefined ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last sync: {formattedLastSync}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="text-2xl font-bold">
                  {logs.length > 0 ? logs.length : 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Syncs</div>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <div className="text-2xl font-bold">{successRate}%</div>
                <div className="text-xs text-muted-foreground">
                  Success Rate
                </div>
              </div>
            </div>

            {lastSync && (
              <div className="rounded-md border p-2 text-sm">
                <div className="mb-1 font-medium">Last Operation</div>
                <div className="grid grid-cols-2 gap-x-1 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={
                      lastSync.status === "success"
                        ? "text-green-600"
                        : lastSync.status === "partial"
                          ? "text-amber-600"
                          : "text-red-600"
                    }
                  >
                    {lastSync.status}
                  </span>
                  <span className="text-muted-foreground">Items:</span>
                  <span>
                    {lastSync.itemsSucceeded}/{lastSync.itemsProcessed}
                  </span>
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{lastSync.durationMs}ms</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showControls && (
        <CardFooter className="flex-col gap-2 pt-0">
          <div className="flex w-full gap-2">
            <Select
              value={syncMode}
              onValueChange={(value) => setSyncMode(value as SyncMode)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select data to sync" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boards">Boards &amp; Items</SelectItem>
                <SelectItem value="orders">Orders &amp; Line Items</SelectItem>
                <SelectItem value="all">All Data</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={syncDirection}
              onValueChange={(value) =>
                setSyncDirection(value as SyncDirection)
              }
              disabled={syncMode === "orders"} // Orders only support push direction
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pull">Pull from Monday</SelectItem>
                <SelectItem value="push">Push to Monday</SelectItem>
                <SelectItem value="both">Bidirectional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full"
            variant="default"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {boardMappingId
                  ? `Sync This ${syncMode === "orders" ? "Order" : "Board"}`
                  : `Sync All ${
                      syncMode === "boards"
                        ? "Boards"
                        : syncMode === "orders"
                          ? "Orders"
                          : "Data"
                    }`}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
