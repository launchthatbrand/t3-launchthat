import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, InfoIcon, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ConflictDetailProps {
  conflict: any; // Full conflict object with details
  onResolved?: () => void;
}

export default function ConflictDetail({
  conflict,
  onResolved,
}: ConflictDetailProps) {
  const { toast } = useToast();
  const [selectedStrategy, setSelectedStrategy] =
    useState<string>("latest_wins");
  const [isResolving, setIsResolving] = useState(false);

  // Mutation for resolving conflicts
  const resolveConflict = useMutation(api.monday.mutations.resolveSyncConflict);

  // Check if conflict is already resolved
  const isResolved =
    conflict.status === "resolved_auto" ||
    conflict.status === "resolved_manual";

  // Format dates
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "PPpp");
  };

  // Handle conflict resolution
  const handleResolve = async () => {
    if (isResolving) return;

    setIsResolving(true);
    try {
      const result = await resolveConflict({
        conflictId: conflict._id,
        strategy: selectedStrategy as any,
        applyChanges: false,
        resolvedBy: "user",
      });

      toast({
        title: "Conflict resolved",
        description: result.message,
        variant: "default",
      });

      if (onResolved) {
        onResolved();
      }
    } catch (error) {
      toast({
        title: "Error resolving conflict",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  // Get value display based on type
  const getValueDisplay = (value: any) => {
    if (value === null || value === undefined) {
      return <em className="text-muted-foreground">null</em>;
    }

    if (typeof value === "object") {
      return (
        <pre className="max-h-24 overflow-auto rounded-md bg-muted p-2 text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === "boolean") {
      return value ? "True" : "False";
    }

    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Conflict status */}
      <div className="flex items-center justify-between">
        <div>
          <Badge
            variant={
              conflict.status === "detected"
                ? "outline"
                : conflict.status === "resolved_auto"
                  ? "secondary"
                  : conflict.status === "resolved_manual"
                    ? "default"
                    : "outline"
            }
            className="mb-2"
          >
            {conflict.status}
          </Badge>
          <h3 className="text-lg font-medium">
            {conflict.convexTable}:{conflict.convexId}
          </h3>
          <p className="text-sm text-muted-foreground">
            Monday Item: {conflict.mondayItemId}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Detected:</p>
          <p className="text-sm">{formatDate(conflict.detectedAt)}</p>
          {conflict.resolvedAt && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Resolved:</p>
              <p className="text-sm">{formatDate(conflict.resolvedAt)}</p>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Conflicting fields */}
      <div>
        <h3 className="mb-4 text-lg font-medium">
          Conflicting Fields ({conflict.fieldConflicts.length})
        </h3>
        <div className="space-y-4">
          {conflict.fieldConflicts.map((fieldConflict: any, index: number) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {fieldConflict.field}
                  </CardTitle>
                  {fieldConflict.isResolved && (
                    <Badge variant="outline" className="bg-green-50">
                      Resolved
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Monday Value:</p>
                    <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-900/20">
                      {getValueDisplay(fieldConflict.mondayValue)}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium">Convex Value:</p>
                    <div className="rounded-md bg-purple-50 p-2 dark:bg-purple-900/20">
                      {getValueDisplay(fieldConflict.convexValue)}
                    </div>
                  </div>
                </div>

                {fieldConflict.isResolved && (
                  <div className="mt-4">
                    <p className="mb-1 text-sm font-medium">Resolved Value:</p>
                    <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20">
                      {getValueDisplay(fieldConflict.resolvedValue)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resolution section - only show if not resolved */}
      {!isResolved && (
        <>
          <Separator />

          <div>
            <h3 className="mb-4 text-lg font-medium">Resolve Conflict</h3>
            <RadioGroup
              value={selectedStrategy}
              onValueChange={setSelectedStrategy}
              className="space-y-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="latest_wins" id="latest_wins" />
                <div className="grid gap-1.5">
                  <Label htmlFor="latest_wins" className="font-medium">
                    Latest Wins
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use the most recently updated values based on timestamps.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="monday_wins" id="monday_wins" />
                <div className="grid gap-1.5">
                  <Label htmlFor="monday_wins" className="font-medium">
                    Monday.com Wins
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Always use the values from Monday.com.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="convex_wins" id="convex_wins" />
                <div className="grid gap-1.5">
                  <Label htmlFor="convex_wins" className="font-medium">
                    Convex Wins
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Always use the values from Convex.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="manual" id="manual" disabled />
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="manual"
                    className="font-medium text-muted-foreground"
                  >
                    Manual Resolution (Coming Soon)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Manually select values for each field.
                  </p>
                </div>
              </div>
            </RadioGroup>

            <div className="mt-6">
              <Button
                onClick={handleResolve}
                disabled={isResolving}
                className="w-full"
              >
                {isResolving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Resolve Conflict
              </Button>
            </div>
          </div>
        </>
      )}

      {/* If already resolved, show resolution info */}
      {isResolved && (
        <>
          <Separator />

          <Alert
            variant="success"
            className="border-green-200 bg-green-50 dark:bg-green-900/20"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Conflict Resolved</AlertTitle>
            <AlertDescription>
              This conflict was resolved using the{" "}
              <strong>{conflict.resolutionStrategy}</strong> strategy
              {conflict.resolvedBy && ` by ${conflict.resolvedBy}`}.
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* Board Mapping and Item Mapping info */}
      <Separator />

      <Tabs defaultValue="entity">
        <TabsList>
          <TabsTrigger value="entity">Entity Info</TabsTrigger>
          <TabsTrigger value="mapping">Mapping Info</TabsTrigger>
        </TabsList>
        <TabsContent value="entity" className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium">Convex Table</h4>
            <p className="text-sm">{conflict.convexTable}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Convex ID</h4>
            <p className="text-sm">{conflict.convexId}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Monday Item ID</h4>
            <p className="text-sm">{conflict.mondayItemId}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Last Monday Update</h4>
            <p className="text-sm">
              {conflict.lastMondayUpdate
                ? formatDate(conflict.lastMondayUpdate)
                : "Unknown"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Last Convex Update</h4>
            <p className="text-sm">
              {conflict.lastConvexUpdate
                ? formatDate(conflict.lastConvexUpdate)
                : "Unknown"}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="mapping" className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium">Board Mapping</h4>
            <p className="text-sm">
              {conflict.boardMapping?.mondayBoardName} →{" "}
              {conflict.boardMapping?.convexTableName}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Sync Direction</h4>
            <p className="text-sm">{conflict.boardMapping?.syncDirection}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Item Mapping ID</h4>
            <p className="text-sm">{conflict.itemMapping?._id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Last Sync</h4>
            <p className="text-sm">
              {conflict.itemMapping?.lastSyncTimestamp
                ? formatDate(conflict.itemMapping.lastSyncTimestamp)
                : "Never"}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
