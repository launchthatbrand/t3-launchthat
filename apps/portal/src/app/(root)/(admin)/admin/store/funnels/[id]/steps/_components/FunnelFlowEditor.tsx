"use client";

import "@xyflow/react/dist/style.css";

import type { Id } from "@/convex/_generated/dataModel";
import type { Edge, Node, NodeTypes } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { api } from "@convex-config/_generated/api";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import dagre from "dagre";

import { Button } from "@acme/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";

import { FunnelCheckoutForm } from "./FunnelCheckoutForm";
import { FunnelNode } from "./FunnelNode";

const NODE_W = 360;
const NODE_H = 120;
const GAP = 80;

function layoutTB(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const layoutedNodes: Node[] = nodes.map((n) => {
    const { x, y } = g.node(n.id) as { x: number; y: number };
    return {
      ...n,
      position: { x: x - NODE_W / 2, y: y - NODE_H / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
}

interface StepInitial {
  label?: string;
  position?: number;
  slug?: string;
  config?: Record<string, unknown>;
}

type StepType = "landing" | "funnelCheckout" | "upsell" | "order_confirmation";

export function FunnelFlowEditor({ funnelId }: { funnelId: Id<"funnels"> }) {
  const steps = useConvexQuery(api.ecommerce.funnels.queries.getFunnelSteps, {
    funnelId,
  }) as
    | {
        _id: Id<"funnelSteps">;
        type: StepType;
        position: number;
        label?: string;
        slug?: string;
        config?: { uiPosition?: { x: number; y: number } } & Record<
          string,
          unknown
        >;
      }[]
    | undefined;

  const getEdges = useConvexQuery(
    api.ecommerce.funnels.queries.getFunnelEdges,
    {
      funnelId,
    },
  ) as
    | {
        _id: Id<"funnelEdges">;
        source: Id<"funnelSteps">;
        target: Id<"funnelSteps">;
        label?: string;
      }[]
    | undefined;

  const updateStep = useConvexMutation(
    api.ecommerce.funnels.mutations.updateFunnelStep,
  );
  const addStepMutation = useConvexMutation(
    api.ecommerce.funnels.mutations.addFunnelStep,
  );
  const addEdgeMutation = useConvexMutation(
    api.ecommerce.funnels.mutations.addFunnelEdge,
  );
  const deleteStepMutation = useConvexMutation(
    api.ecommerce.funnels.mutations.deleteFunnelStep,
  );
  const deleteEdgeMutation = useConvexMutation(
    api.ecommerce.funnels.mutations.deleteFunnelEdge,
  );

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<Id<"funnelSteps"> | null>(
    null,
  );
  const [editingStepType, setEditingStepType] = useState<StepType | null>(null);
  const [editingInitial, setEditingInitial] = useState<StepInitial | null>(
    null,
  );

  const nodeTypes = useMemo(
    () => ({ funnelNode: FunnelNode }),
    [],
  ) as unknown as NodeTypes;

  // Build graph from steps + edges
  useEffect(() => {
    if (!Array.isArray(steps)) return;

    const rawNodes: Node[] = steps
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s._id as unknown as string,
        type: "funnelNode",
        position: s.config?.uiPosition ?? { x: 100, y: 100 },
        data: {
          label: s.label ?? s.type,
          onAddAfter: async (newType?: StepType) => {
            const t: StepType = newType ?? "landing";
            const labelByType =
              t === "funnelCheckout"
                ? "Checkout"
                : t === "order_confirmation"
                  ? "Order Confirmation"
                  : "Landing Page";
            const newId = await addStepMutation({
              funnelId,
              type: t,
              position: s.position + 1,
              label: labelByType,
            });
            await addEdgeMutation({
              funnelId,
              source: s._id,
              target: newId as unknown as Id<"funnelSteps">,
            });
            // rely on queries to refresh; layout runs in effect
          },
          onDelete: async () => {
            const stepId = s._id;
            try {
              await deleteStepMutation({ stepId });
            } catch (_e) {
              /* noop */
            }
          },
          onEdit: () => {
            setEditingStepId(s._id);
            setEditingStepType(s.type);
            setEditingInitial({
              label: s.label,
              slug: s.slug,
              position: s.position,
              config: s.config ?? {},
            });
            setSheetOpen(true);
          },
        },
        width: NODE_W,
        height: NODE_H,
      }));

    const rawEdges: Edge[] = (getEdges ?? []).map((e) => ({
      id: String(e._id),
      source: String(e.source),
      target: String(e.target),
      type: "smoothstep",
      animated: false,
      data: { label: e.label },
    }));

    const { nodes: laidNodes, edges: laidEdges } = layoutTB(rawNodes, rawEdges);

    // force single column, top->bottom
    const fixedNodes: Node[] = laidNodes
      .sort((a, b) => a.position.y - b.position.y)
      .map((n, idx) => ({
        ...n,
        position: { x: 0, y: idx * (NODE_H + GAP) },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      }));

    setNodes(fixedNodes);
    setEdges(laidEdges);
  }, [
    steps,
    getEdges,
    setNodes,
    setEdges,
    addStepMutation,
    addEdgeMutation,
    deleteStepMutation,
    funnelId,
  ]);

  const onConnect = useCallback(
    async (connection: Parameters<typeof addEdge>[0]) => {
      const nextEdges = addEdge(connection, edges);
      setEdges(nextEdges);
      const laid = layoutTB(nodes, nextEdges as Edge[]);
      const fixed = laid.nodes
        .sort((a, b) => a.position.y - b.position.y)
        .map((n, i) => ({
          ...n,
          position: { x: 0, y: i * (NODE_H + GAP) },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        }));
      setNodes(fixed);
      await addEdgeMutation({
        funnelId,
        source: connection.source as unknown as Id<"funnelSteps">,
        target: connection.target as unknown as Id<"funnelSteps">,
      });
    },
    [addEdgeMutation, funnelId, nodes, edges, setNodes, setEdges],
  );

  const onNodesDelete = useCallback(
    async (deleted: Node[]) => {
      // delete steps in backend
      for (const n of deleted) {
        const stepId = n.id as unknown as Id<"funnelSteps">;
        try {
          await deleteStepMutation({ stepId });
        } catch (_e) {
          /* noop */
        }
      }
      // re-layout remaining nodes locally
      const remaining = nodes.filter(
        (n) => !deleted.some((d) => d.id === n.id),
      );
      const laid = layoutTB(remaining, edges);
      const fixed = laid.nodes
        .sort((a, b) => a.position.y - b.position.y)
        .map((n, i) => ({
          ...n,
          position: { x: 0, y: i * (NODE_H + GAP) },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        }));
      setNodes(fixed);
    },
    [deleteStepMutation, nodes, edges, setNodes],
  );

  const onEdgesDelete = useCallback(
    async (deleted: Edge[]) => {
      for (const e of deleted) {
        try {
          await deleteEdgeMutation({
            edgeId: e.id as unknown as Id<"funnelEdges">,
          });
        } catch (_e) {
          /* noop */
        }
      }
    },
    [deleteEdgeMutation],
  );

  const onNodeDragStop = useCallback(
    async (_: unknown, node: Node) => {
      // snap back to TB by re-layout (vertical-only)
      const laid = layoutTB(nodes, edges);
      setNodes(laid.nodes);
      setEdges(laid.edges);

      const stepId = node.id as unknown as Id<"funnelSteps">;
      const pos =
        laid.nodes.find((n) => n.id === node.id)?.position ?? node.position;
      const uiPosition: { x: number; y: number } = { x: pos.x, y: pos.y };
      try {
        await updateStep({ stepId, config: { uiPosition } });
      } catch (_e) {
        /* noop */
      }
    },
    [nodes, edges, setNodes, setEdges, updateStep],
  );

  const resetLayout = async () => {
    const laid = layoutTB(nodes, edges);
    setNodes(laid.nodes);
    setEdges(laid.edges);
    for (const n of laid.nodes) {
      const stepId = n.id as unknown as Id<"funnelSteps">;
      const uiPosition: { x: number; y: number } = {
        x: n.position.x,
        y: n.position.y,
      };
      await updateStep({ stepId, config: { uiPosition } });
    }
  };

  return (
    <div className="h-[700px] w-full rounded-md border">
      <div className="flex items-center justify-between border-b p-2">
        <div className="text-sm font-medium">Funnel Flow</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={resetLayout}>
            Auto Layout
          </Button>
        </div>
      </div>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[560px]">
          <SheetHeader>
            <SheetTitle>Edit step</SheetTitle>
            <SheetDescription>Configure the selected step.</SheetDescription>
          </SheetHeader>
          {editingStepType === "funnelCheckout" && editingStepId && (
            <FunnelCheckoutForm
              stepId={editingStepId}
              initial={{
                label: editingInitial?.label,
                slug: editingInitial?.slug,
                position: editingInitial?.position,
                config: (editingInitial?.config as any) ?? {},
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
