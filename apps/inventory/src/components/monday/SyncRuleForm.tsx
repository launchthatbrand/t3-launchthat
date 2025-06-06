"use client";

import { Alert, AlertDescription } from "@acme/ui/alert";
import { ColumnValueMapper, ColumnValueMappingItem } from "./ColumnValueMapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { RuleTester } from "./RuleTester";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";

// Define the board mapping type
interface BoardMapping {
  _id: string;
  mondayBoardName: string;
  convexTableName: string;
  convexTableDisplayName?: string;
}

type TriggerType =
  | "onCreate"
  | "onUpdate"
  | "onStatusChange"
  | "onFieldValue"
  | "onCheckout"
  | "onSchedule"
  | "onManualTrigger";

type ActionType =
  | "push"
  | "pull"
  | "updateField"
  | "createItem"
  | "updateItem"
  | "createRelated";

interface SyncRuleFormData {
  name: string;
  description: string;
  isEnabled: boolean;
  boardMappingId: string;

  // Trigger configuration
  triggerType: TriggerType;
  triggerTable: string;
  triggerField?: string;
  triggerValue?: string;

  // Action configuration
  actionType: ActionType;
  actionConfig: string;

  priority: number;
  cooldownMs?: number;
}

interface TableInfo {
  name: string;
  displayName: string;
}

interface SyncRule {
  _id: Id<"mondaySyncRules">;
  name: string;
  description?: string;
  isEnabled: boolean;
  boardMappingId: string;
  triggerType: TriggerType;
  triggerTable: string;
  triggerField?: string;
  triggerValue?: string;
  actionType: ActionType;
  actionConfig: string;
  priority: number;
  cooldownMs?: number;
}

export interface SyncRuleFormProps {
  integrationId: Id<"mondayIntegration">;
  boardMappings: BoardMapping[];
  ruleId?: Id<"mondaySyncRules">;
  onSuccess: () => void;
}

