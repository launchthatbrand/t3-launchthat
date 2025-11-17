"use client";

import "@xyflow/react/dist/style.css";

import type { Id } from "@/convex/_generated/dataModel";
import type {
  Connection,
  Edge,
  EdgeProps,
  Node,
  NodeProps,
  ReactFlowInstance,
} from "@xyflow/react";
import React, { useCallback, useEffect, useRef } from "react";
import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui";

import type { RouterKind } from "./types";
import { FunnelCheckoutForm } from "../../(root)/(admin)/admin/store/funnels/[id]/steps/_components/FunnelCheckoutForm";
import { BRANCH_X_OFFSET, NODE_H, NODE_W, VERTICAL_GAP } from "./constants";
import CreateNode from "./CreateNode";
import { initialEdges, initialNodesBase } from "./initialData";
import { layoutTopBottom } from "./layoutUtil";
import NodeWithContextMenu from "./NodeWithContextMenu";
import PlusEdgeWithPopover from "./PlusEdgeWithPopover";

// Scenario config model
export type LinearKind = "start" | "checkout" | "order_confirmation" | "upsell";
export type NodeKind = LinearKind | "router";

export type RouterMode = "ab" | "basic";
export interface RouterRouteConfig {
  id: string;
  percentage?: number; // used when mode === "ab"
  nodes: NodeConfig[]; // route-local sequence
}
export interface RouterConfig {
  mode: RouterMode;
  routes: RouterRouteConfig[];
}
export interface NodeConfig {
  id: string;
  kind: NodeKind;
  label: string;
  position: number; // linear index within main scenario
  router?: RouterConfig | null;
}
export interface ScenarioConfig {
  nodes: NodeConfig[]; // ordered by position ascending
}

function NodeWithToolbar(props: NodeProps) {
  return <NodeWithContextMenu {...(props as unknown as NodeProps)} />;
}

