"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MondayIntegrationManager from "@/components/integrations/monday/MondayIntegrationManager";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useConvex,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Edit,
  Loader2,
  Settings,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { ScrollArea } from "@acme/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

const integrationFormSchema = z.object({
  name: z.string().min(1, { message: "Integration name is required" }),
  apiKey: z.string().min(1, { message: "API key is required" }),
  isEnabled: z.boolean().default(true),
  autoSyncIntervalMinutes: z.coerce.number().int().min(0).default(60),
});

interface BoardMapping {
  _id: string;
  mondayBoardId: string;
  mondayBoardName: string;
  convexTableName: string;
  convexTableDisplayName?: string;
  integrationId: string;
  isEnabled: boolean;
  syncDirection: "push" | "pull" | "bidirectional";
  syncStatus: string;
  lastSyncTimestamp?: number;
  supportsSubitems?: boolean;
  syncSettings?: string;
}

interface MondayBoard {
  id: string;
  name: string;
}

interface ConvexTable {
  name: string;
  displayName: string;
}

// Define column mapping type
interface ColumnMapping {
  _id: string;
  boardMappingId: string;
  mondayColumnId: string;
  mondayColumnTitle: string;
  mondayColumnType: string;
  convexField: string;
  convexFieldType: string;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isEnabled: boolean;
  defaultValue?: string;
}

// Define available field type for a Convex table
interface ConvexField {
  name: string;
  type: string;
  isRequired: boolean;
}

