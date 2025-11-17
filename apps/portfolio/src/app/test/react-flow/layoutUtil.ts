import type { Edge, Node } from "@xyflow/react";
import type { HierarchyNode, HierarchyPointNode } from "d3-hierarchy";
import { Position } from "@xyflow/react";
import { stratify, tree } from "d3-hierarchy";

import { NODE_H, VERTICAL_GAP } from "./constants";

interface Datum {
  id: string;
  parentId: string | null;
}

export function layoutTopBottom(nodes: Node[], edges: Edge[]) {
  const nodeList: Node[] = Array.isArray(nodes) ? nodes : [];
  const edgeList: Edge[] = Array.isArray(edges) ? edges : [];

  const parentById: Record<string, string | null> = {};
  const nodeIds = new Set(nodeList.map((n) => String(n.id)));
  for (const id of nodeIds) parentById[id] = null;
  for (const e of edgeList) {
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

  let root: HierarchyNode<Datum> | undefined;
  try {
    root = stratify<Datum>()
      .id((d) => d.id)
      .parentId((d) => d.parentId ?? undefined)(data);
  } catch {
    const laid = nodeList.map(
      (n, idx) =>
        ({
          ...n,
          position: { x: 0, y: idx * (NODE_H + VERTICAL_GAP) },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        }) as Node,
    );
    return { nodes: laid, edges: edgeList };
  }

  const treeLayout = tree<Datum>().nodeSize([0, NODE_H + VERTICAL_GAP]);
  const laidRoot: HierarchyPointNode<Datum> = treeLayout(root);

  const idToNode = new Map<string, Node>(
    nodeList.map((n) => [String(n.id), n]),
  );
  for (const d of laidRoot.descendants()) {
    const nid = d.data.id;
    const n = idToNode.get(nid);
    if (!n) continue;
    n.position = { x: d.x, y: d.y };
    n.sourcePosition = Position.Bottom;
    n.targetPosition = Position.Top;
  }

  return { nodes: Array.from(idToNode.values()), edges: edgeList };
}
