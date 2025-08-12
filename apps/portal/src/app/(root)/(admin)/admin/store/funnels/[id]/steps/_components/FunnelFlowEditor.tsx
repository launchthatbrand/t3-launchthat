"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { api } from "@convex-config/_generated/api";

import { Button } from "@acme/ui/button";

export function FunnelFlowEditor({ funnelId }: { funnelId: Id<"funnels"> }) {
  const steps = useConvexQuery(api.ecommerce.funnels.queries.getFunnelSteps, {
    funnelId,
  }) as
    | Array<{
        _id: Id<"funnelSteps">;
        type: "landing" | "funnelCheckout" | "upsell" | "order_confirmation";
        position: number;
        label?: string;
        config?: { uiPosition?: { x: number; y: number } };
      }>
    | undefined;

  const updateStep = useConvexMutation(
    api.ecommerce.funnels.mutations.updateFunnelStep,
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    if (!Array.isArray(steps)) return;
    const initialNodes: Node[] = steps.map((s) => ({
      id: s._id as unknown as string,
      position: s.config?.uiPosition ?? { x: 100 + s.position * 80, y: 100 },
      data: { label: s.label ?? s.type },
      type: "default",
    }));
    setNodes(initialNodes);
    setEdges([]);
  }, [steps, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Parameters<typeof addEdge>[0]) =>
      setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const onNodeDragStop = useCallback(
    async (_: unknown, node: Node) => {
      const stepId = node.id as unknown as Id<"funnelSteps">;
      const pos = { x: node.position.x, y: node.position.y };
      try {
        await updateStep({ stepId, config: { uiPosition: pos } as any });
      } catch {
        /* no-op */
      }
    },
    [updateStep],
  );

  const resetLayout = async () => {
    if (!Array.isArray(steps)) return;
    const updated = nodes.map((n, i) => ({
      ...n,
      position: { x: 100 + i * 160, y: 100 },
    }));
    setNodes(updated);
    for (const n of updated) {
      const stepId = n.id as unknown as Id<"funnelSteps">;
      await updateStep({ stepId, config: { uiPosition: n.position } as any });
    }
  };

  return (
    <div className="h-[600px] w-full rounded-md border">
      <div className="flex items-center justify-between border-b p-2">
        <div className="text-sm font-medium">Funnel Flow</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={resetLayout}>
            Auto Layout
          </Button>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
