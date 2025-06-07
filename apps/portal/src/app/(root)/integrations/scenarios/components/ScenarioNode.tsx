"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui";

import {
  App,
  appActions,
  Connection,
  FormValues,
  SupportedApp,
} from "../types";
import { NodeTester } from "./NodeTester";

interface ScenarioNodeProps {
  index: number;
  isFirst: boolean;
  availableApps: App[];
  connections: Connection[];
  onRemove: () => void;
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
  toggleExpand: () => void;
}

/**
 * ScenarioNode component for the scenario builder
 * Handles displaying and editing a single node in the scenario flow
 */
export function ScenarioNode({
  index,
  isFirst,
  availableApps,
  connections,
  onRemove,
  register,
  control,
  setValue,
  watch,
  toggleExpand,
}: ScenarioNodeProps) {
  const selectedAppId = watch(`nodes.${index}.app`);
  const selectedConnectionId = watch(`nodes.${index}.connectionId`);
  const selectedAction = watch(`nodes.${index}.action`);
  const nodeType = isFirst ? "trigger" : "action";
  const isExpanded = watch(`nodes.${index}.isExpanded`);
  const nodeId = watch(`nodes.${index}.id`);

  // Check if this is a saved node (has a database ID)
  const isSavedNode = nodeId?.startsWith("nod_");

  // Get the selected app details
  const selectedApp = availableApps.find((app) => app._id === selectedAppId);

  // Get the app name and type
  const appName = selectedApp?.name;
  const selectedAppType = appName?.toLowerCase() as SupportedApp;

  // Filter connections by selected app
  const appConnections = connections.filter((conn) => {
    return conn.appId === selectedAppId;
  });

  // Get available actions for the selected app
  const appActionsList =
    appActions[selectedAppType]?.filter((action) =>
      isFirst ? action.type === "trigger" : true,
    ) || [];

  // Handle receiving sample data from the NodeTester
  const handleDataReceived = (
    data: Record<string, unknown> | null,
    schema: string[],
  ) => {
    if (data) {
      setValue(`nodes.${index}.sampleData`, data);
      setValue(`nodes.${index}.schema`, schema);
      console.log(`Sample data saved for node ${index}:`, data);
    }
  };

  return (
    <Card className={`relative mb-2 ${isExpanded ? "border-primary" : ""}`}>
      <div className="absolute right-2 top-2 flex space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleExpand}
          className="h-7 w-7"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {!isFirst && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-7 w-7 text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Badge variant={isFirst ? "default" : "secondary"} className="mr-2">
            {isFirst ? "Trigger" : `Step ${index}`}
          </Badge>
          <CardTitle className="text-lg">
            {appName
              ? `${appName} ${isFirst ? "Trigger" : "Action"}`
              : "Choose App"}
          </CardTitle>
        </div>
        <input
          type="hidden"
          {...register(`nodes.${index}.type`)}
          value={nodeType}
        />
        <input type="hidden" {...register(`nodes.${index}.id`)} />
      </CardHeader>

      <CardContent className={isExpanded ? "" : "hidden"}>
        <div className="space-y-4">
          <FormField
            control={control}
            name={`nodes.${index}.app`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select App</FormLabel>
                {isSavedNode ? (
                  // For saved nodes, show the app name but don't allow changing
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    {appName || "Unknown App"}
                  </div>
                ) : (
                  // For new nodes, show the dropdown
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset connection and action when app changes
                      setValue(`nodes.${index}.connectionId`, undefined);
                      setValue(`nodes.${index}.action`, undefined);
                      // Clear sample data when app changes
                      setValue(`nodes.${index}.sampleData`, undefined);
                      setValue(`nodes.${index}.schema`, undefined);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an app" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableApps.map((app) => (
                        <SelectItem
                          key={app._id || `app-${index}`}
                          value={app._id || ""}
                        >
                          {app.name || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedApp && (
            <FormField
              control={control}
              name={`nodes.${index}.connectionId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Connection</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear sample data when connection changes
                      setValue(`nodes.${index}.sampleData`, undefined);
                      setValue(`nodes.${index}.schema`, undefined);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            appConnections.length > 0
                              ? "Select a connection"
                              : "No connections available"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appConnections.length > 0 ? (
                        appConnections.map((connection) => (
                          <SelectItem
                            key={connection._id || `conn-${index}`}
                            value={connection._id || ""}
                          >
                            {connection.name || "Unnamed Connection"}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No connections available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {appConnections.length === 0 && (
                      <span className="text-yellow-600">
                        You need to create a connection for this app first
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedApp && selectedConnectionId && (
            <FormField
              control={control}
              name={`nodes.${index}.action`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isFirst ? "Select Trigger" : "Select Action"}
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear sample data when action changes
                      setValue(`nodes.${index}.sampleData`, undefined);
                      setValue(`nodes.${index}.schema`, undefined);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            appActionsList.length > 0
                              ? `Select a ${isFirst ? "trigger" : "action"}`
                              : `No ${isFirst ? "triggers" : "actions"} available`
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appActionsList.map((action) => (
                        <SelectItem key={action.id} value={action.id}>
                          {action.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Add the Node Tester if we have all required props */}
          {selectedAppId && selectedConnectionId && selectedAction && (
            <NodeTester
              nodeId={nodeId}
              appId={selectedAppId}
              connectionId={selectedConnectionId}
              action={selectedAction}
              onDataReceived={handleDataReceived}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
