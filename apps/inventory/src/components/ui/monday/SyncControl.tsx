import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import React, { useState } from "react";

import { Badge } from "../badge";
import { Button } from "../button";
import { Id } from "../../../../convex/_generated/dataModel";
import { Progress } from "../progress";
import { SyncStatus } from "./SyncStatus";
import { api } from "../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useToast } from "../use-toast";

interface SyncControlProps {
  integrationId: Id<"mondayIntegration">;
  boardMappings: Array<{
    _id: Id<"mondayBoardMappings">;
    mondayBoardName: string;
    convexTableName: string;
    convexTableDisplayName?: string;
    syncDirection: "push" | "pull" | "bidirectional";
    isEnabled: boolean;
    syncStatus?: string;
    lastSyncTimestamp?: number;
  }>;
  onSyncComplete?: () => void;
}

export function SyncControl({
  integrationId,
  boardMappings,
  onSyncComplete,
}: SyncControlProps) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Mutations for sync operations
  const pullFromMonday = useMutation(api.monday.mutations.pullFromMonday);
  const pushToMonday = useMutation(api.monday.mutations.pushToMonday);
  const syncAll = useMutation(api.monday.mutations.syncAll);

  // Helper to format dates
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  // Display name for a board mapping
  const getBoardDisplayName = (
    mapping: SyncControlProps["boardMappings"][0],
  ) => {
    return (
      mapping.convexTableDisplayName ||
      mapping.convexTableName.charAt(0).toUpperCase() +
        mapping.convexTableName.slice(1)
    );
  };

  // Handle pull from Monday for a specific mapping
  const handlePullFromMonday = async (mappingId: Id<"mondayBoardMappings">) => {
    const mapping = boardMappings.find((m) => m._id === mappingId);
    if (!mapping) return;

    if (mapping.syncDirection === "push") {
      showConfirmDialog(
        "Change Sync Direction?",
        "This mapping is currently set to push only. Pulling data from Monday may overwrite your Convex data. Do you want to continue?",
        () => executePull(mappingId),
      );
    } else {
      executePull(mappingId);
    }
  };

  // Execute pull operation
  const executePull = async (mappingId: Id<"mondayBoardMappings">) => {
    try {
      setIsSyncing(true);
      setCurrentOperation("Pulling from Monday.com");
      setSyncProgress(10);

      const result = await pullFromMonday({
        integrationId,
        boardMappingId: mappingId,
      });

      setSyncProgress(100);

      toast({
        title: "Sync Complete",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setCurrentOperation(null);
      setSyncProgress(0);
    }
  };

  // Handle push to Monday for a specific mapping
  const handlePushToMonday = async (mappingId: Id<"mondayBoardMappings">) => {
    const mapping = boardMappings.find((m) => m._id === mappingId);
    if (!mapping) return;

    if (mapping.syncDirection === "pull") {
      showConfirmDialog(
        "Change Sync Direction?",
        "This mapping is currently set to pull only. Pushing data to Monday may overwrite your Monday.com data. Do you want to continue?",
        () => executePush(mappingId),
      );
    } else {
      executePush(mappingId);
    }
  };

  // Execute push operation
  const executePush = async (mappingId: Id<"mondayBoardMappings">) => {
    try {
      setIsSyncing(true);
      setCurrentOperation("Pushing to Monday.com");
      setSyncProgress(10);

      const result = await pushToMonday({
        integrationId,
        boardMappingId: mappingId,
      });

      setSyncProgress(100);

      toast({
        title: "Sync Complete",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setCurrentOperation(null);
      setSyncProgress(0);
    }
  };

  // Handle sync all mappings operation
  const handleSyncAll = async () => {
    showConfirmDialog(
      "Synchronize All Mappings",
      "This will synchronize all enabled mappings according to their sync direction settings. Continue?",
      executeSyncAll,
    );
  };

  // Execute sync all operation
  const executeSyncAll = async () => {
    try {
      setIsSyncing(true);
      setCurrentOperation("Syncing all enabled mappings");
      setSyncProgress(10);

      const result = await syncAll({
        integrationId,
      });

      setSyncProgress(100);

      toast({
        title: "Sync All Complete",
        description: `${result.succeeded} mappings synced successfully, ${result.failed} failed`,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setCurrentOperation(null);
      setSyncProgress(0);
    }
  };

  // Show confirmation dialog
  const showConfirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void,
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      onConfirm,
    });
  };

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Get direction badge for a mapping
  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case "push":
        return <Badge variant="secondary">Push to Monday</Badge>;
      case "pull":
        return <Badge variant="secondary">Pull from Monday</Badge>;
      case "bidirectional":
        return <Badge variant="secondary">Bidirectional</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Monday.com Synchronization</span>
            <Button
              onClick={handleSyncAll}
              disabled={isSyncing || boardMappings.length === 0}
              className="ml-2"
            >
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync All Enabled Mappings
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sync Progress Indicator */}
          {isSyncing && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>{currentOperation}</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          )}

          {/* Mapping-specific Sync Controls */}
          <div className="mt-4 space-y-4">
            {boardMappings.length === 0 ? (
              <p>No board mappings configured. Create mappings first.</p>
            ) : (
              boardMappings.map((mapping) => (
                <Card key={mapping._id} className="border border-muted">
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {mapping.mondayBoardName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getBoardDisplayName(mapping)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getDirectionBadge(mapping.syncDirection)}
                          <SyncStatus status={mapping.syncStatus} />
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Last synced: {formatDate(mapping.lastSyncTimestamp)}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePullFromMonday(mapping._id)}
                          disabled={isSyncing || !mapping.isEnabled}
                        >
                          <ArrowDownToLine className="mr-2 h-4 w-4" />
                          Pull from Monday
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePushToMonday(mapping._id)}
                          disabled={isSyncing || !mapping.isEnabled}
                        >
                          <ArrowUpFromLine className="mr-2 h-4 w-4" />
                          Push to Monday
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirmDialog();
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
