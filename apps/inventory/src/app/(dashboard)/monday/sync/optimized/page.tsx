"use client";

import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Loader2,
  RefreshCcw,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Form schema for optimized sync
const optimizedSyncSchema = z.object({
  integrationId: z.string(),
  boardMappingId: z.string(),
  syncDirection: z.enum(["pull", "push", "bidirectional"]),
  forceFullSync: z.boolean().default(false),
  batchSize: z.number().min(5).max(200).optional(),
  pageSize: z.number().min(10).max(500).optional(),
});

type OptimizedSyncFormValues = z.infer<typeof optimizedSyncSchema>;

export default function OptimizedSyncPage() {
  const { toast } = useToast();
  const integration = useQuery(api.monday.queries.getIntegration);
  const boardMappings = useQuery(api.monday.queries.getBoardMappings);
  const latestSyncLogs = useQuery(api.monday.queries.getLatestSyncLogs, {
    limit: 5,
  });

  const runOptimizedPullSync = useMutation(
    api.monday.mutations.runOptimizedPullSync,
  );
  const runOptimizedPushSync = useMutation(
    api.monday.mutations.runOptimizedPushSync,
  );

  const [isRunningSync, setIsRunningSync] = useState(false);
  const [activeBoardMapping, setActiveBoardMapping] = useState<string | null>(
    null,
  );
  const [syncProgress, setSyncProgress] = useState({
    isActive: false,
    percent: 0,
    current: 0,
    total: 0,
    message: "",
  });

  const form = useForm<OptimizedSyncFormValues>({
    resolver: zodResolver(optimizedSyncSchema),
    defaultValues: {
      syncDirection: "pull",
      forceFullSync: false,
      batchSize: 50,
      pageSize: 100,
    },
  });

  // When integration or board mappings change, update the form
  if (
    integration &&
    integration.length > 0 &&
    !form.getValues().integrationId
  ) {
    form.setValue("integrationId", integration[0]._id);
  }

  // Handle form submission
  async function onSubmit(values: OptimizedSyncFormValues) {
    setIsRunningSync(true);
    setSyncProgress({
      isActive: true,
      percent: 0,
      current: 0,
      total: 100,
      message: "Starting sync...",
    });

    try {
      // Get selected board mapping
      const boardMapping = boardMappings?.find(
        (mapping) => mapping._id === values.boardMappingId,
      );

      if (!boardMapping) {
        throw new Error("Selected board mapping not found");
      }

      // Convert string IDs to Convex IDs
      const integrationId = values.integrationId as Id<"mondayIntegration">;
      const boardMappingId = values.boardMappingId as Id<"mondayBoardMappings">;

      // Show initial toast
      toast({
        title: "Starting optimized sync",
        description: `${values.syncDirection === "pull" ? "Pulling" : "Pushing"} data ${
          values.forceFullSync ? "(full sync)" : "(incremental sync)"
        } for board "${boardMapping.mondayBoardName}"`,
      });

      // Run the appropriate sync based on direction
      if (
        values.syncDirection === "pull" ||
        values.syncDirection === "bidirectional"
      ) {
        // Run pull sync
        const pullResult = await runOptimizedPullSync({
          integrationId,
          boardMappingId,
          forceFullSync: values.forceFullSync,
          batchSize: values.batchSize,
          pageSize: values.pageSize,
        });

        // Update progress for pull
        setSyncProgress({
          isActive: true,
          percent: values.syncDirection === "bidirectional" ? 50 : 100,
          current: pullResult.recordsProcessed,
          total: pullResult.recordsProcessed,
          message: `Pull sync completed: ${pullResult.recordsProcessed} records processed`,
        });

        // Show toast for pull completion
        toast({
          title: "Pull sync completed",
          description: `Processed ${pullResult.recordsProcessed} records (${pullResult.recordsCreated} created, ${pullResult.recordsUpdated} updated, ${pullResult.conflictsDetected} conflicts)`,
        });
      }

      // If bidirectional or push, run push sync
      if (
        values.syncDirection === "push" ||
        values.syncDirection === "bidirectional"
      ) {
        // If bidirectional, we've already done pull, so update message
        if (values.syncDirection === "bidirectional") {
          setSyncProgress((prev) => ({
            ...prev,
            message: "Starting push sync phase...",
          }));
        }

        // Run push sync
        const pushResult = await runOptimizedPushSync({
          integrationId,
          boardMappingId,
          forceFullSync: values.forceFullSync,
          batchSize: values.batchSize,
        });

        // Update progress for push
        setSyncProgress({
          isActive: true,
          percent: 100,
          current: pushResult.recordsProcessed,
          total: pushResult.recordsProcessed,
          message: `Push sync completed: ${pushResult.recordsProcessed} records processed`,
        });

        // Show toast for push completion
        toast({
          title: "Push sync completed",
          description: `Processed ${pushResult.recordsProcessed} records (${pushResult.recordsCreated} created, ${pushResult.recordsUpdated} updated)`,
        });
      }

      // Final success toast
      toast({
        title: "Sync operation completed",
        description: "All sync operations have completed successfully.",
      });

      // After a few seconds, reset the progress
      setTimeout(() => {
        setSyncProgress({
          isActive: false,
          percent: 0,
          current: 0,
          total: 0,
          message: "",
        });
      }, 5000);
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });

      // Reset progress on error
      setSyncProgress({
        isActive: false,
        percent: 0,
        current: 0,
        total: 0,
        message: "",
      });
    } finally {
      setIsRunningSync(false);
    }
  }

  // Handle board mapping selection
  const handleBoardMappingChange = (value: string) => {
    form.setValue("boardMappingId", value);
    setActiveBoardMapping(value);
  };

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Optimized Sync for Large Datasets
        </h1>
        <p className="text-muted-foreground">
          Efficiently synchronize large datasets between Monday.com and your
          application with batching and pagination.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configure Sync Operation</CardTitle>
              <CardDescription>
                Set up synchronization parameters for optimal performance with
                large datasets
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Board Mapping Selection */}
                  <FormField
                    control={form.control}
                    name="boardMappingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board Mapping</FormLabel>
                        <Select
                          onValueChange={handleBoardMappingChange}
                          defaultValue={field.value}
                          disabled={isRunningSync}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a board mapping" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {boardMappings?.map((mapping) => (
                              <SelectItem key={mapping._id} value={mapping._id}>
                                {mapping.mondayBoardName} →{" "}
                                {mapping.convexTableDisplayName ||
                                  mapping.convexTable}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose which board mapping to synchronize
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Sync Direction */}
                    <FormField
                      control={form.control}
                      name="syncDirection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sync Direction</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isRunningSync}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sync direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pull">
                                <div className="flex items-center">
                                  <ArrowDown className="mr-2 h-4 w-4" />
                                  Pull (Monday.com → Convex)
                                </div>
                              </SelectItem>
                              <SelectItem value="push">
                                <div className="flex items-center">
                                  <ArrowUp className="mr-2 h-4 w-4" />
                                  Push (Convex → Monday.com)
                                </div>
                              </SelectItem>
                              <SelectItem value="bidirectional">
                                <div className="flex items-center">
                                  <ArrowDownUp className="mr-2 h-4 w-4" />
                                  Bidirectional (Both Ways)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the direction of data synchronization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Force Full Sync */}
                    <FormField
                      control={form.control}
                      name="forceFullSync"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Force Full Sync</FormLabel>
                            <FormDescription>
                              Sync all records instead of only changed ones
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isRunningSync}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Batch Size */}
                    <FormField
                      control={form.control}
                      name="batchSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Size</FormLabel>
                          <div className="flex items-center space-x-4">
                            <FormControl>
                              <Slider
                                min={5}
                                max={200}
                                step={5}
                                value={[field.value || 50]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                                disabled={isRunningSync}
                              />
                            </FormControl>
                            <Input
                              type="number"
                              className="w-20"
                              min={5}
                              max={200}
                              value={field.value || 50}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 50)
                              }
                              disabled={isRunningSync}
                            />
                          </div>
                          <FormDescription>
                            Number of items to process in each batch (5-200)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Page Size (only for pull) */}
                    {form.watch("syncDirection") !== "push" && (
                      <FormField
                        control={form.control}
                        name="pageSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Size</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  min={10}
                                  max={500}
                                  step={10}
                                  value={[field.value || 100]}
                                  onValueChange={(value) =>
                                    field.onChange(value[0])
                                  }
                                  disabled={isRunningSync}
                                />
                              </FormControl>
                              <Input
                                type="number"
                                className="w-20"
                                min={10}
                                max={500}
                                value={field.value || 100}
                                onChange={(e) =>
                                  field.onChange(
                                    parseInt(e.target.value) || 100,
                                  )
                                }
                                disabled={isRunningSync}
                              />
                            </div>
                            <FormDescription>
                              Number of items to fetch per page (10-500)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Progress display */}
                  {syncProgress.isActive && (
                    <div className="mt-4 rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium">Sync Progress</h3>
                        <Badge variant="outline">{syncProgress.percent}%</Badge>
                      </div>
                      <Progress value={syncProgress.percent} className="mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {syncProgress.message}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isRunningSync || !activeBoardMapping}
                    className="w-full"
                  >
                    {isRunningSync ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Sync...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Start Optimized Sync
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Optimized sync uses batching and pagination to efficiently
                handle large datasets.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/monday/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Performance Settings
                </a>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Sync Logs */}
          {latestSyncLogs && latestSyncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Operations</CardTitle>
                <CardDescription>
                  View the status and results of recent synchronization
                  operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestSyncLogs.map((log) => {
                    const details = log.details
                      ? JSON.parse(log.details)
                      : null;
                    return (
                      <div key={log._id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="flex items-center font-medium">
                              {log.syncType === "pull" ? (
                                <ArrowDown className="mr-2 h-4 w-4" />
                              ) : log.syncType === "push" ? (
                                <ArrowUp className="mr-2 h-4 w-4" />
                              ) : (
                                <ArrowDownUp className="mr-2 h-4 w-4" />
                              )}
                              {log.syncType.charAt(0).toUpperCase() +
                                log.syncType.slice(1)}{" "}
                              Sync
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(log.startTimestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              log.status === "completed"
                                ? "success"
                                : log.status === "running"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>

                        {details && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground">Processed</p>
                              <p className="font-medium">
                                {details.recordsProcessed ||
                                  log.recordsProcessed ||
                                  0}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">
                                {details.recordsCreated || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Updated</p>
                              <p className="font-medium">
                                {details.recordsUpdated || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Time (s)</p>
                              <p className="font-medium">
                                {details.timeTaken
                                  ? Math.round(details.timeTaken / 1000)
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        )}

                        {log.error && (
                          <p className="mt-2 text-sm text-red-500">
                            {log.error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm" asChild>
                  <a href="/monday/sync/logs">View All Sync Logs</a>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Right sidebar - info and tips */}
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Tips</CardTitle>
              <CardDescription>
                Recommendations for efficient synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Batch Size</h3>
                  <p className="text-sm text-muted-foreground">
                    Controls how many items are processed in a single batch.
                    Larger batches are more efficient but use more memory.
                  </p>
                  <div className="mt-1 text-sm">
                    <Badge variant="outline" className="mr-1">
                      Recommended: 30-50
                    </Badge>
                    <Badge variant="outline" className="mr-1">
                      Large datasets: 20-30
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Page Size</h3>
                  <p className="text-sm text-muted-foreground">
                    Controls how many items are fetched from Monday.com in each
                    API request. Larger values reduce the number of API calls
                    but increase memory usage.
                  </p>
                  <div className="mt-1 text-sm">
                    <Badge variant="outline" className="mr-1">
                      Recommended: 100
                    </Badge>
                    <Badge variant="outline" className="mr-1">
                      Large datasets: 50-100
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Sync Direction</h3>
                  <p className="text-sm text-muted-foreground">
                    Pull: Get data from Monday.com into your app
                    <br />
                    Push: Send your app data to Monday.com
                    <br />
                    Bidirectional: Both ways (more resource intensive)
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Full vs. Incremental</h3>
                  <p className="text-sm text-muted-foreground">
                    Incremental sync only processes items that have changed
                    since the last sync, which is much faster for large
                    datasets.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Expected performance with different settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-3">
                  <h3 className="font-medium">Small Dataset</h3>
                  <p className="mb-1 text-xs text-muted-foreground">
                    100-500 items
                  </p>
                  <div className="text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <span>Batch Size:</span>
                      <span className="font-medium">50-100</span>
                      <span>Page Size:</span>
                      <span className="font-medium">100-200</span>
                      <span>Estimated Time:</span>
                      <span className="font-medium">10-30 seconds</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <h3 className="font-medium">Medium Dataset</h3>
                  <p className="mb-1 text-xs text-muted-foreground">
                    500-5,000 items
                  </p>
                  <div className="text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <span>Batch Size:</span>
                      <span className="font-medium">30-50</span>
                      <span>Page Size:</span>
                      <span className="font-medium">100</span>
                      <span>Estimated Time:</span>
                      <span className="font-medium">1-5 minutes</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <h3 className="font-medium">Large Dataset</h3>
                  <p className="mb-1 text-xs text-muted-foreground">
                    5,000+ items
                  </p>
                  <div className="text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <span>Batch Size:</span>
                      <span className="font-medium">20-30</span>
                      <span>Page Size:</span>
                      <span className="font-medium">50-100</span>
                      <span>Estimated Time:</span>
                      <span className="font-medium">5-30+ minutes</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  ⚠️ Use incremental sync when possible for large datasets. Full
                  sync of large datasets can take a long time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
