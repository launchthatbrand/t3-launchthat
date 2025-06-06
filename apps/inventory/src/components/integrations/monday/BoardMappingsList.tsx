import { useState } from "react";
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
import SyncStatus from "@/components/ui/monday/SyncStatus";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import AddBoardMappingDialog from "./AddBoardMappingDialog";

interface BoardMappingsListProps {
  connectionId?: string;
}

export default function BoardMappingsList({
  connectionId,
}: BoardMappingsListProps) {
  const [isAddingMapping, setIsAddingMapping] = useState(false);

  // Get board mappings for the specific connection
  const boardMappings = useQuery(
    api.monday.queries.getBoardMappings,
    connectionId ? { integrationId: connectionId } : {},
  );

  // Get integration config for the specific connection
  const integrationConfig = useQuery(
    api.monday.queries.getIntegrationConfig,
    connectionId ? { id: connectionId } : {},
  );

  // Mutations
  const syncBoard = useMutation(api.monday.mutations.syncBoard);
  const deleteBoardMapping = useMutation(
    api.monday.mutations.deleteBoardMapping,
  );
  const updateBoardMapping = useMutation(
    api.monday.mutations.updateBoardMapping,
  );

  // Handle sync for a specific board
  const handleSyncBoard = async (boardMappingId: string) => {
    try {
      const result = await syncBoard({
        boardMappingId,
        integrationId: connectionId,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        "Error syncing board: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Handle deleting a board mapping
  const handleDeleteMapping = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this board mapping? This will not delete any existing data.",
      )
    ) {
      return;
    }

    try {
      const result = await deleteBoardMapping({ id });

      if (result) {
        toast.success("Board mapping deleted successfully");
      } else {
        toast.error("Failed to delete board mapping");
      }
    } catch (error) {
      toast.error(
        "Error deleting board mapping: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Handle toggling a board mapping's enabled status
  const handleToggleMappingStatus = async (
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      await updateBoardMapping({
        id,
        isEnabled: !currentStatus,
      });

      toast.success(`Board mapping ${!currentStatus ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(
        "Error updating board mapping: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Format sync direction
  const formatSyncDirection = (direction: string) => {
    switch (direction) {
      case "push":
        return "Convex → Monday";
      case "pull":
        return "Monday → Convex";
      case "bidirectional":
        return "Bidirectional";
      default:
        return direction;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "syncing":
        return <Badge className="bg-blue-500">Syncing</Badge>;
      case "synced":
        return <Badge className="bg-green-500">Synced</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>;
      default:
        return <Badge className="bg-gray-500">{status || "Unknown"}</Badge>;
    }
  };

  if (!integrationConfig) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <div className="mb-2 text-lg font-medium">
              No Monday.com Integration
            </div>
            <p className="mb-4 text-muted-foreground">
              Please configure your Monday.com integration first
            </p>
            <Button
              variant="default"
              onClick={() => (window.location.href = "/integrations/monday")}
            >
              Configure Integration
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Board Mappings</CardTitle>
                <CardDescription>
                  Configure which Monday.com boards sync to Convex tables
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddingMapping(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
            </CardHeader>
            <CardContent>
              {boardMappings === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : boardMappings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monday.com Board</TableHead>
                      <TableHead>Convex Table</TableHead>
                      <TableHead>Sync Direction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Synced</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boardMappings.map((mapping) => (
                      <TableRow key={mapping._id}>
                        <TableCell className="font-medium">
                          {mapping.mondayBoardName}
                        </TableCell>
                        <TableCell>
                          {mapping.convexTableDisplayName ||
                            mapping.convexTableName}
                        </TableCell>
                        <TableCell>
                          {formatSyncDirection(mapping.syncDirection)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(mapping.syncStatus)}
                        </TableCell>
                        <TableCell>
                          {mapping.lastSyncTimestamp
                            ? formatDistanceToNow(
                                new Date(mapping.lastSyncTimestamp),
                                {
                                  addSuffix: true,
                                },
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSyncBoard(mapping._id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="sr-only">Sync</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleMappingStatus(
                                  mapping._id,
                                  mapping.isEnabled,
                                )
                              }
                            >
                              {mapping.isEnabled ? "Disable" : "Enable"}
                              <span className="sr-only">
                                {mapping.isEnabled ? "Disable" : "Enable"}
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMapping(mapping._id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="mb-4 text-muted-foreground">
                    No board mappings configured yet
                  </p>
                  <Button
                    variant="default"
                    onClick={() => setIsAddingMapping(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Mapping
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <SyncStatus connectionId={connectionId} />
        </div>
      </div>

      {/* Add Board Mapping Dialog */}
      {isAddingMapping && (
        <AddBoardMappingDialog
          integrationId={integrationConfig._id}
          isOpen={isAddingMapping}
          onClose={() => setIsAddingMapping(false)}
        />
      )}
    </>
  );
}
