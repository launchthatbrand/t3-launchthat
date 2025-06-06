import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConflictDetail from "./ConflictDetail";
import { Separator } from "@/components/ui/separator";
import { SimpleEntityList } from "../shared/EntityList/SimpleEntityList";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface ConflictDashboardProps {
  boardMappingId?: string;
}

export default function ConflictDashboard({
  boardMappingId,
}: ConflictDashboardProps) {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(
    null,
  );

  // Use boardMappingId from props or from URL params
  const mappingId = boardMappingId || (params?.id as string);

  // Query board mapping details and conflict stats
  const boardMapping = useQuery(api.monday.queries.getBoardMappingById, {
    id: mappingId,
  });

  const conflictStats = useQuery(api.monday.queries.getSyncConflictsStats, {
    boardMappingId: mappingId,
  });

  // Query conflicts based on selected tab
  const conflicts = useQuery(api.monday.queries.getSyncConflictsForBoard, {
    boardMappingId: mappingId,
    status: selectedTab !== "all" ? (selectedTab as any) : undefined,
    onlyUnresolved: selectedTab === "unresolved",
  });

  // Get selected conflict details
  const conflictDetails = useQuery(
    api.monday.queries.getSyncConflictById,
    selectedConflictId ? { conflictId: selectedConflictId } : "skip",
  );

  // Mutation for batch resolving conflicts
  const resolveBatch = useMutation(
    api.monday.mutations.resolveSyncConflictsBatch,
  );

  // Loading states
  const isLoading =
    conflicts === undefined ||
    boardMapping === undefined ||
    conflictStats === undefined;

  const isDetailLoading =
    selectedConflictId !== null && conflictDetails === undefined;

  // Handle batch resolution
  const handleBatchResolve = async (
    strategy: "latest_wins" | "monday_wins" | "convex_wins",
  ) => {
    if (!mappingId) return;

    try {
      const result = await resolveBatch({
        boardMappingId: mappingId,
        strategy,
        applyChanges: false,
        resolvedBy: "user",
      });

      toast({
        title: "Conflicts resolved",
        description: result.message,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      // Refresh data
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      toast({
        title: "Error resolving conflicts",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Format timestamps
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Handle conflict selection
  const handleSelectConflict = (id: string) => {
    setSelectedConflictId(id);
  };

  // When conflict is resolved, refresh the list
  const handleConflictResolved = () => {
    setSelectedConflictId(null);
    setTimeout(() => {
      router.refresh();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!boardMapping || !conflictStats) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Board mapping not found</AlertTitle>
        <AlertDescription>
          The board mapping information could not be loaded.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Sync Conflict Management</h1>
          <p className="text-muted-foreground">
            {boardMapping.mondayBoardName} →{" "}
            {boardMapping.convexTableDisplayName ||
              boardMapping.convexTableName}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/monday/board-mappings/${mappingId}`)}
          >
            Back to Board
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conflictStats.total}</div>
            <p className="text-sm text-muted-foreground">
              Last detected {formatTime(conflictStats.lastDetectedAt)}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            conflictStats.detected > 0
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
              : ""
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conflictStats.detected}</div>
            <p className="text-sm text-muted-foreground">Require resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Auto-Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {conflictStats.resolvedAuto}
            </div>
            <p className="text-sm text-muted-foreground">Resolved by system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Manually Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {conflictStats.resolvedManual}
            </div>
            <p className="text-sm text-muted-foreground">Resolved by users</p>
          </CardContent>
        </Card>
      </div>

      {conflictStats.detected > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Resolution</CardTitle>
            <CardDescription>
              Resolve all {conflictStats.detected} unresolved conflicts at once
              using the same strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                onClick={() => handleBatchResolve("latest_wins")}
              >
                Latest Wins
              </Button>
              <Button
                variant="default"
                onClick={() => handleBatchResolve("monday_wins")}
              >
                Monday.com Wins
              </Button>
              <Button
                variant="default"
                onClick={() => handleBatchResolve("convex_wins")}
              >
                Convex Wins
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Conflict List</CardTitle>
              <Tabs
                defaultValue="all"
                value={selectedTab}
                onValueChange={setSelectedTab}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="detected">Unresolved</TabsTrigger>
                  <TabsTrigger value="resolved_auto">Auto-Resolved</TabsTrigger>
                  <TabsTrigger value="resolved_manual">
                    Manual-Resolved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              {conflicts && conflicts.length > 0 ? (
                <SimpleEntityList
                  items={conflicts.map((conflict) => ({
                    id: conflict._id,
                    title: `${conflict.convexTable}:${conflict.convexId}`,
                    subtitle: `Monday Item: ${conflict.mondayItemId}`,
                    description: `${conflict.conflictingFields.length} conflicting fields`,
                    timestamp: conflict.detectedAt,
                    status: conflict.status,
                    badge: {
                      label: conflict.status,
                      variant:
                        conflict.status === "detected"
                          ? "outline"
                          : conflict.status === "resolved_auto"
                            ? "secondary"
                            : conflict.status === "resolved_manual"
                              ? "default"
                              : "outline",
                    },
                    isSelected: selectedConflictId === conflict._id,
                  }))}
                  onItemClick={handleSelectConflict}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No conflicts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedConflictId ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conflict Details</CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedConflictId(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isDetailLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : conflictDetails ? (
                  <ConflictDetail
                    conflict={conflictDetails}
                    onResolved={handleConflictResolved}
                  />
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Conflict not found</AlertTitle>
                    <AlertDescription>
                      The selected conflict could not be loaded.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Conflict Resolution</CardTitle>
              </CardHeader>
              <CardContent className="flex h-[calc(100%-5rem)] flex-col items-center justify-center text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a conflict to view details and resolve
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
