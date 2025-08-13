"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  addEdge,
  getBezierPath,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type {
  Connection,
  Edge,
  EdgeProps,
  Node,
  NodeProps,
  ReactFlowInstance,
} from "@xyflow/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@acme/ui/context-menu";
import type { HierarchyNode, HierarchyPointNode } from "d3-hierarchy";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui";
import { stratify, tree } from "d3-hierarchy";

import { FunnelCheckoutForm } from "../../(root)/(admin)/admin/store/funnels/[id]/steps/_components/FunnelCheckoutForm";
import type { Id } from "@/convex/_generated/dataModel";

const NODE_W = 180;
const NODE_H = 40;
const VERTICAL_GAP = 50;

// Scenario config model
type LinearKind = "start" | "checkout" | "order_confirmation" | "upsell";
type NodeKind = LinearKind | "router";

type RouterMode = "ab" | "basic";
interface RouterRouteConfig {
  id: string;
  percentage?: number; // used when mode === "ab"
}
interface RouterConfig {
  mode: RouterMode;
  routes: RouterRouteConfig[];
}
interface NodeConfig {
  id: string;
  kind: NodeKind;
  label: string;
  position: number; // linear index within main scenario
  router?: RouterConfig | null;
}
interface ScenarioConfig {
  nodes: NodeConfig[]; // ordered by position ascending
}

interface Datum {
  id: string;
  parentId: string | null;
}

type CreateKind = "checkout" | "order_confirmation" | "upsell";
// include router as a creatable type
type RouterKind = CreateKind | "router";

function layoutTB(nodes: Node[], edges: Edge[]) {
  // build parent map (first incoming edge = parent)
  const parentById: Record<string, string | null> = {};
  const nodeIds = new Set(nodes.map((n) => String(n.id)));
  for (const id of nodeIds) parentById[id] = null;
  for (const e of edges) {
    const tgt = String(e.target);
    const src = String(e.source);
    if (nodeIds.has(tgt) && parentById[tgt] === null) {
      parentById[tgt] = src;
    }
  }

  const data: Datum[] = Array.from(nodeIds).map((id) => ({
    id,
    parentId: parentById[id] ?? null,
  }));

  // If there are multiple roots, d3.stratify will throw.
  // For this test page we assume a single chain/root.
  let root: HierarchyNode<Datum> | undefined;
  try {
    root = stratify<Datum>()
      .id((d) => d.id)
      .parentId((d) => d.parentId ?? undefined)(data);
  } catch {
    // Fallback: position by insertion order
    const laid = nodes.map(
      (n, idx) =>
        ({
          ...n,
          position: { x: 0, y: idx * (NODE_H + VERTICAL_GAP) },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        }) as Node,
    );
    return { nodes: laid, edges };
  }

  // root is defined if no error was thrown above

  const treeLayout = tree<Datum>().nodeSize([0, NODE_H + VERTICAL_GAP]);
  const laidRoot: HierarchyPointNode<Datum> = treeLayout(root);

  const idToNode = new Map<string, Node>(nodes.map((n) => [String(n.id), n]));
  for (const d of laidRoot.descendants()) {
    const nid = d.data.id;
    const n = idToNode.get(nid);
    if (!n) continue;
    n.position = { x: d.x, y: d.y };
    n.sourcePosition = Position.Bottom;
    n.targetPosition = Position.Top;
  }

  return { nodes: Array.from(idToNode.values()), edges };
}

interface ToolbarData {
  label: string;
  onDelete?: (id: string) => void;
  onAddRoute?: (id: string) => void;
  kind?: RouterKind;
}

