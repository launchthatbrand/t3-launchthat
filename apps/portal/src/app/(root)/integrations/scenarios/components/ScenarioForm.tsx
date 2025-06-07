"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ArrowDown, Loader2, Plus, Save } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
} from "@acme/ui";

import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { formSchema, FormValues } from "../types";
import { validateScenarioForm } from "../utils";
import { ScenarioNode } from "./ScenarioNode";

interface ScenarioFormProps {
  scenarioId: Id<"scenarios"> | null;
  isCreatingMode: boolean;
}

/**
 * ScenarioForm component handles the form for creating/editing a scenario
 */
export function ScenarioForm({
  scenarioId,
  isCreatingMode,
}: ScenarioFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];
  const connections =
    useQuery(api.integrations.connections.queries.list, {}) ?? [];
  const systemUser = useQuery(api.users.queries.getSystemUser);
  const existingScenario = useQuery(
    api.integrations.scenarios.queries.getById,
    scenarioId ? { id: scenarioId } : "skip",
  );
  const existingNodes =
    useQuery(
      api.integrations.nodes.queries.listByScenario,
      scenarioId ? { scenarioId } : "skip",
    ) ?? [];

  // Mutations
  const createScenario = useMutation(
    api.integrations.scenarios.mutations.create,
  );
  const updateScenario = useMutation(
    api.integrations.scenarios.mutations.update,
  );
  const createNode = useMutation(api.integrations.nodes.mutations.create);
  const updateNode = useMutation(api.integrations.nodes.mutations.update);
  const deleteNode = useMutation(api.integrations.nodes.mutations.remove);
  const createSystemUser = useMutation(
    api.users.mutations.createSystemUserIfNeeded,
  );

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nodes: [
        {
          id: `node-${Date.now()}`, // Temporary client-side ID for new nodes
          type: "trigger",
          app: "",
          isExpanded: true,
        },
      ],
    },
  });

  // Load existing scenario data when available
  useEffect(() => {
    if (existingScenario && existingNodes.length > 0) {
      // Sort nodes by order
      const sortedNodes = [...existingNodes].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );

      // Transform nodes to match form schema
      const formNodes = sortedNodes.map((node, index) => {
        // Parse the node config
        const config = node.config ? JSON.parse(node.config as string) : {};

        // Extract app name from node type (e.g., wordpress_trigger -> wordpress)
        const appMatch = (node.type as string).match(/^([^_]+)_/);
        const appTypeName = appMatch ? appMatch[1] : "";

        // Find the app ID from the name
        const appInfo = apps.find((a) => a.name.toLowerCase() === appTypeName);
        const appId = appInfo?._id ?? "";

        return {
          id: node._id as string,
          type: index === 0 ? ("trigger" as const) : ("action" as const),
          app: appId, // Use app ID instead of name
          connectionId: config.connectionId,
          action: config.action,
          config: config.config ?? {},
          isExpanded: index === 0, // Only expand the first node by default
        };
      });

      // Update form values
      form.reset({
        name: existingScenario.name as string,
        nodes:
          formNodes.length > 0
            ? formNodes
            : [
                {
                  id: `node-${Date.now()}`,
                  type: "trigger",
                  app: "",
                  isExpanded: true,
                },
              ],
      });
    }
  }, [existingScenario, existingNodes, form, apps]);

  // Set up field array for nodes
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nodes",
  });

  // Add a new node to the scenario
  const addNode = () => {
    append(
      {
        id: `node-${Date.now()}`,
        type: "action",
        app: "",
        isExpanded: true,
      },
      { shouldFocus: false },
    );
  };

  // Toggle node expansion
  const toggleNodeExpand = (index: number) => {
    const currentValue = form.getValues(`nodes.${index}.isExpanded`);
    form.setValue(`nodes.${index}.isExpanded`, !currentValue);
  };

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", JSON.stringify(values, null, 2));
    setIsSaving(true);

    try {
      // Validate form values
      if (!validateScenarioForm(values)) {
        setIsSaving(false);
        return;
      }

      try {
        console.log("Getting system user...");
        // Get or create a system user ID for ownership
        let ownerId;
        if (systemUser) {
          ownerId = systemUser._id;
          console.log("Using existing system user:", ownerId);
        } else {
          // Create a system user if none exists
          console.log("Creating system user...");
          ownerId = await createSystemUser({});
          console.log("Created system user:", ownerId);
        }

        if (!ownerId) {
          throw new Error("Failed to get or create system user");
        }

        // Update or create the scenario
        let currentScenarioId = scenarioId;
        try {
          if (!currentScenarioId) {
            // Create new scenario
            console.log("Creating new scenario...");
            currentScenarioId = await createScenario({
              name: values.name,
              description: "", // Empty description as it's no longer needed
              status: "draft",
              ownerId,
            });
            console.log("Created scenario:", currentScenarioId);
          } else {
            // Update existing scenario
            console.log("Updating existing scenario:", currentScenarioId);
            await updateScenario({
              id: currentScenarioId,
              name: values.name,
            });
            console.log("Updated scenario");

            // Delete nodes that are no longer in the form
            const nodeIdsInForm = values.nodes
              .map((n) => n.id)
              .filter((id) => id.startsWith("nod_")); // Only include actual DB IDs

            console.log("Node IDs in form:", nodeIdsInForm);

            const nodesToDelete = existingNodes.filter(
              (node) => !nodeIdsInForm.includes(node._id as string),
            );

            console.log("Nodes to delete:", nodesToDelete.length);
            for (const node of nodesToDelete) {
              try {
                console.log("Deleting node:", node._id);
                await deleteNode({ id: node._id as Id<"nodes"> });
              } catch (deleteError) {
                console.error("Error deleting node:", deleteError);
                toast.error("Failed to delete an existing node");
                // Continue with other nodes despite this error
              }
            }
          }

          // Create or update all nodes
          console.log("Processing nodes...");
          console.log("Total nodes to process:", values.nodes.length);

          let order = 1;
          const createdNodeIds = [];

          for (const node of values.nodes) {
            console.log(
              `Processing node ${order}:`,
              JSON.stringify(node, null, 2),
            );

            if (!node.app || !node.connectionId || !node.action) {
              console.warn("Skipping node with missing required fields:", node);
              continue;
            }

            // Find app using the ID directly
            const selectedApp = apps.find((a) => a._id === node.app);
            if (!selectedApp) {
              console.error(
                `App not found for ID: "${node.app}". Available apps: ${JSON.stringify(apps.map((a) => ({ id: a._id, name: a.name })))}`,
              );
              toast.error(
                `App not found. Please select a valid app from the dropdown.`,
              );
              continue;
            }

            // Get app name for use in node configuration
            const appName = selectedApp.name;
            const appNameLower = selectedApp.name.toLowerCase();

            // Find action details
            const actionDetails = node.action;
            if (!actionDetails) {
              console.warn("Action details not found:", node.action);
              continue;
            }

            // Create node config
            const nodeConfig = {
              connectionId: node.connectionId ?? "",
              action: node.action ?? "",
              config: node.config ?? {},
              // Include sample data and schema if available
              sampleData: node.sampleData ?? null,
              schema: node.schema ?? [],
            };

            // Determine node type
            const nodeType =
              node.type === "trigger"
                ? `${appNameLower}_trigger`
                : `${appNameLower}_action`;

            try {
              let configString;
              try {
                configString = JSON.stringify(nodeConfig);
                console.log(
                  "Node config serialized successfully:",
                  configString,
                );
              } catch (jsonError) {
                console.error("Error stringifying node config:", jsonError);
                toast.error("Invalid node configuration format");
                throw new Error("Failed to stringify node configuration");
              }

              if (node.id.startsWith("nod_")) {
                // It's an existing node, update it
                console.log("Updating existing node:", node.id);
                try {
                  await updateNode({
                    id: node.id as Id<"nodes">,
                    label: `${appName}: ${actionDetails}`,
                    config: configString,
                    position: JSON.stringify({ x: 100, y: 100 * order }),
                    order,
                    // Add sample data if available
                    ...(node.sampleData
                      ? { sampleData: JSON.stringify(node.sampleData) }
                      : {}),
                    ...(node.schema
                      ? { schema: JSON.stringify(node.schema) }
                      : {}),
                  });
                  console.log("Node updated successfully");
                  createdNodeIds.push(node.id);
                } catch (updateError) {
                  console.error("Error updating node:", updateError);
                  toast.error(
                    updateError instanceof Error
                      ? updateError.message
                      : "Failed to update node",
                  );
                  throw updateError;
                }
              } else {
                // It's a new node, create it
                console.log(
                  "Creating new node for scenario:",
                  currentScenarioId,
                );
                try {
                  console.log("Creating node with data:", {
                    scenarioId: currentScenarioId,
                    type: nodeType,
                    label: `${appName}: ${actionDetails}`,
                    config: configString,
                    position: JSON.stringify({ x: 100, y: 100 * order }),
                    order,
                    // Add sample data if available
                    ...(node.sampleData
                      ? { sampleData: JSON.stringify(node.sampleData) }
                      : {}),
                    ...(node.schema
                      ? { schema: JSON.stringify(node.schema) }
                      : {}),
                  });

                  const newNodeId = await createNode({
                    scenarioId: currentScenarioId,
                    type: nodeType,
                    label: `${appName}: ${actionDetails}`,
                    config: configString,
                    position: JSON.stringify({ x: 100, y: 100 * order }),
                    order,
                    // Add sample data if available
                    ...(node.sampleData
                      ? { sampleData: JSON.stringify(node.sampleData) }
                      : {}),
                    ...(node.schema
                      ? { schema: JSON.stringify(node.schema) }
                      : {}),
                  });
                  console.log("Node created successfully:", newNodeId);
                  createdNodeIds.push(newNodeId);
                } catch (createError) {
                  console.error("Error creating node:", createError);
                  toast.error(
                    createError instanceof Error
                      ? createError.message
                      : "Failed to create node",
                  );
                  throw createError;
                }
              }
            } catch (nodeError) {
              console.error("Error processing node:", nodeError);
              toast.error(
                nodeError instanceof Error
                  ? nodeError.message
                  : "Failed to process node",
              );
              throw nodeError;
            }

            order++;
          }

          console.log("Successfully processed nodes:", createdNodeIds);

          // Navigate to the scenario page if we were in create mode
          if (isCreatingMode) {
            console.log("Redirecting to scenario page...");
            toast.success("Your new scenario has been created successfully.");
            router.push(`/integrations/scenarios/${currentScenarioId}`);
          } else {
            toast.success("Your scenario has been updated successfully.");
          }
        } catch (scenarioError) {
          console.error("Error with scenario:", scenarioError);
          toast.error(
            scenarioError instanceof Error
              ? scenarioError.message
              : "Failed to save scenario",
          );
          throw scenarioError;
        }
      } catch (userError) {
        console.error("Error with system user:", userError);
        toast.error("Failed to get or create system user");
        throw userError;
      }
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save scenario",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canCreateScenario = apps.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Details</CardTitle>
        <CardDescription>Configure your automation scenario</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Integration Workflow" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your automation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-6" />

            <div>
              <h3 className="mb-4 text-lg font-medium">Workflow Steps</h3>
              <div className="space-y-1">
                {fields.map((node, index) => (
                  <div key={node.id} className="relative">
                    {index > 0 && (
                      <div className="absolute -top-4 left-1/2 -ml-2 flex h-4 justify-center">
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <ScenarioNode
                      index={index}
                      isFirst={index === 0}
                      availableApps={apps}
                      connections={connections}
                      onRemove={() => remove(index)}
                      register={form.register}
                      control={form.control}
                      setValue={form.setValue}
                      watch={form.watch}
                      toggleExpand={() => toggleNodeExpand(index)}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={addNode}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/integrations?tab=scenarios")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving || !canCreateScenario}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreatingMode ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isCreatingMode ? "Create" : "Save"} Scenario
                  </>
                )}
              </Button>
            </div>

            {!canCreateScenario && (
              <p className="mt-2 text-center text-sm text-yellow-600">
                You need available apps and connections to create a scenario.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
