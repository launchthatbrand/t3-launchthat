"use client";

import "@xyflow/react/dist/style.css";

import type { Id } from "@convex-config/_generated/dataModel";
import type {
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex-config/_generated/api";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useMutation, useQuery } from "convex/react";

import CreateNode from "../../../../../../test/react-flow/CreateNode";
import { layoutTopBottom } from "../../../../../../test/react-flow/layoutUtil";
import NodeWithContextMenu from "../../../../../../test/react-flow/NodeWithContextMenu";
import PlusEdgeWithPopover from "../../../../../../test/react-flow/PlusEdgeWithPopover";

// Local helpers
const parsePosition = (pos: string | undefined): { x: number; y: number } => {
  try {
    const v = pos ? JSON.parse(pos) : null;
    if (v && typeof v.x === "number" && typeof v.y === "number") return v;
  } catch {}
  return { x: 0, y: 0 };
};

const stringifyPosition = (pos: { x: number; y: number }): string =>
  JSON.stringify({ x: pos.x, y: pos.y });

const nodeTypes = {
  "node-with-toolbar": (props: any) => <NodeWithContextMenu {...props} />,
  createNode: (props: any) => <CreateNode {...props} />,
} as const;
const edgeTypes = {
  plus: (props: any) => <PlusEdgeWithPopover {...props} />,
} as const;

// Center horizontally around x=0 for nicer fitView centering
const centerNodesX = (arr: Node[]): Node[] => {
  if (arr.length === 0) return arr;
  const xs = arr.map((n) => n.position.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const offset = -(minX + maxX) / 2;
  return arr.map((n) => ({
    ...n,
    position: { x: n.position.x + offset, y: n.position.y },
  }));
};

export interface ScenarioGraphProps {
  scenarioId: Id<"scenarios"> | null;
}

// Available node types for integration scenarios
const AVAILABLE_NODE_TYPES = [
  {
    type: "core.passThrough",
    label: "Pass Through",
    rfType: "node-with-toolbar",
  },
  {
    type: "core.enhancedPassThrough",
    label: "Enhanced Pass Through",
    rfType: "node-with-toolbar",
  },
  {
    type: "webhooks_action",
    label: "Webhook Action",
    rfType: "node-with-toolbar",
  },
  { type: "http.request", label: "HTTP Request", rfType: "node-with-toolbar" },
  {
    type: "data.transform",
    label: "Transform Data",
    rfType: "node-with-toolbar",
  },
] as const;

// Add validation feedback component
const ValidationFeedback = ({
  nodes,
  edges,
  scenarioId,
}: {
  nodes: Node[];
  edges: Edge[];
  scenarioId: Id<"scenarios"> | null;
}) => {
  const validation = useQuery(
    api.integrations.scenarios.reactFlowMutations.validateScenarioGraphQuery,
    scenarioId
      ? {
          nodes: nodes.map((n) => ({
            _id: n.data?.nodeId || n.id,
            type: n.data?.type || "unknown",
            label: n.data?.label || "Untitled",
          })),
          edges: edges.map((e) => ({
            _id: e.id,
            sourceNodeId: e.source,
            targetNodeId: e.target,
          })),
        }
      : "skip",
  );

  if (!validation) return null;

  return (
    <div
      className={`absolute right-4 top-4 z-10 rounded-lg border p-3 ${
        validation.valid
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {validation.valid ? (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Graph Valid</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <div>
              <div className="text-sm font-medium">Graph Invalid</div>
              {validation.error && (
                <div className="mt-1 text-xs">{validation.error}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ScenarioGraph = ({ scenarioId }: ScenarioGraphProps) => {
  // Use the React Flow specific API from Task 9
  const scenarioGraph = useQuery(
    api.integrations.scenarios.reactFlowQueries.getScenarioGraph,
    scenarioId ? { scenarioId } : "skip",
  );

  // Use the React Flow specific mutations from Task 9
  const upsertGraph = useMutation(
    api.integrations.scenarios.reactFlowMutations.upsertScenarioGraph,
  );
  const updateUIState = useMutation(
    api.integrations.scenarios.reactFlowMutations.updateScenarioUIState,
  );
  const createEdge = useMutation(
    api.integrations.scenarios.reactFlowMutations.createScenarioEdge,
  );
  const deleteEdge = useMutation(
    api.integrations.scenarios.reactFlowMutations.deleteScenarioEdge,
  );

  // Legacy mutations for backward compatibility (will be replaced with batch operations)
  const updateNode = useMutation(api.integrations.nodes.mutations.update);
  const createNodeMutation = useMutation(
    api.integrations.nodes.mutations.create,
  );
  const removeNodeMutation = useMutation(
    api.integrations.nodes.mutations.remove,
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const rf = useRef<ReactFlowInstance | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(Date.now());

  // Debounced save function for UI state
  const debouncedSave = useCallback(() => {
    if (!scenarioId || !rf.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!rf.current) return;
        const flow = rf.current.toObject();
        const viewport = rf.current.getViewport();

        // Prepare nodes with React Flow properties
        const formattedNodes = flow.nodes.map((node) => ({
          _id: node.data?.nodeId || undefined,
          type: node.data?.type || "core.passThrough",
          label: node.data?.label || "Untitled",
          config: node.data?.config || {},
          rfType: node.type || "node-with-toolbar",
          rfPosition: node.position,
          rfLabel: node.data?.label,
          rfWidth: node.width,
          rfHeight: node.height,
        }));

        // Create mapping from React Flow node IDs to Convex node IDs
        const rfIdToConvexId = new Map<string, string>();
        flow.nodes.forEach((node) => {
          if (node.data?.nodeId && typeof node.data.nodeId === "string") {
            rfIdToConvexId.set(node.id, node.data.nodeId);
          }
        });

        // Prepare edges - only include edges where both source and target nodes have Convex IDs
        const formattedEdges = flow.edges
          .filter(
            (edge) =>
              rfIdToConvexId.has(edge.source) &&
              rfIdToConvexId.has(edge.target),
          )
          .map((edge) => {
            const sourceNodeId = rfIdToConvexId.get(edge.source);
            const targetNodeId = rfIdToConvexId.get(edge.target);
            if (!sourceNodeId || !targetNodeId) {
              throw new Error(`Missing node ID mapping for edge ${edge.id}`);
            }
            return {
              _id: edge.data?.edgeId || undefined,
              sourceNodeId,
              targetNodeId,
              sourceHandle: edge.sourceHandle || undefined,
              targetHandle: edge.targetHandle || undefined,
              label: typeof edge.label === "string" ? edge.label : undefined,
              animated: edge.animated || undefined,
              style:
                edge.style && typeof edge.style === "object"
                  ? JSON.stringify(edge.style)
                  : undefined,
              order: edge.data?.order || undefined,
            };
          });

        // Save with UI state
        await upsertGraph({
          scenarioId,
          nodes: formattedNodes,
          edges: formattedEdges,
          uiState: {
            viewport,
            selectedNodeIds: flow.nodes
              .filter((n) => n.selected)
              .map((n) => n.id),
          },
        });

        lastSaveRef.current = Date.now();
      } catch (error) {
        console.error(
          "Failed to save scenario graph:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }, 1000); // 1 second debounce
  }, [scenarioId, rf.current, upsertGraph]);

  // Debounced UI state save function with parameters
  const saveUIStateDebounced = useCallback(
    (
      viewport: { x: number; y: number; zoom: number },
      selectedNodeIds: string[],
    ) => {
      if (!scenarioId || !rf.current) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for saving UI state only
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (!rf.current) return;
          const flow = rf.current.toObject();

          // Create mapping from React Flow node IDs to Convex node IDs
          const rfIdToConvexId = new Map<string, string>();
          flow.nodes.forEach((node) => {
            if (node.data?.nodeId && typeof node.data.nodeId === "string") {
              rfIdToConvexId.set(node.id, node.data.nodeId);
            }
          });

          // Save with updated UI state
          await upsertGraph({
            scenarioId,
            nodes: flow.nodes.map((node) => ({
              _id: node.data?.nodeId || undefined,
              type: node.data?.type || "core.passThrough",
              label: node.data?.label || "Untitled",
              config: node.data?.config || {},
              rfType: node.type || "node-with-toolbar",
              rfPosition: node.position,
              rfLabel: node.data?.label,
              rfWidth: node.width,
              rfHeight: node.height,
            })),
            edges: flow.edges
              .filter(
                (edge) =>
                  rfIdToConvexId.has(edge.source) &&
                  rfIdToConvexId.has(edge.target),
              )
              .map((edge) => {
                const sourceNodeId = rfIdToConvexId.get(edge.source);
                const targetNodeId = rfIdToConvexId.get(edge.target);
                if (!sourceNodeId || !targetNodeId) {
                  throw new Error(
                    `Missing node ID mapping for edge ${edge.id}`,
                  );
                }
                return {
                  _id: edge.data?.edgeId || undefined,
                  sourceNodeId,
                  targetNodeId,
                  sourceHandle: edge.sourceHandle || undefined,
                  targetHandle: edge.targetHandle || undefined,
                  label:
                    typeof edge.label === "string" ? edge.label : undefined,
                  animated: edge.animated || undefined,
                  style:
                    edge.style && typeof edge.style === "object"
                      ? JSON.stringify(edge.style)
                      : undefined,
                  order: edge.data?.order || undefined,
                };
              }),
            uiState: {
              viewport,
              selectedNodeIds: selectedNodeIds,
            },
          });

          lastSaveRef.current = Date.now();
        } catch (error) {
          console.error(
            "Failed to save UI state:",
            error instanceof Error ? error.message : String(error),
          );
        }
      }, 500); // Shorter debounce for UI state changes
    },
    [scenarioId, upsertGraph],
  );

  // Validate graph structure and provide real-time feedback
  const validateGraph = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      const errors: string[] = [];

      // Filter out create nodes for validation
      const dataNodes = currentNodes.filter((n) => n.type !== "createNode");

      if (dataNodes.length === 0) {
        return errors; // Empty graph is valid
      }

      // Check for cycles using a simple DFS approach
      const adjacencyList = new Map<string, string[]>();

      // Build adjacency list
      dataNodes.forEach((node) => {
        adjacencyList.set(node.id, []);
      });

      currentEdges.forEach((edge) => {
        if (
          !edge.source.startsWith("create-") &&
          !edge.target.startsWith("create-")
        ) {
          const sourceList = adjacencyList.get(edge.source) || [];
          sourceList.push(edge.target);
          adjacencyList.set(edge.source, sourceList);
        }
      });

      // DFS cycle detection
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (nodeId: string): boolean => {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          recursionStack.add(nodeId);

          const neighbors = adjacencyList.get(nodeId) || [];
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && hasCycle(neighbor)) {
              return true;
            } else if (recursionStack.has(neighbor)) {
              return true;
            }
          }
        }

        recursionStack.delete(nodeId);
        return false;
      };

      for (const node of dataNodes) {
        if (!visited.has(node.id) && hasCycle(node.id)) {
          errors.push(
            "Graph contains cycles. Scenarios must be acyclic (DAG).",
          );
          break;
        }
      }

      // Check for isolated nodes (except if it's the only node)
      if (dataNodes.length > 1) {
        const connectedNodes = new Set<string>();
        currentEdges.forEach((edge) => {
          if (
            !edge.source.startsWith("create-") &&
            !edge.target.startsWith("create-")
          ) {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
          }
        });

        const isolatedNodes = dataNodes.filter(
          (node) => !connectedNodes.has(node.id),
        );
        if (isolatedNodes.length > 0) {
          errors.push(
            `Isolated nodes detected: ${isolatedNodes.map((n) => n.data?.label || n.id).join(", ")}`,
          );
        }
      }

      return errors;
    },
    [],
  );

  // Enhanced node creation function
  const createNodeWithProps = useCallback(
    async (
      nodeType: string,
      position: { x: number; y: number },
      label?: string,
      prevNodeId?: string,
    ) => {
      if (!scenarioId) return null;

      const nodeTypeConfig = AVAILABLE_NODE_TYPES.find(
        (t) => t.type === nodeType,
      );
      if (!nodeTypeConfig) {
        console.error(`Unknown node type: ${nodeType}`);
        return null;
      }

      try {
        const newId = await createNodeMutation({
          scenarioId,
          type: nodeType,
          label: label || nodeTypeConfig.label,
          config: JSON.stringify({}), // Default empty config
          position: stringifyPosition(position),
        });

        // If there's a previous node, create a connection
        if (prevNodeId && newId) {
          await createEdge({
            scenarioId,
            sourceNodeId: prevNodeId as unknown as Id<"nodes">,
            targetNodeId: newId as Id<"nodes">,
          });
        }

        return newId;
      } catch (error) {
        console.error("Failed to create node:", error);
        return null;
      }
    },
    [scenarioId, createNodeMutation, createEdge],
  );

  // Build flow state from scenario graph
  useEffect(() => {
    if (!scenarioGraph) return;

    // Use the React Flow formatted data from Task 9
    const flowNodes: Node[] = scenarioGraph.nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        onDelete: async (id: string) => {
          await removeNodeMutation({ id: id as unknown as Id<"nodes"> });
          setNodes((curr) => curr.filter((x) => String(x.id) !== id));
          setEdges((curr) =>
            curr.filter((e) => e.source !== id && e.target !== id),
          );
        },
      } as Record<string, unknown>,
    }));

    const flowEdges: Edge[] = scenarioGraph.edges.map((e: any) => ({
      id: `e${String(e.source)}-${String(e.target)}`,
      type: "plus",
      source: String(e.source),
      target: String(e.target),
      markerEnd: { type: MarkerType.ArrowClosed },
      data: {
        edgeId: String(e.id),
        isRouteConfigEdge: false,
        onInsert: async (src: string, tgt: string) => {
          if (!scenarioId) return;
          // Remove original edge
          await deleteEdge({ edgeId: e.id });

          // Create new node between src and tgt
          const srcNode = flowNodes.find((n) => String(n.id) === src);
          const tgtNode = flowNodes.find((n) => String(n.id) === tgt);
          const mid = {
            x: Math.round(
              ((srcNode?.position?.x ?? 0) + (tgtNode?.position?.x ?? 0)) / 2,
            ),
            y: Math.round(
              ((srcNode?.position?.y ?? 0) + (tgtNode?.position?.y ?? 0)) / 2,
            ),
          };

          const newId = await createNodeWithProps(
            "core.passThrough",
            mid,
            "New Step",
          );

          if (newId) {
            // Create edges to connect the new node
            await createEdge({
              scenarioId,
              sourceNodeId: src as unknown as Id<"nodes">,
              targetNodeId: newId as Id<"nodes">,
            });
            await createEdge({
              scenarioId,
              sourceNodeId: newId as Id<"nodes">,
              targetNodeId: tgt as unknown as Id<"nodes">,
            });

            // Update local state and re-layout
            setNodes((curr) => {
              const next = [
                ...curr,
                {
                  id: String(newId),
                  type: "node-with-toolbar",
                  position: mid,
                  data: {
                    label: "New Step",
                    type: "core.passThrough",
                  } as Record<string, unknown>,
                  sourcePosition: Position.Bottom,
                  targetPosition: Position.Top,
                } as Node,
              ];
              const laid2 = layoutTopBottom(next, edges).nodes.map((n) => ({
                ...n,
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
              }));
              return centerNodesX(laid2);
            });

            setEdges((curr) => {
              const without = curr.filter(
                (e) => !(e.source === src && e.target === tgt),
              );
              return [
                ...without,
                {
                  id: `e${src}-${String(newId)}`,
                  type: "plus",
                  source: src,
                  target: String(newId),
                  markerEnd: { type: MarkerType.ArrowClosed },
                  data: {} as Record<string, unknown>,
                } as Edge,
                {
                  id: `e${String(newId)}-${tgt}`,
                  type: "plus",
                  source: String(newId),
                  target: tgt,
                  markerEnd: { type: MarkerType.ArrowClosed },
                  data: {} as Record<string, unknown>,
                } as Edge,
              ];
            });
          }
        },
      } as Record<string, unknown>,
    }));

    // Apply vertical layout similar to the test page and center horizontally
    const laid = centerNodesX(
      layoutTopBottom(flowNodes, flowEdges).nodes.map((n) => ({
        ...n,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })),
    );

    // If empty, show root create tile
    if (laid.length === 0) {
      const createId = `create-${String(scenarioId)}-root`;
      laid.push({
        id: createId,
        type: "createNode",
        position: { x: 0, y: 0 },
        data: {
          prevId: undefined,
          allowedKinds: AVAILABLE_NODE_TYPES.map((t) => t.type),
          onCreate: async (
            prevId?: string,
            createId?: string,
            nodeType?: string,
          ) => {
            if (!scenarioId) return;

            const selectedType = nodeType || "core.passThrough";
            const newId = await createNodeWithProps(selectedType, {
              x: 0,
              y: 0,
            });

            if (newId) {
              setNodes((curr) =>
                centerNodesX(
                  layoutTopBottom(
                    [
                      ...curr.filter((n) => n.id !== createId),
                      {
                        id: String(newId),
                        type: "node-with-toolbar",
                        position: { x: 0, y: 0 },
                        data: {
                          label:
                            AVAILABLE_NODE_TYPES.find(
                              (t) => t.type === selectedType,
                            )?.label || "New Step",
                          type: selectedType,
                        } as Record<string, unknown>,
                        sourcePosition: Position.Bottom,
                        targetPosition: Position.Top,
                      } as Node,
                    ],
                    edges,
                  ).nodes.map((n) => ({
                    ...n,
                    sourcePosition: Position.Bottom,
                    targetPosition: Position.Top,
                  })),
                ),
              );
            }
          },
        } as Record<string, unknown>,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } as Node);
    }

    // Trailing create tile
    else {
      const last = laid.reduce((a, b) => (a.position.y > b.position.y ? a : b));
      const createId = `create-${String(scenarioId)}`;
      laid.push({
        id: createId,
        type: "createNode",
        position: { x: last.position.x, y: last.position.y + 100 },
        data: {
          prevId: String(last.id),
          allowedKinds: AVAILABLE_NODE_TYPES.map((t) => t.type),
          onCreate: async (
            prevId: string,
            createId?: string,
            nodeType?: string,
          ) => {
            if (!scenarioId) return;

            const selectedType = nodeType || "core.passThrough";
            const y = last.position.y + 100;
            const newId = await createNodeWithProps(
              selectedType,
              { x: 0, y },
              undefined,
              prevId,
            );

            if (newId) {
              // Local update
              setNodes((curr) =>
                centerNodesX(
                  layoutTopBottom(
                    [
                      ...curr.filter((n) => n.id !== createId),
                      {
                        id: String(newId),
                        type: "node-with-toolbar",
                        position: { x: 0, y },
                        data: {
                          label:
                            AVAILABLE_NODE_TYPES.find(
                              (t) => t.type === selectedType,
                            )?.label || "New Step",
                          type: selectedType,
                        } as Record<string, unknown>,
                        sourcePosition: Position.Bottom,
                        targetPosition: Position.Top,
                      } as Node,
                    ],
                    edges,
                  ).nodes.map((n) => ({
                    ...n,
                    sourcePosition: Position.Bottom,
                    targetPosition: Position.Top,
                  })),
                ),
              );
              setEdges((curr) => [
                ...curr,
                {
                  id: `e${prevId}-${String(newId)}`,
                  type: "plus",
                  source: prevId,
                  target: String(newId),
                  markerEnd: { type: MarkerType.ArrowClosed },
                } as Edge,
              ]);
            }
          },
        } as Record<string, unknown>,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } as Node);

      // Edge from last to create tile
      flowEdges.push({
        id: `e${String(last.id)}-${createId}`,
        type: "plus",
        source: String(last.id),
        target: createId,
        markerEnd: { type: MarkerType.ArrowClosed },
      } as Edge);
    }

    setNodes(laid);
    setEdges(flowEdges);

    // Validate the graph structure
    const errors = validateGraph(laid, flowEdges);
    setValidationErrors(errors);

    // Restore UI state if available
    if (scenarioGraph.uiState && rf.current) {
      rf.current.setViewport(scenarioGraph.uiState.viewport);
      setSelectedNodes(
        scenarioGraph.uiState.selectedNodeIds?.map((id) => String(id)) || [],
      );
    }

    setTimeout(() => rf.current?.fitView({ padding: 0.15, duration: 300 }), 0);
  }, [
    scenarioGraph,
    setNodes,
    setEdges,
    scenarioId,
    createNodeWithProps,
    deleteEdge,
    removeNodeMutation,
    validateGraph,
  ]);

  // Handle viewport changes with debouncing
  const onViewportChange = useCallback(
    (viewport: Viewport) => {
      debouncedSave();
    },
    [debouncedSave],
  );

  // Handle nodes/edges changes with debouncing
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      debouncedSave();
    },
    [setNodes, debouncedSave],
  );

  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      debouncedSave();
    },
    [setEdges, debouncedSave],
  );

  // Handle new node creation from CreateNode component
  const handleNodeCreate = useCallback(
    (newNode: Partial<Node>) => {
      setNodes((nds) => [...nds, newNode as Node]);
      debouncedSave();
    },
    [setNodes, debouncedSave],
  );

  // Save on component unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Force immediate save on unmount if changes were made recently
        if (Date.now() - lastSaveRef.current > 5000) {
          debouncedSave();
        }
      }
    };
  }, [debouncedSave]);

  const handleAutoLayout = useCallback(() => {
    setNodes((curr) => {
      const laid = centerNodesX(
        layoutTopBottom(curr, edges).nodes.map((n) => ({
          ...n,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })),
      );

      // Validate after layout
      const errors = validateGraph(laid, edges);
      setValidationErrors(errors);

      return laid;
    });
  }, [edges, setNodes, validateGraph]);

  const handleConnect = useCallback(
    async (conn: Connection) => {
      const newEdges = addEdge(
        {
          ...conn,
          type: "plus",
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        edges,
      );

      setEdges(newEdges);

      // Validate after connecting
      const errors = validateGraph(nodes, newEdges);
      setValidationErrors(errors);

      if (!scenarioId) return;

      // persist connection using scenarioEdges
      await createEdge({
        scenarioId,
        sourceNodeId: conn.source as Id<"nodes">,
        targetNodeId: conn.target as Id<"nodes">,
      });
    },
    [createEdge, scenarioId, setEdges, edges, nodes, validateGraph],
  );

  // Batch save function that will replace individual mutations
  const handleSaveGraph = useCallback(async () => {
    if (!scenarioId || !rf.current) return;

    // Check for validation errors before saving
    if (validationErrors.length > 0) {
      alert(
        `Cannot save graph with validation errors:\n${validationErrors.join("\n")}`,
      );
      return;
    }

    setIsLoading(true);
    try {
      const currentNodes = rf.current.getNodes();
      const currentEdges = rf.current.getEdges();
      const viewport = rf.current.getViewport();

      // Filter out create nodes
      const dataNodes = currentNodes.filter((n) => n.type !== "createNode");

      // Transform nodes to the format expected by upsertScenarioGraph
      const transformedNodes = dataNodes.map((node) => ({
        _id: node.id as Id<"nodes">,
        type: node.data?.type || "core.passThrough",
        label: node.data?.label || "Untitled",
        config: node.data?.config || {},
        rfType: node.type || "node-with-toolbar",
        rfPosition: node.position,
        rfLabel: node.data?.label,
        rfWidth: node.width,
        rfHeight: node.height,
      }));

      // Transform edges to the format expected by upsertScenarioGraph
      const transformedEdges = currentEdges
        .filter(
          (edge) =>
            !edge.target.startsWith("create-") &&
            !edge.source.startsWith("create-"),
        )
        .map((edge) => ({
          _id: edge.data?.edgeId as Id<"scenarioEdges"> | undefined,
          sourceNodeId: edge.source as Id<"nodes">,
          targetNodeId: edge.target as Id<"nodes">,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label as string | undefined,
          animated: edge.animated,
          style: edge.style ? JSON.stringify(edge.style) : undefined,
          order: edge.data?.order as number | undefined,
        }));

      // Save using batch operation
      await upsertGraph({
        scenarioId,
        nodes: transformedNodes,
        edges: transformedEdges,
        uiState: {
          viewport,
          selectedNodeIds: selectedNodes.map((id) => id as Id<"nodes">),
        },
      });

      setIsDirty(false);
      console.log("Graph saved successfully");
    } catch (error) {
      console.error("Failed to save graph:", error);
      alert(`Failed to save graph: ${error.message || String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId, upsertGraph, validationErrors, selectedNodes]);

  // Legacy position save (will be replaced with batch save)
  const handleSavePositions = useCallback(async () => {
    const inst = rf.current;
    if (!inst) return;
    const currNodes = inst.getNodes();
    await Promise.all(
      currNodes.map((n) =>
        updateNode({
          id: n.id as unknown as Id<"nodes">,
          position: stringifyPosition(n.position),
        }).catch(() => {}),
      ),
    );
  }, [updateNode]);

  // Handle node selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const nodeIds = selectedNodes.map((n) => n.id);
      setSelectedNodes(nodeIds);

      // Save UI state with current selection
      if (rf.current) {
        const viewport = rf.current.getViewport();
        saveUIStateDebounced(viewport, nodeIds);
      }
    },
    [saveUIStateDebounced],
  );

  const isQueryLoading = useMemo(
    () => scenarioId !== null && !scenarioGraph,
    [scenarioId, scenarioGraph],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          className="xy-theme__button"
          onClick={handleAutoLayout}
          disabled={isQueryLoading}
        >
          Auto Layout
        </button>
        <button
          className="xy-theme__button"
          onClick={handleSavePositions}
          disabled={isQueryLoading}
        >
          Save Positions (Legacy)
        </button>
        <button
          className={`xy-theme__button ${
            validationErrors.length === 0
              ? "bg-blue-600 text-white"
              : "cursor-not-allowed bg-gray-400 text-gray-700"
          }`}
          onClick={handleSaveGraph}
          disabled={isQueryLoading || isLoading || validationErrors.length > 0}
        >
          {isLoading ? "Saving..." : "Save Graph"}
        </button>
        {isDirty && (
          <span className="text-sm text-orange-600">Unsaved changes</span>
        )}
        {validationErrors.length > 0 && (
          <span className="text-sm text-red-600">
            ⚠️ {validationErrors.length} validation error
            {validationErrors.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Validation errors display */}
      {validationErrors.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3">
          <h4 className="mb-2 text-sm font-medium text-red-800">
            Graph Validation Errors:
          </h4>
          <ul className="space-y-1 text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="mt-0.5 text-red-500">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="h-[640px] w-full rounded border">
        <ReactFlow
          onInit={(inst) => {
            rf.current = inst;
          }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onViewportChange={onViewportChange}
          onSelectionChange={handleSelectionChange}
          fitView
          nodesDraggable={true}
          panOnDrag={true}
          zoomOnPinch={true}
          zoomOnScroll={true}
          multiSelectionKeyCode="Meta"
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      {/* Add validation feedback */}
      <ValidationFeedback nodes={nodes} edges={edges} scenarioId={scenarioId} />

      {/* Node types legend */}
      <div className="rounded border bg-gray-50 p-3">
        <h4 className="mb-2 text-sm font-medium text-gray-700">
          Available Node Types:
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {AVAILABLE_NODE_TYPES.map((nodeType) => (
            <div key={nodeType.type} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500"></div>
              <span>{nodeType.label}</span>
              <span className="text-gray-500">({nodeType.type})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioGraph;