function NodeWithToolbar({ id, data, selected: _selected }: NodeProps) {
  const d = data as unknown as ToolbarData;
  const isFirst = id === "1";
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="rounded border bg-white px-3 py-2 shadow-sm transition-opacity transition-transform duration-300 ease-out">
          <div className="text-sm">{d.label}</div>
          {!isFirst && <Handle type="target" position={Position.Top} />}
          <Handle type="source" position={Position.Bottom} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {d.onAddRoute && (
          <>
            <ContextMenuItem onClick={() => d.onAddRoute?.(String(id))}>
              Add route
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuItem onClick={() => d.onDelete?.(String(id))}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface CreateData {
  prevId?: string;
  onCreate?: (prevId: string, createId: string, kind: RouterKind) => void;
}

function CreateNode({ id, data }: NodeProps) {
  const d = data as unknown as CreateData;
  const disabled = d.prevId == null;
  const handlePick = (kind: RouterKind) => {
    if (typeof d.prevId === "string") d.onCreate?.(d.prevId, String(id), kind);
  };
  return (
    <div className="rounded border-2 border-dashed bg-white px-3 py-2 text-sm shadow-sm transition-opacity transition-transform duration-300 ease-out">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-sm border bg-white px-2 py-1 text-xs shadow"
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              +
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("checkout")}
              >
                Checkout
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("order_confirmation")}
              >
                Order Confirmation
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("upsell")}
              >
                Upsell
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("router")}
              >
                Router
              </button>
            </div>
          </PopoverContent>
        </Popover>
        <span>Add next step</span>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

function PlusEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
  } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const d = data as unknown as {
    onInsert?: (src: string, tgt: string, kind: RouterKind) => void;
  };

  const handlePick = (kind: RouterKind) => {
    d.onInsert?.(String(source), String(target), kind);
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-sm border bg-white px-2 py-1 text-xs shadow"
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: "all",
              }}
            >
              +
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("checkout")}
              >
                Checkout
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("order_confirmation")}
              >
                Order Confirmation
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("upsell")}
              >
                Upsell
              </button>
              <button
                type="button"
                className="xy-theme__button"
                onClick={() => handlePick("router")}
              >
                Router
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </EdgeLabelRenderer>
    </>
  );
}