function PlusEdge(props: EdgeProps) {
  return <PlusEdgeWithPopover {...props} />;
}

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
  const rebuildRef = useRef<((s: ScenarioConfig) => void) | null>(null);
  const routeSettingsRef = useRef<
    ((routerId: string, routeId: string, percentage: number) => void) | null
  >(null);
  const suppressRouterClickRef = useRef<Set<string>>(new Set());

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
  const setRoutePercentage = useCallback(
    (routerId: string, routeId: string, percentage: number) => {
      setScenario((prev) => {
        const idx = prev.nodes.findIndex((n) => n.id === routerId);
        if (idx < 0) return prev;
        const routerNode = prev.nodes[idx];
        if (!routerNode || !routerNode.router) return prev;
        const routes = routerNode.router.routes.map((r) =>
          r.id === routeId ? { ...r, percentage } : r,
        );
        const newRouter: RouterConfig = {
          mode: routerNode.router.mode,
          routes,
        };
        const updated: ScenarioConfig = {
          nodes: prev.nodes.map((n, i) =>
            i === idx ? { ...routerNode, router: newRouter } : n,
          ),
        };
        setTimeout(() => rebuildRef.current?.(updated), 0);
        return updated;
      });
    },
    [setScenario],
  );

  // sheet state
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingNodeId, setEditingNodeId] = React.useState<string | null>(null);
  const [editingKind, setEditingKind] = React.useState<RouterKind | null>(null);

  const applyLayout = useCallback(() => {
    setNodes((ns) => {
      const { nodes: laid } = layoutTopBottom(ns, edges);
      return laid;
    });
  }, [edges, setNodes]);

  // helper: rebuild Node/Edge arrays from scenario config
  const rebuildFromScenario = useCallback(
    (s: ScenarioConfig) => {
      const ordered = [...s.nodes].sort((a, b) => a.position - b.position);
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Place main chain nodes
      ordered.forEach((cfg, idx) => {
        const isRouter = cfg.kind === "router";
        newNodes.push({
          id: cfg.id,
          type: "node-with-toolbar",
          position: { x: 0, y: idx * (NODE_H + VERTICAL_GAP) },
          data: (isRouter
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
              }) as unknown as Record<string, unknown>,
          width: NODE_W,
          height: NODE_H,
        } as Node);

        // connect previous main node
        if (idx > 0) {
          const prev = ordered[idx - 1];
          if (prev && prev.kind !== "router") {
            newEdges.push({
              id: `e${prev.id}-${cfg.id}`,
              type: "plus",
              source: prev.id,
              target: cfg.id,
              markerEnd: { type: MarkerType.ArrowClosed },
              data: {
                onInsert: (src: string, tgt: string, kind: RouterKind) =>
                  insertRef.current?.(src, tgt, kind),
              },
            });
          }
        }

        // Render router branches side-by-side
        if (isRouter && cfg.router) {
          const routes = cfg.router.routes;
          const baseY = (idx + 1) * (NODE_H + VERTICAL_GAP);
          routes.forEach((route, rIdx) => {
            const x = (rIdx - (routes.length - 1) / 2) * BRANCH_X_OFFSET;
            // render route nodes
            if (route.nodes.length > 0) {
              route.nodes.forEach((rn, j) => {
                const y = baseY + j * (NODE_H + VERTICAL_GAP);
                newNodes.push({
                  id: rn.id,
                  type: "node-with-toolbar",
                  position: { x, y },
                  data: {
                    label: rn.label,
                    kind: rn.kind,
                    onDelete: (rid: string) => removeNode(rid),
                  } as unknown as Record<string, unknown>,
                  width: NODE_W,
                  height: NODE_H,
                } as Node);
                if (j === 0) {
                  // edge: router -> first route node
                  newEdges.push({
                    id: `e${cfg.id}-${rn.id}`,
                    type: "plus",
                    source: cfg.id,
                    target: rn.id,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    data: {
                      isRouteConfigEdge: true,
                      routerId: cfg.id,
                      routeId: route.id,
                      setRoutePercentage: (
                        rid: string,
                        rtid: string,
                        pct: number,
                      ) => routeSettingsRef.current?.(rid, rtid, pct),
                    },
                  });
                } else {
                  const prevRouteNode = route.nodes[j - 1];
                  if (prevRouteNode) {
                    newEdges.push({
                      id: `e${prevRouteNode.id}-${rn.id}`,
                      type: "plus",
                      source: prevRouteNode.id,
                      target: rn.id,
                      markerEnd: { type: MarkerType.ArrowClosed },
                      data: {
                        onInsert: (
                          _s: string,
                          _t: string,
                          kind: RouterKind,
                        ) => {
                          insertRouteNode(cfg.id, route.id, j, kind);
                        },
                      },
                    });
                  }
                }
              });
            }
            // trailing create for each route
            const createRouteId = `create-route-${cfg.id}-${route.id}`;
            const yCreate =
              baseY + route.nodes.length * (NODE_H + VERTICAL_GAP);
            newNodes.push({
              id: createRouteId,
              type: "createNode",
              position: { x, y: yCreate },
              data: {
                prevId: `${cfg.id}:${route.id}`,
                onCreate: (key: string, _createId: string, kind: RouterKind) =>
                  handleCreateRoute(key, kind),
              } as unknown as Record<string, unknown>,
              width: NODE_W,
              height: NODE_H,
              style: { opacity: 1 },
            } as Node);
            const srcForCreate =
              route.nodes.length > 0
                ? route.nodes[route.nodes.length - 1].id
                : cfg.id;
            newEdges.push({
              id: `e${srcForCreate}-${createRouteId}`,
              type: "plus",
              source: srcForCreate,
              target: createRouteId,
              markerEnd: { type: MarkerType.ArrowClosed },
              data: {
                onInsert: (_s: string, _t: string, kind: RouterKind) =>
                  insertRouteNode(cfg.id, route.id, route.nodes.length, kind),
              },
            });
          });
        }
      });

      // trailing create node for main chain
      const last = ordered.length > 0 ? ordered[ordered.length - 1] : undefined;
      if (!last) {
        const createId = `create-root`;
        newNodes.push({
          id: createId,
          type: "createNode",
          position: { x: 0, y: 0 },
          data: {
            prevId: undefined,
            onCreate: handleCreate,
          } as unknown as Record<string, unknown>,
          width: NODE_W,
          height: NODE_H,
          style: { opacity: 1 },
        } as Node);
      } else if (last.kind !== "router") {
        const createId = `create-${last.id}`;
        newNodes.push({
          id: createId,
          type: "createNode",
          position: { x: 0, y: ordered.length * (NODE_H + VERTICAL_GAP) },
          data: {
            prevId: last.id,
            onCreate: handleCreate,
          } as unknown as Record<string, unknown>,
          width: NODE_W,
          height: NODE_H,
          style: { opacity: 1 },
        } as Node);
        newEdges.push({
          id: `e${last.id}-${createId}`,
          type: "plus",
          source: last.id,
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

  useEffect(() => {
    rebuildRef.current = rebuildFromScenario;
  }, [rebuildFromScenario]);

  useEffect(() => {
    routeSettingsRef.current = setRoutePercentage;
  }, [setRoutePercentage]);

  const insertRouteNode = useCallback(
    (routerId: string, routeId: string, insertAt: number, kind: RouterKind) => {
      setScenario((prev) => {
        const idx = prev.nodes.findIndex((n) => n.id === routerId);
        if (idx < 0) return prev;
        const routerNode = prev.nodes[idx];
        if (!routerNode || routerNode.kind !== "router" || !routerNode.router)
          return prev;
        const routes = routerNode.router.routes.map((r) =>
          r.id === routeId
            ? {
                ...r,
                nodes: [
                  ...r.nodes.slice(0, insertAt),
                  {
                    id: `r-${routeId}-${Date.now()}`,
                    kind: kind === "router" ? "router" : (kind as LinearKind),
                    label:
                      kind === "checkout"
                        ? "Checkout"
                        : kind === "order_confirmation"
                          ? "Order Confirmation"
                          : kind === "upsell"
                            ? "Upsell"
                            : "Router",
                    position: insertAt,
                    router:
                      kind === "router"
                        ? {
                            mode: "ab",
                            routes: [
                              {
                                id: `sub-${Date.now()}-A`,
                                percentage: 50,
                                nodes: [],
                              },
                              {
                                id: `sub-${Date.now()}-B`,
                                percentage: 50,
                                nodes: [],
                              },
                            ],
                          }
                        : null,
                  },
                  ...r.nodes.slice(insertAt),
                ],
              }
            : r,
        );
        const updated: ScenarioConfig = {
          nodes: prev.nodes.map((n, i) =>
            i === idx
              ? {
                  ...routerNode,
                  router: { mode: routerNode.router.mode, routes },
                }
              : n,
          ),
        };
        setTimeout(() => rebuildFromScenario(updated), 0);
        return updated;
      });
    },
    [rebuildFromScenario],
  );

  const handleCreateRoute = useCallback(
    (routeKey: string, kind: RouterKind) => {
      const [routerId = "", routeId = ""] = routeKey.split(":");
      if (!routerId || !routeId) return;
      insertRouteNode(routerId, routeId, Number.POSITIVE_INFINITY, kind);
    },
    [insertRouteNode],
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
                    { id: `${newId}-A`, percentage: 50, nodes: [] },
                    { id: `${newId}-B`, percentage: 50, nodes: [] },
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
      if (kind === "router") suppressRouterClickRef.current.add(newId);
    },
    [rebuildFromScenario, setScenario],
  );

  const handleCreate = useCallback(
    (_prevId: string, createId: string, kind: RouterKind) => {
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
                    { id: `${createId}-A`, percentage: 50, nodes: [] },
                    { id: `${createId}-B`, percentage: 50, nodes: [] },
                  ],
                }
              : null,
        };
        const updated: ScenarioConfig = { nodes: [...prev.nodes, newCfg] };
        setTimeout(() => rebuildFromScenario(updated), 0);
        return updated;
      });
      if (kind === "router") suppressRouterClickRef.current.add(createId);
    },
    [rebuildFromScenario, setScenario],
  );

  useEffect(() => {
    insertRef.current = handleInsertBetween;
  }, [handleInsertBetween]);

  // seed nodes with actions once and apply initial layout
  useEffect(() => {
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
          if (kd === "router") return;
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
