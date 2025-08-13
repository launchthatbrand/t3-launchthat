"use client";

import "@xyflow/react/dist/style.css";

import type { Id } from "@convex-config/_generated/dataModel";
import type { Connection, Edge, Node, ReactFlowInstance } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { api } from "@convex-config/_generated/api";
import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
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

export type ScenarioGraphProps = {
  scenarioId: Id<"scenarios"> | null;
};

type ScenarioShape = {
  _id: Id<"scenarios">;
  nodes: Array<{
    _id: Id<"nodes">;
    label: string;
    position: string;
  }>;
  connections: Array<{
    _id: Id<"nodeConnections">;
    sourceNodeId: Id<"nodes">;
    targetNodeId: Id<"nodes">;
  }>;
};

export const ScenarioGraph = ({ scenarioId }: ScenarioGraphProps) => {
  const scenario = useQuery(
    api.integrations.scenarios.queries.get,
    scenarioId ? { id: scenarioId } : "skip",
  ) as unknown as ScenarioShape | null;

  const updateNode = useMutation(api.integrations.nodes.mutations.update);
  const createNodeMutation = useMutation(
    api.integrations.nodes.mutations.create,
  );
  const removeNodeMutation = useMutation(
    api.integrations.nodes.mutations.remove,
  );
  const createConnection = useMutation(
    api.integrations.nodes.mutations.createConnection,
  );
  const removeConnection = useMutation(
    api.integrations.nodes.mutations.removeConnection,
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const rf = useRef<ReactFlowInstance | null>(null);

  // Build flow state from scenario
  useEffect(() => {
    if (!scenario) return;
    const flowNodes: Node[] = scenario.nodes.map((n) => ({
      id: String(n._id),
      type: "node-with-toolbar",
      position: parsePosition(n.position),
      data: {
        label: n.label,
        onDelete: async (id: string) => {
          await removeNodeMutation({ id: id as unknown as Id<"nodes"> });
          setNodes((curr) => curr.filter((x) => String(x.id) !== id));
          setEdges((curr) =>
            curr.filter((e) => e.source !== id && e.target !== id),
          );
        },
      } as Record<string, unknown>,
    }));

    const flowEdges: Edge[] = scenario.connections.map((c) => ({
      id: `e${String(c.sourceNodeId)}-${String(c.targetNodeId)}`,
      type: "plus",
      source: String(c.sourceNodeId),
      target: String(c.targetNodeId),
      markerEnd: { type: MarkerType.ArrowClosed },
      data: {
        connectionId: String(c._id),
        isRouteConfigEdge: false,
        onInsert: async (src: string, tgt: string) => {
          if (!scenarioId) return;
          // Remove original connection
          await removeConnection({
            id: String(c._id) as unknown as Id<"nodeConnections">,
          });
          // Create new node between src and tgt
          // Compute position roughly midway
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
          const newId = await createNodeMutation({
            scenarioId,
            type: "webhooks_action",
            label: "New Step",
            config: JSON.stringify({
              config: {},
              action: "",
              connectionId: "",
            }),
            position: stringifyPosition(mid),
          });
          // Create two new connections
          const connIdA = await createConnection({
            scenarioId,
            sourceNodeId: src as unknown as Id<"nodes">,
            targetNodeId: newId as Id<"nodes">,
          });
          const connIdB = await createConnection({
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
                data: { label: "New Step" } as Record<string, unknown>,
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
                data: {
                  connectionId: String(connIdA),
                } as Record<string, unknown>,
              } as Edge,
              {
                id: `e${String(newId)}-${tgt}`,
                type: "plus",
                source: String(newId),
                target: tgt,
                markerEnd: { type: MarkerType.ArrowClosed },
                data: { connectionId: String(connIdB) } as Record<
                  string,
                  unknown
                >,
              } as Edge,
            ];
          });
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
      const createId = `create-${String(scenario._id)}-root`;
      laid.push({
        id: createId,
        type: "createNode",
        position: { x: 0, y: 0 },
        data: {
          prevId: undefined,
          onCreate: async () => {
            if (!scenarioId) return;
            const newId = await createNodeMutation({
              scenarioId,
              type: "webhooks_action",
              label: "New Step",
              config: JSON.stringify({
                config: {},
                action: "",
                connectionId: "",
              }),
              position: stringifyPosition({ x: 0, y: 0 }),
            });
            setNodes((curr) =>
              centerNodesX(
                layoutTopBottom(
                  [
                    ...curr.filter((n) => n.id !== createId),
                    {
                      id: String(newId),
                      type: "node-with-toolbar",
                      position: { x: 0, y: 0 },
                      data: { label: "New Step" } as Record<string, unknown>,
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
          },
        } as Record<string, unknown>,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } as Node);
    }

    // Trailing create tile
    else {
      const last = laid.reduce((a, b) => (a.position.y > b.position.y ? a : b));
      const createId = `create-${String(scenario._id)}`;
      laid.push({
        id: createId,
        type: "createNode",
        position: { x: last.position.x, y: last.position.y + 100 },
        data: {
          prevId: String(last.id),
          onCreate: async (prevId: string) => {
            if (!scenarioId) return;
            const y = last.position.y + 100;
            const newId = await createNodeMutation({
              scenarioId,
              type: "webhooks_action",
              label: "New Step",
              config: JSON.stringify({
                config: {},
                action: "",
                connectionId: "",
              }),
              position: stringifyPosition({ x: 0, y }),
            });
            await createConnection({
              scenarioId,
              sourceNodeId: prevId as unknown as Id<"nodes">,
              targetNodeId: newId as Id<"nodes">,
            });
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
                      data: { label: "New Step" } as Record<string, unknown>,
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
    setTimeout(() => rf.current?.fitView({ padding: 0.15, duration: 300 }), 0);
  }, [
    scenario,
    setNodes,
    setEdges,
    scenarioId,
    createNodeMutation,
    createConnection,
    removeConnection,
    removeNodeMutation,
  ]);

  const handleAutoLayout = useCallback(() => {
    setNodes((curr) =>
      centerNodesX(
        layoutTopBottom(curr, edges).nodes.map((n) => ({
          ...n,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })),
      ),
    );
  }, [edges, setNodes]);

  const handleConnect = useCallback(
    async (conn: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            type: "plus",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds,
        ),
      );
      if (!scenarioId) return;
      // persist connection
      await createConnection({
        scenarioId,
        sourceNodeId: conn.source as Id<"nodes">,
        targetNodeId: conn.target as Id<"nodes">,
      });
    },
    [createConnection, scenarioId, setEdges],
  );

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

  const isLoading = useMemo(
    () => scenarioId !== null && !scenario,
    [scenarioId, scenario],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          className="xy-theme__button"
          onClick={handleAutoLayout}
          disabled={isLoading}
        >
          Auto Layout
        </button>
        <button
          className="xy-theme__button"
          onClick={handleSavePositions}
          disabled={isLoading}
        >
          Save Positions
        </button>
      </div>
      <div className="h-[640px] w-full rounded border">
        <ReactFlow
          onInit={(inst) => {
            rf.current = inst;
          }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          fitView
          nodesDraggable={false}
          panOnDrag={false}
          zoomOnPinch={false}
          zoomOnScroll={false}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default ScenarioGraph;