const initialNodesBase: Node[] = [
  {
    id: "1",
    type: "node-with-toolbar",
    position: { x: 0, y: 0 },
    data: { label: "Start" },
  },
  {
    id: "2",
    type: "node-with-toolbar",
    position: { x: 0, y: 0 },
    data: { label: "Checkout", kind: "checkout" },
  },
  {
    id: "3",
    type: "node-with-toolbar",
    position: { x: 0, y: 0 },
    data: { label: "Order Confirmation", kind: "order_confirmation" },
  },
  {
    id: "create",
    type: "createNode",
    position: { x: 0, y: 0 },
    data: {},
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    type: "plus",
    source: "1",
    target: "2",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "e2-3",
    type: "plus",
    source: "2",
    target: "3",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "e3-create",
    type: "plus",
    source: "3",
    target: "create",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

const nodeTypes = {
  "node-with-toolbar": NodeWithToolbar,
  createNode: CreateNode,
} as const;
const edgeTypes = { plus: PlusEdge } as const;

export default function ReactFlowPage() {
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const rf = useRef<ReactFlowInstance | null>(null);
  const addRouteRef = useRef<((routerId: string) => void) | null>(null);
  const insertRef = useRef<
    ((src: string, tgt: string, kind: RouterKind) => void) | null
  >(null);
  const [_scenario, setScenario] = React.useState<ScenarioConfig>({
    nodes: [],
  });

  // sheet state
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingNodeId, setEditingNodeId] = React.useState<string | null>(null);
  const [editingKind, setEditingKind] = React.useState<RouterKind | null>(null);

  const applyLayout = useCallback(() => {
    setNodes((ns) => {
      const { nodes: laid } = layoutTB(ns, edges);
      return laid;
    });
  }, [edges, setNodes]);

  // helper: rebuild Node/Edge arrays from scenario config
  const rebuildFromScenario = useCallback(
    (s: ScenarioConfig) => {
      const ordered = [...s.nodes].sort((a, b) => a.position - b.position);
      const newNodes: Node[] = ordered.map((cfg, idx) => {
        const isRouter = cfg.kind === "router";
        return {
          id: cfg.id,
          type: "node-with-toolbar",
          position: { x: 0, y: idx * (NODE_H + VERTICAL_GAP) },
          data: isRouter
            ? {
                label: cfg.label,
                kind: "router",
                onDelete: (rid: string) => removeNode(rid),
                onAddRoute: (rid: string) => addRouteRef.current?.(rid),
              }
            : {
                label: cfg.label,
                kind: cfg.kind,
                onDelete: (rid: string) => removeNode(rid),
              },
          width: NODE_W,
          height: NODE_H,
        } as Node;
      });
      // trailing create node
      const lastId =
        ordered.length > 0 ? ordered[ordered.length - 1].id : undefined;
      const createId = `create-${lastId ?? "root"}`;
      newNodes.push({
        id: createId,
        type: "createNode",
        position: { x: 0, y: ordered.length * (NODE_H + VERTICAL_GAP) },
        data: { prevId: lastId, onCreate: handleCreate },
        width: NODE_W,
        height: NODE_H,
        style: { opacity: 1 },
      } as Node);

      const newEdges: Edge[] = [];
      for (let i = 0; i < ordered.length - 1; i++) {
        const aNode = ordered[i];
        const bNode = ordered[i + 1];
        if (!aNode || !bNode) continue;
        newEdges.push({
          id: `e${aNode.id}-${bNode.id}`,
          type: "plus",
          source: aNode.id,
          target: bNode.id,
          markerEnd: { type: MarkerType.ArrowClosed },
          data: {
            onInsert: (src: string, tgt: string, kind: RouterKind) =>
              insertRef.current?.(src, tgt, kind),
          },
        });
      }
      // last -> create (only if there is at least one node)
      if (lastId) {
        newEdges.push({
          id: `e${lastId}-${createId}`,
          type: "plus",
          source: lastId,
          target: createId,
          markerEnd: { type: MarkerType.ArrowClosed },
          data: {
            onInsert: (src: string, tgt: string, kind: RouterKind) =>
              insertRef.current?.(src, tgt, kind),
          },
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(
        () => void rf.current?.fitView({ padding: 0.15, duration: 300 }),
        0,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setNodes, setEdges],
  );

  const attachInsert = useCallback(
    (es: Edge[]) =>
      es.map((e) => ({
        ...e,
        data: {
          ...(e.data ?? {}),
          onInsert: (src: string, tgt: string, kind: RouterKind) =>
            insertRef.current?.(src, tgt, kind),
        },
      })),
    [insertRef],
  );

  const removeNode = useCallback(
    (id: string) => {
      setScenario((prev) => {
        const removed = prev.nodes.find((n) => n.id === id);
        if (!removed) return prev;
        const removedPos = removed.position;
        const updated: ScenarioConfig = {
          nodes: prev.nodes
            .filter((n) => n.id !== id)
            .map((n) => ({
              ...n,
              position: n.position > removedPos ? n.position - 1 : n.position,
            })),
        };
        // rebuild graph
        setTimeout(() => rebuildFromScenario(updated), 0);
        return updated;
      });
    },
    [rebuildFromScenario, setScenario],
  );

  const handleInsertBetween: (
    src: string,
    tgt: string,
    kind: RouterKind,
  ) => void = useCallback(
    (src, tgt, kind) => {
      const newId = `ins-${Date.now()}`;
      const label =
        kind === "checkout"
          ? "Checkout"
          : kind === "order_confirmation"
            ? "Order Confirmation"
            : kind === "upsell"
              ? "Upsell"
              : "Router";
      setScenario((prev) => {
        const tNode = prev.nodes.find((n) => n.id === tgt);
        const insertAt = tNode ? tNode.position : prev.nodes.length;
        const newCfg: NodeConfig = {
          id: newId,
          kind: kind === "router" ? "router" : (kind as LinearKind),
          label,
          position: insertAt,
          router:
            kind === "router"
              ? {
                  mode: "ab",
                  routes: [
                    { id: `${newId}-A`, percentage: 50 },
                    { id: `${newId}-B`, percentage: 50 },
                  ],
                }
              : null,
        };
        const updated: ScenarioConfig = {
          nodes: [
            ...prev.nodes.map((n) => ({
              ...n,
              position: n.position >= insertAt ? n.position + 1 : n.position,
            })),
          ],
        };
        updated.nodes.splice(insertAt, 0, newCfg);
        setTimeout(() => rebuildFromScenario(updated), 0);
        return updated;
      });
    },
    [rebuildFromScenario, setScenario],
  );

  const handleCreate = useCallback(
    (prevId: string, createId: string, kind: RouterKind) => {
      const label =
        kind === "checkout"
          ? "Checkout"
          : kind === "order_confirmation"
            ? "Order Confirmation"
            : kind === "upsell"
              ? "Upsell"
              : "Router";
      setScenario((prev) => {
        const insertAt = prev.nodes.length;
        const newCfg: NodeConfig = {
          id: createId,
          kind: kind === "router" ? "router" : (kind as LinearKind),
          label,
          position: insertAt,
          router:
            kind === "router"
              ? {
                  mode: "ab",
                  routes: [
                    { id: `${createId}-A`, percentage: 50 },
                    { id: `${createId}-B`, percentage: 50 },
                  ],
                }
              : null,
        };
        const updated: ScenarioConfig = { nodes: [...prev.nodes, newCfg] };
        setTimeout(() => rebuildFromScenario(updated), 0);
        return updated;
      });
    },
    [rebuildFromScenario, setScenario],
  );

  const handleAddRoute: (routerId: string) => void = useCallback(
    (routerId) => {
      setScenario((prev) => {
        const idx = prev.nodes.findIndex((n) => n.id === routerId);
        if (idx < 0) return prev;
        const node = prev.nodes[idx]!;
        const current = node.router ?? {
          mode: "ab",
          routes: [] as RouterRouteConfig[],
        };
        const nextRouteId = `${routerId}-R${current.routes.length + 1}`;
        const updatedNode: NodeConfig = {
          ...node,
          router: {
            mode: current.mode,
            routes: [
              ...current.routes,
              {
                id: nextRouteId,
                percentage:
                  current.mode === "ab"
                    ? Math.floor(100 / (current.routes.length + 1))
                    : undefined,
              },
            ],
          },
        };
        const updated: ScenarioConfig = {
          nodes: prev.nodes.map((n, i) => (i === idx ? updatedNode : n)),
        };
        // router config does not change linear layout; just refresh graph
        setTimeout(() => rebuildFromScenario(updated), 0);
        return updated;
      });
    },
    [rebuildFromScenario, setScenario],
  );

  useEffect(() => {
    insertRef.current = handleInsertBetween;
  }, [handleInsertBetween]);

  // seed nodes with actions once and apply initial layout
  useEffect(() => {
    // initialize scenario from initialNodesBase (exclude the trailing create)
    const linear = initialNodesBase
      .filter((n) => n.type !== "createNode")
      .map((n, idx) => ({
        id: String(n.id),
        kind:
          (n.data as { kind?: RouterKind } | undefined)?.kind ??
          (idx === 0 ? "start" : ("checkout" as LinearKind)),
        label:
          (n.data as { label?: string } | undefined)?.label ?? String(n.id),
        position: idx,
        router: null,
      })) as NodeConfig[];
    const s: ScenarioConfig = { nodes: linear };
    setScenario(s);
    rebuildFromScenario(s);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) =>
        attachInsert(
          addEdge(
            {
              ...conn,
              type: "plus",
              markerEnd: { type: MarkerType.ArrowClosed },
            },
            eds,
          ),
        ),
      );
      setTimeout(applyLayout, 0);
    },
    [applyLayout, attachInsert, setEdges],
  );

  return (
    <div className="h-[640px] w-full">
      <ReactFlow
        onInit={(inst) => {
          rf.current = inst;
        }}
        onNodeClick={(_, node) => {
          const kd = (node.data as { kind?: RouterKind } | undefined)?.kind;
          if (!kd) return; // create node or unknown type → let popover handle
          setEditingNodeId(String(node.id));
          setEditingKind(kd);
          setSheetOpen(true);
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodesDraggable={false}
        panOnDrag={false}
        zoomOnPinch={false}
        zoomOnScroll={false}
      >
        <Controls />
        <Background />
      </ReactFlow>
      <div className="flex gap-2 p-2">
        <button className="xy-theme__button" onClick={applyLayout}>
          Auto Layout (TB)
        </button>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[560px]">
          <SheetHeader>
            <SheetTitle>Edit node</SheetTitle>
            <SheetDescription>Configure the selected node.</SheetDescription>
          </SheetHeader>
          {editingKind === "checkout" && editingNodeId && (
            <FunnelCheckoutForm
              stepId={editingNodeId as unknown as Id<"funnelSteps">}
              initial={{
                label: (
                  nodes.find((n) => String(n.id) === editingNodeId)?.data as
                    | { label?: string }
                    | undefined
                )?.label,
                slug: undefined,
                position: undefined,
                config: {} as Record<string, unknown>,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