export function SyncRuleForm({
  integrationId,
  boardMappings,
  ruleId,
  onSuccess,
}: SyncRuleFormProps) {
  const [activeTab, setActiveTab] = useState("trigger");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valueMappings, setValueMappings] = useState<ColumnValueMappingItem[]>(
    [],
  );
  const [formValues, setFormValues] = useState<any>(null);

  // Fetch available tables
  const availableTables = useQuery(
    api.monday.queries.getAvailableTablesForRules,
  ) as TableInfo[] | undefined;

  // If editing, fetch the rule details
  const rule = useQuery(
    api.monday.queries.getSyncRule,
    ruleId ? { ruleId } : "skip",
  ) as SyncRule | undefined;

  // Mutations
  const createRule = useMutation(api.monday.mutations.createSyncRule);
  const updateRule = useMutation(api.monday.mutations.updateSyncRule);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SyncRuleFormData>({
    defaultValues: {
      name: "",
      description: "",
      isEnabled: true,
      boardMappingId: boardMappings[0]?._id ?? "",
      triggerType: "onCreate" as TriggerType,
      triggerTable: "products",
      actionType: "push" as ActionType,
      actionConfig: JSON.stringify(
        {
          boardMappingId: boardMappings[0]?._id ?? "",
        },
        null,
        2,
      ),
      priority: 10,
      cooldownMs: 5000,
    },
  });

  // Watch values for conditional rendering
  const triggerType = watch("triggerType");
  const actionType = watch("actionType");
  const selectedBoardMappingId = watch("boardMappingId");
  const triggerTable = watch("triggerTable");
  const triggerField = watch("triggerField");

  // Update form values for the rule tester
  useEffect(() => {
    setFormValues(getValues());
  }, [
    getValues,
    triggerType,
    actionType,
    selectedBoardMappingId,
    triggerTable,
  ]);

  // Populate form with rule data if editing
  useEffect(() => {
    if (rule) {
      setValue("name", rule.name);
      setValue("description", rule.description ?? "");
      setValue("isEnabled", rule.isEnabled);
      setValue("boardMappingId", rule.boardMappingId);
      setValue("triggerType", rule.triggerType);
      setValue("triggerTable", rule.triggerTable);
      if (rule.triggerField) setValue("triggerField", rule.triggerField);
      if (rule.triggerValue) setValue("triggerValue", rule.triggerValue);
      setValue("actionType", rule.actionType);
      setValue("actionConfig", rule.actionConfig);
      setValue("priority", rule.priority);
      if (rule.cooldownMs) setValue("cooldownMs", rule.cooldownMs);

      // Try to extract value mappings from the action config
      try {
        const actionConfig = JSON.parse(rule.actionConfig);
        if (actionConfig.valueMappings) {
          setValueMappings(actionConfig.valueMappings);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [rule, setValue]);

  // Initialize action config when board mapping changes
  useEffect(() => {
    if (selectedBoardMappingId && actionType === "push") {
      const actionConfig = {
        boardMappingId: selectedBoardMappingId,
      };
      setValue("actionConfig", JSON.stringify(actionConfig, null, 2));
    }
  }, [selectedBoardMappingId, actionType, setValue]);

  // Handle value mappings change
  const handleValueMappingsChange = (mappings: ColumnValueMappingItem[]) => {
    setValueMappings(mappings);
  };

  // Handle form submission
  const onSubmit = async (data: SyncRuleFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse and update action config with value mappings
      let actionConfigObj;
      try {
        actionConfigObj = JSON.parse(data.actionConfig);
        if (valueMappings.length > 0) {
          actionConfigObj.valueMappings = valueMappings;
        }
        data.actionConfig = JSON.stringify(actionConfigObj, null, 2);
      } catch {
        throw new Error("Invalid JSON in action configuration");
      }

      if (ruleId) {
        // Update existing rule
        await updateRule({
          ruleId,
          ...data,
        });
      } else {
        // Create new rule
        await createRule({
          ...data,
          integrationId,
        });
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger field options based on trigger type
  const showTriggerField = [
    "onUpdate",
    "onStatusChange",
    "onFieldValue",
  ].includes(triggerType);
  const showTriggerValue = triggerType === "onFieldValue";
  const showValueMapper =
    (triggerType === "onStatusChange" || triggerType === "onFieldValue") &&
    triggerField !== undefined &&
    triggerField.length > 0;

  if (!availableTables) {
    return <Skeleton className="h-96" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="trigger">Trigger</TabsTrigger>
          <TabsTrigger value="action">Action</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="Enter a descriptive name for this rule"
                {...register("name", { required: "Rule name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this rule does and when it should trigger"
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="boardMappingId">Board Mapping</Label>
              <Select
                defaultValue={boardMappings[0]?._id ?? ""}
                onValueChange={(value) => setValue("boardMappingId", value)}
                value={watch("boardMappingId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a board mapping" />
                </SelectTrigger>
                <SelectContent>
                  {boardMappings.map((mapping) => (
                    <SelectItem key={mapping._id} value={mapping._id}>
                      {mapping.mondayBoardName} ↔{" "}
                      {mapping.convexTableDisplayName ??
                        mapping.convexTableName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isEnabled">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={watch("isEnabled")}
                  onCheckedChange={(checked) => setValue("isEnabled", checked)}
                />
                <Label htmlFor="isEnabled">
                  {watch("isEnabled") ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  {...register("priority", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values run first (1 is highest priority)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldownMs">Cooldown (ms)</Label>
                <Input
                  id="cooldownMs"
                  type="number"
                  min="0"
                  step="1000"
                  {...register("cooldownMs", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum time between trigger executions
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Trigger Tab */}
        <TabsContent value="trigger" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="triggerType">Trigger Type</Label>
              <Select
                defaultValue="onCreate"
                onValueChange={(value) =>
                  setValue("triggerType", value as TriggerType)
                }
                value={triggerType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select when this rule should trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onCreate">
                    When an item is created
                  </SelectItem>
                  <SelectItem value="onUpdate">
                    When an item is updated
                  </SelectItem>
                  <SelectItem value="onStatusChange">
                    When a status field changes
                  </SelectItem>
                  <SelectItem value="onFieldValue">
                    When a field has a specific value
                  </SelectItem>
                  <SelectItem value="onCheckout">
                    When a product is checked out
                  </SelectItem>
                  <SelectItem value="onSchedule">On a schedule</SelectItem>
                  <SelectItem value="onManualTrigger">
                    Manual trigger only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerTable">Table</Label>
              <Select
                defaultValue={availableTables[0]?.name ?? ""}
                onValueChange={(value) => setValue("triggerTable", value)}
                value={watch("triggerTable")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showTriggerField && (
              <div className="space-y-2">
                <Label htmlFor="triggerField">Field</Label>
                <Input
                  id="triggerField"
                  placeholder="Enter the field name to monitor"
                  {...register("triggerField", {
                    required: "Field is required for this trigger type",
                  })}
                />
                {errors.triggerField && (
                  <p className="text-sm text-destructive">
                    {errors.triggerField.message}
                  </p>
                )}
              </div>
            )}

            {showTriggerValue && (
              <div className="space-y-2">
                <Label htmlFor="triggerValue">Value</Label>
                <Input
                  id="triggerValue"
                  placeholder="Enter the value to match"
                  {...register("triggerValue", {
                    required: "Value is required for this trigger type",
                  })}
                />
                {errors.triggerValue && (
                  <p className="text-sm text-destructive">
                    {errors.triggerValue.message}
                  </p>
                )}
              </div>
            )}

            {showValueMapper && (
              <div className="mt-4">
                <ColumnValueMapper
                  integrationId={integrationId}
                  boardMappingId={selectedBoardMappingId}
                  initialMappings={valueMappings}
                  convexFieldName={triggerField}
                  onMappingsChange={handleValueMappingsChange}
                />
              </div>
            )}

            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">Trigger Explanation</h3>
              <p className="text-sm text-muted-foreground">
                {triggerType === "onCreate" &&
                  "This rule will trigger when a new record is created in the selected table."}
                {triggerType === "onUpdate" &&
                  "This rule will trigger when a record is updated in the selected table and the specified field changes."}
                {triggerType === "onStatusChange" &&
                  "This rule will trigger when the status field of a record changes in the selected table."}
                {triggerType === "onFieldValue" &&
                  "This rule will trigger when the specified field of a record matches the specified value."}
                {triggerType === "onCheckout" &&
                  "This rule will trigger when a product is checked out (specific to e-commerce functionality)."}
                {triggerType === "onSchedule" &&
                  "This rule will trigger on a regular schedule rather than in response to database changes."}
                {triggerType === "onManualTrigger" &&
                  "This rule will only trigger when manually executed through the API or UI."}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Action Tab */}
        <TabsContent value="action" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select
                defaultValue="push"
                onValueChange={(value) =>
                  setValue("actionType", value as ActionType)
                }
                value={actionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select what this rule should do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push to Monday.com</SelectItem>
                  <SelectItem value="pull">Pull from Monday.com</SelectItem>
                  <SelectItem value="updateField">
                    Update a field in Convex
                  </SelectItem>
                  <SelectItem value="createItem">
                    Create new item in Monday.com
                  </SelectItem>
                  <SelectItem value="updateItem">
                    Update item in Monday.com
                  </SelectItem>
                  <SelectItem value="createRelated">
                    Create related item in Monday.com
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionConfig">Action Configuration (JSON)</Label>
              <Textarea
                id="actionConfig"
                className="h-60 font-mono"
                {...register("actionConfig", {
                  required: "Action configuration is required",
                })}
              />
              {errors.actionConfig && (
                <p className="text-sm text-destructive">
                  {errors.actionConfig.message}
                </p>
              )}
            </div>

            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">Action Configuration Guide</h3>
              <p className="text-sm text-muted-foreground">
                {actionType === "push" &&
                  "For push actions, include the boardMappingId in the configuration JSON."}
                {actionType === "pull" &&
                  "For pull actions, include the boardMappingId in the configuration JSON."}
                {actionType === "updateField" &&
                  "For update field actions, include the table, field, and value to set."}
                {actionType === "createItem" &&
                  "For create item actions, include the targetBoardId and itemTemplate with field values."}
                {actionType === "updateItem" &&
                  "For update item actions, include the targetBoardId, itemId, and fields to update."}
                {actionType === "createRelated" &&
                  "For related item actions, include the targetBoardId, itemTemplate, and mappingField."}
              </p>

              <div className="mt-2 text-xs">
                <p className="font-medium">Example Configuration:</p>
                <pre className="overflow-x-auto rounded bg-background p-2">
                  {actionType === "push" &&
                    `{
  "boardMappingId": "${selectedBoardMappingId}"
}`}
                  {actionType === "pull" &&
                    `{
  "boardMappingId": "${selectedBoardMappingId}"
}`}
                  {actionType === "updateField" &&
                    `{
  "table": "products",
  "field": "status",
  "value": "synced",
  "valueType": "static"
}`}
                  {actionType === "createItem" &&
                    `{
  "targetBoardId": "12345678",
  "itemTemplate": {
    "name": "New Item",
    "status": "Active"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <RuleTester
            integrationId={integrationId}
            ruleId={ruleId}
            ruleDraft={formValues}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : ruleId ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}