// Column Mapping Dialog component
function ColumnMappingDialog({
  isOpen,
  onClose,
  boardMapping,
  onMappingUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  boardMapping: BoardMapping;
  onMappingUpdated: () => void;
}): React.ReactElement {
  const convex = useConvex();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columns, setColumns] = useState<
    { id: string; title: string; type: string }[]
  >([]);
  const [fields, setFields] = useState<ConvexField[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [hasErrors, setHasErrors] = useState(false);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>(
    [],
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftMappings, setDraftMappings] = useState<
    Record<string, string | null>
  >({});

  // Load column data when dialog opens
  useEffect(() => {
    if (isOpen) {
      void loadData();
    }
  }, [isOpen, boardMapping]);

  // Validate mappings when they change
  useEffect(() => {
    validateMappings();
  }, [mappings, fields]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get Monday.com columns for the board
      const columnResult = await convex.action(
        api.monday.actions.getColumnsFromBoard,
        {
          apiKey: "", // Will use stored API key from backend
          boardId: boardMapping.mondayBoardId,
        },
      );

      if (columnResult.success) {
        setColumns(columnResult.columns ?? []);
      } else {
        toast.error(`Failed to load columns: ${columnResult.message}`);
      }

      // Get available fields for the Convex table
      const tableFields = await convex.query(
        api.monday.queries.getTableFields,
        {
          tableName: boardMapping.convexTableName,
        },
      );
      setFields(tableFields);

      // Get existing column mappings
      const existingMappings = await convex.query(
        api.monday.queries.getColumnMappings,
        {
          boardMappingId: boardMapping._id,
        },
      );
      setMappings(existingMappings);

      // Initialize draft mappings from existing mappings
      const initialDraft: Record<string, string | null> = {};
      existingMappings.forEach((mapping) => {
        initialDraft[mapping.mondayColumnId] = mapping.convexField;
      });
      setDraftMappings(initialDraft);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error loading column data:", error);
      toast.error("Failed to load column mapping data");
    } finally {
      setLoading(false);
    }
  };

  const validateMappings = () => {
    // Check if all required fields are mapped
    const requiredFields = fields.filter((field) => field.isRequired);
    const mappedFields = mappings.map((m) => m.convexField);

    const unmappedRequired = requiredFields
      .filter((field) => !mappedFields.includes(field.name))
      .map((field) => field.name);

    setMissingRequiredFields(unmappedRequired);
    setHasErrors(unmappedRequired.length > 0);
  };

  // Function to determine if the column type is compatible with the field type
  const isTypeCompatible = (
    mondayType: string,
    convexType: string,
  ): boolean => {
    // Define type compatibility mapping
    const compatibility: Record<string, string[]> = {
      text: ["string", "id"],
      long_text: ["string"],
      numbers: ["number", "int64"],
      date: ["date", "number"],
      dropdown: ["string"],
      status: ["string"],
      checkbox: ["boolean"],
      people: ["string", "id"],
      email: ["string"],
      phone: ["string"],
      timeline: ["date", "number"],
      file: ["string"],
      link: ["string"],
      rating: ["number"],
      tags: ["string", "array"],
      country: ["string"],
      time: ["date", "number"],
      color_picker: ["string"],
      world_clock: ["string"],
      week: ["date", "number"],
      lookup: ["string", "id"],
      formula: ["string", "number"],
      mirror: ["string", "number", "boolean", "date"],
      dependency: ["string", "id"],
      team: ["string", "id"],
    };

    // If the Monday type is unknown, default to not compatible
    if (!compatibility[mondayType]) {
      return false;
    }

    // Check if the Convex type is compatible with the Monday type
    return compatibility[mondayType].includes(convexType);
  };

  // Function to determine warning message based on type compatibility
  const getTypeWarning = (
    mondayType: string,
    convexType: string,
  ): string | null => {
    if (!isTypeCompatible(mondayType, convexType)) {
      return `Type mismatch: ${mondayType} (Monday) may not be compatible with ${convexType} (Convex)`;
    }
    return null;
  };

  const handleFieldChange = (columnId: string, fieldName: string | null) => {
    setDraftMappings((prev) => ({
      ...prev,
      [columnId]: fieldName,
    }));
    setHasUnsavedChanges(true);
  };

  const saveAllMappings = async () => {
    try {
      setSaving(true);

      for (const [columnId, fieldName] of Object.entries(draftMappings)) {
        const column = columns.find((c) => c.id === columnId);

        if (column) {
          await saveMapping(column, fieldName);
        }
      }

      toast.success("All mappings saved successfully");
      setHasUnsavedChanges(false);
      onMappingUpdated();
    } catch (error) {
      console.error("Error saving mappings:", error);
      toast.error("Failed to save some mappings");
    } finally {
      setSaving(false);
    }
  };

  const saveMapping = async (
    mondayColumn: { id: string; title: string; type: string },
    convexField: string | null,
  ) => {
    try {
      // Find existing mapping
      const existingMapping = mappings.find(
        (m) => m.mondayColumnId === mondayColumn.id,
      );

      if (convexField) {
        // Get field type
        const fieldInfo = fields.find((f) => f.name === convexField);
        const convexFieldType = fieldInfo?.type ?? "string";
        const isRequired = fieldInfo?.isRequired ?? false;

        if (existingMapping) {
          // Update existing mapping
          await convex.mutation(api.monday.mutations.saveColumnMapping, {
            id: existingMapping._id,
            convexField: convexField,
            convexFieldType: convexFieldType,
            isRequired: isRequired,
            isPrimaryKey: convexField === "id",
            isEnabled: true,
          });
        } else {
          // Create new mapping
          await convex.mutation(api.monday.mutations.saveColumnMapping, {
            boardMappingId: boardMapping._id,
            mondayColumnId: mondayColumn.id,
            mondayColumnTitle: mondayColumn.title,
            mondayColumnType: mondayColumn.type,
            convexField: convexField,
            convexFieldType: convexFieldType,
            isRequired: isRequired,
            isPrimaryKey: convexField === "id",
            isEnabled: true,
          });
        }
      } else if (existingMapping) {
        // Remove mapping if field is set to null
        await convex.mutation(api.monday.mutations.deleteColumnMapping, {
          id: existingMapping._id,
        });
      }

      // Refresh mappings after saving
      await loadData();
    } catch (error) {
      console.error("Error saving column mapping:", error);
      throw error;
    }
  };

  const getFieldSelectClass = (
    columnId: string,
    columnType: string,
    mapping?: ColumnMapping,
  ) => {
    if (!mapping?.convexField) return "";

    const fieldInfo = fields.find((f) => f.name === mapping.convexField);
    if (!fieldInfo) return "";

    if (!isTypeCompatible(columnType, fieldInfo.type)) {
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
    }

    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Column Mappings</DialogTitle>
          <DialogDescription>
            Map Monday.com columns to Convex fields for{" "}
            <span className="font-medium">{boardMapping.mondayBoardName}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Mapping {columns.length} columns to {fields.length} fields
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Map Monday.com columns to corresponding Convex fields.
                      Fields marked with * are required.
                    </p>
                  </div>

                  {hasErrors && (
                    <Alert variant="destructive" className="px-3 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="ml-2 text-xs">
                        Required fields not mapped:{" "}
                        {missingRequiredFields.join(", ")}
                      </AlertTitle>
                    </Alert>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monday.com Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Convex Field</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column) => {
                    const mapping = mappings.find(
                      (m) => m.mondayColumnId === column.id,
                    );
                    const selectedField = draftMappings[column.id] ?? "";
                    const fieldInfo = fields.find(
                      (f) => f.name === selectedField,
                    );
                    const typeWarning = fieldInfo
                      ? getTypeWarning(column.type, fieldInfo.type)
                      : null;

                    return (
                      <TableRow key={column.id}>
                        <TableCell>{column.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{column.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={selectedField}
                            onValueChange={(value) =>
                              handleFieldChange(column.id, value || null)
                            }
                          >
                            <SelectTrigger
                              className={`w-[180px] ${getFieldSelectClass(column.id, column.type, mapping)}`}
                            >
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {fields.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  {field.name} ({field.type})
                                  {field.isRequired && " *"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {typeWarning ? (
                            <HoverCard>
                              <HoverCardTrigger>
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300"
                                >
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Type mismatch
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">
                                    Type compatibility warning
                                  </h4>
                                  <p className="text-xs">{typeWarning}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    This mapping may cause data conversion
                                    issues during sync.
                                  </p>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : mapping?.convexField ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Mapped
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300"
                            >
                              Not mapped
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4 flex items-center justify-between">
          <div>
            {hasErrors && (
              <p className="text-xs text-red-500">
                Warning: Some required fields are not mapped.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={saveAllMappings}
              disabled={loading || saving || !hasUnsavedChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Mappings"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Board Mapping Settings Dialog
function BoardSettingsDialog({
  isOpen,
  onClose,
  boardMapping,
  onMappingUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  boardMapping: BoardMapping;
  onMappingUpdated: () => void;
}): React.ReactElement {
  const convex = useConvex();
  const [loading, setLoading] = useState(false);

  // Initialize form with board mapping settings
  const form = useForm({
    defaultValues: {
      isEnabled: boardMapping.isEnabled,
      syncDirection: boardMapping.syncDirection,
      supportsSubitems: boardMapping.supportsSubitems ?? false,
      syncSettings:
        boardMapping.syncSettings ??
        JSON.stringify(
          {
            syncInterval: 30,
            errorRetryCount: 3,
            batchSize: 50,
          },
          null,
          2,
        ),
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Parse JSON for sync settings
      try {
        // If it's a string, try to parse it
        if (typeof values.syncSettings === "string") {
          JSON.parse(values.syncSettings);
        }
      } catch (e) {
        toast.error("Invalid sync settings JSON");
        return;
      }

      const result = await convex.mutation(
        api.monday.client.updateBoardSettings,
        {
          id: boardMapping._id as any, // Type assertion to fix type error
          isEnabled: values.isEnabled,
          syncDirection: values.syncDirection,
          supportsSubitems: values.supportsSubitems,
          syncSettings: values.syncSettings,
        },
      );

      if (result.success) {
        toast.success(result.message);
        onMappingUpdated();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating board settings:", error);
      toast.error("Failed to update board settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
          <DialogDescription>
            Configure advanced settings for {boardMapping.mondayBoardName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enabled</Label>
                <FormDescription>
                  Enable or disable syncing for this board
                </FormDescription>
              </div>
              <Switch
                id="enabled"
                checked={form.watch("isEnabled")}
                onCheckedChange={(checked) =>
                  form.setValue("isEnabled", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="syncDirection">Sync Direction</Label>
              <Select
                value={form.watch("syncDirection")}
                onValueChange={(value) =>
                  form.setValue("syncDirection", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sync direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push (Convex → Monday)</SelectItem>
                  <SelectItem value="pull">Pull (Monday → Convex)</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determine how data should sync between systems
              </FormDescription>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="supportsSubitems">Support Subitems</Label>
                <FormDescription>
                  Enable if this board uses Monday subitems
                </FormDescription>
              </div>
              <Switch
                id="supportsSubitems"
                checked={form.watch("supportsSubitems")}
                onCheckedChange={(checked) =>
                  form.setValue("supportsSubitems", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="syncSettings">Sync Settings (JSON)</Label>
              <Textarea
                id="syncSettings"
                rows={8}
                value={form.watch("syncSettings")}
                onChange={(e) => form.setValue("syncSettings", e.target.value)}
                className="font-mono text-sm"
              />
              <FormDescription>
                Advanced sync settings in JSON format
              </FormDescription>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MondayIntegrationPage() {
  // Get connection ID from URL query parameters
  const searchParams = useSearchParams();
  const connectionId = searchParams.get("id");

  return (
    <div className="container py-10">
      <MondayIntegrationManager
        connectionId={connectionId || undefined}
        defaultTab="overview"
      />
    </div>
  );
}
