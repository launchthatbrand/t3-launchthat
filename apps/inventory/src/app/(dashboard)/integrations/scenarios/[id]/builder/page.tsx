"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NodePalette from "@/components/integrations/scenarios/NodePalette";
import { NodeTypeDefinition } from "@/components/integrations/scenarios/NodeTypes";
import ScenarioCanvas from "@/components/integrations/scenarios/ScenarioCanvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Check, Play, Save, Settings } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Define node type interface
interface ScenarioNode {
  id: string;
  type: string;
  position: number;
  config: Record<string, unknown>;
  nodeType: NodeTypeDefinition;
}

export default function ScenarioBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const scenarioId = params.id as Id<"integrations_scenarios">;

  // State for scenario
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeType, setDraggedNodeType] =
    useState<NodeTypeDefinition | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Fetch scenario details
  const scenario = useQuery(api.integrations.scenarios.management.getScenario, {
    scenarioId,
  });

  // Update scenario mutation
  const updateScenario = useMutation(
    api.integrations.scenarios.management.updateScenario,
  );
  const saveScenarioNodes = useMutation(
    api.integrations.scenarios.management.saveScenarioNodes,
  );

  // Initialize nodes from scenario data
  useEffect(() => {
    if (scenario) {
      setScenarioName(scenario.name);
      if (scenario.nodes && scenario.nodes.length > 0) {
        setNodes(
          scenario.nodes.map((node: any) => ({
            ...node,
            id: node.id || uuidv4(),
          })),
        );
      }
    }
  }, [scenario]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const { active } = event;

    // For dragging from palette
    if (active.data?.current?.nodeType) {
      setDraggedNodeType(active.data.current.nodeType);
    }

    // For dragging existing nodes
    if (active.data?.current?.nodeId) {
      setActiveNodeId(active.data.current.nodeId);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setDraggedNodeType(null);
    setActiveNodeId(null);

    const { active, over } = event;

    // Handle dropping new node type onto canvas
    if (
      active.data?.current?.nodeType &&
      over?.data?.current?.type === "canvas"
    ) {
      const nodeType = active.data.current.nodeType as NodeTypeDefinition;

      // Add new node to the scenario
      addNode(nodeType);
    }

    // Handle reordering of nodes (could be implemented here)
  };

  // Add a new node to the scenario
  const addNode = (nodeType: NodeTypeDefinition) => {
    const newNode: ScenarioNode = {
      id: uuidv4(),
      type: nodeType.id,
      position: nodes.length,
      config: {},
      nodeType,
    };

    setNodes((prev) => [...prev, newNode]);
  };

  // Remove a node from the scenario
  const removeNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
  };

  // Reorder nodes in the scenario
  const reorderNodes = (nodeIds: string[]) => {
    // Implement reordering logic here
  };

  // Configure a node in the scenario
  const configureNode = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setActiveTab("config");
  };

  // Save the scenario
  const saveScenario = async () => {
    try {
      // Update the scenario metadata
      await updateScenario({
        scenarioId,
        name: scenarioName,
        status: "draft",
      });

      // Save the nodes configuration
      await saveScenarioNodes({
        scenarioId,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          config: node.config,
        })),
      });

      toast({
        title: "Scenario saved",
        description: "Your scenario has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving scenario",
        description: "There was an error saving your scenario.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/integrations/scenarios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scenarios
            </Link>
          </Button>

          <h1 className="text-2xl font-bold">{scenarioName}</h1>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/integrations/scenarios/${scenarioId}/settings`)
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/integrations/scenarios/${scenarioId}/test`)
            }
          >
            <Play className="mr-2 h-4 w-4" />
            Test Run
          </Button>

          <Button size="sm" onClick={saveScenario}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="builder"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="config">Node Configuration</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-0">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid h-[calc(100vh-250px)] grid-cols-4 gap-6">
              <div className="col-span-1">
                <NodePalette onDragEnd={handleDragEnd} />
              </div>

              <div className="col-span-3">
                <ScenarioCanvas
                  scenarioId={scenarioId}
                  nodes={nodes}
                  onRemoveNode={removeNode}
                  onReorderNodes={reorderNodes}
                  onConfigureNode={configureNode}
                />
              </div>

              {isDragging && draggedNodeType && (
                <DragOverlay>
                  <Card className={`w-64 border-2 ${draggedNodeType.color}`}>
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-md bg-white bg-opacity-50 p-1.5">
                          {draggedNodeType.icon}
                        </div>
                        <div className="font-medium">
                          {draggedNodeType.name}
                        </div>
                      </div>
                    </div>
                  </Card>
                </DragOverlay>
              )}
            </div>
          </DndContext>
        </TabsContent>

        <TabsContent value="config" className="mt-0">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            {activeNodeId ? (
              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  Configure Node:{" "}
                  {nodes.find((n) => n.id === activeNodeId)?.nodeType.name}
                </h2>

                <div className="rounded-lg border bg-white p-4">
                  <p className="text-gray-500">
                    Node configuration interface will be displayed here. This
                    could include forms for configuring the node's settings,
                    inputs, and outputs.
                  </p>

                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setActiveTab("builder")}>
                      <Check className="mr-2 h-4 w-4" />
                      Apply Changes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500">Select a node to configure</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="test" className="mt-0">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-4 text-xl font-semibold">Test & Debug</h2>
            <p className="text-gray-500">
              Testing interface for the scenario will be displayed here. This
              could include test inputs, execution logs, and debugging
              information.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
