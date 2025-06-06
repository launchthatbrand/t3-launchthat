import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface AddBoardMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  integrationId: string;
}

export default function AddBoardMappingDialog({
  isOpen,
  onClose,
  integrationId,
}: AddBoardMappingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null,
  );
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedTableName, setSelectedTableName] = useState<string | null>(
    null,
  );
  const [syncDirection, setSyncDirection] = useState<string>("pull");
  const [supportsSubitems, setSupportsSubitems] = useState(false);

  // Fetch workspaces
  const workspaces = useQuery(
    api.monday.actions.getWorkspaces,
    integrationId ? { integrationId } : "skip",
  );

  // Fetch boards for selected workspace
  const boards = useQuery(
    api.monday.actions.getBoards,
    selectedWorkspaceId
      ? { integrationId, workspaceId: selectedWorkspaceId }
      : "skip",
  );

  // Fetch available Convex tables
  const tables = useQuery(api.monday.queries.getAvailableTables);

  // Create board mapping mutation
  const createBoardMapping = useMutation(
    api.monday.mutations.createBoardMapping,
  );

  // Handle creating a new board mapping
  const handleCreateMapping = async () => {
    if (!selectedBoardId || !selectedTableName) {
      toast.error("Please select a Monday.com board and Convex table");
      return;
    }

    try {
      setIsLoading(true);

      // Find the selected board to get its name
      const selectedBoard = boards?.find(
        (board) => board.id === selectedBoardId,
      );

      if (!selectedBoard) {
        toast.error("Selected board not found");
        return;
      }

      // Create the mapping
      await createBoardMapping({
        integrationId,
        mondayBoardId: selectedBoardId,
        mondayBoardName: selectedBoard.name,
        convexTableName: selectedTableName,
        convexTableDisplayName: selectedTableName, // Could be customized in future
        syncDirection,
        supportsSubitems,
        isEnabled: true,
      });

      toast.success("Board mapping created successfully");
      onClose();
    } catch (error) {
      toast.error(
        "Error creating board mapping: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Select first workspace when data loads
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Board Mapping</DialogTitle>
          <DialogDescription>
            Map a Monday.com board to a Convex table for data synchronization
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace">Monday.com Workspace</Label>
            <Select
              value={selectedWorkspaceId || ""}
              onValueChange={setSelectedWorkspaceId}
              disabled={!workspaces || workspaces.length === 0}
            >
              <SelectTrigger id="workspace" className="w-full">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces ? (
                  workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="board">Monday.com Board</Label>
            <Select
              value={selectedBoardId || ""}
              onValueChange={setSelectedBoardId}
              disabled={!boards || boards.length === 0}
            >
              <SelectTrigger id="board" className="w-full">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {boards ? (
                  boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="table">Convex Table</Label>
            <Select
              value={selectedTableName || ""}
              onValueChange={setSelectedTableName}
              disabled={!tables || tables.length === 0}
            >
              <SelectTrigger id="table" className="w-full">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables ? (
                  tables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.displayName || table.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Sync Direction</Label>
            <RadioGroup
              value={syncDirection}
              onValueChange={setSyncDirection}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pull" id="pull" />
                <Label htmlFor="pull" className="cursor-pointer">
                  Monday.com to Convex (Pull)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="push" id="push" />
                <Label htmlFor="push" className="cursor-pointer">
                  Convex to Monday.com (Push)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bidirectional" id="bidirectional" />
                <Label htmlFor="bidirectional" className="cursor-pointer">
                  Bidirectional
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="grid gap-0.5">
              <Label htmlFor="subitems">Process Subitems</Label>
              <p className="text-sm text-muted-foreground">
                Enable to process subitems in this board
              </p>
            </div>
            <Switch
              id="subitems"
              checked={supportsSubitems}
              onCheckedChange={setSupportsSubitems}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateMapping} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Mapping"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
