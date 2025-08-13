import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";

export const initialNodesBase: Node[] = [
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

export const initialEdges: Edge[] = [
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
