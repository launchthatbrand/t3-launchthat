export type CreateKind = "checkout" | "order_confirmation" | "upsell";
export type RouterKind = CreateKind | "router";

export interface ToolbarData {
  label: string;
  onDelete?: (id: string) => void;
  onAddRoute?: (id: string) => void;
  kind?: RouterKind;
}

export interface CreateData {
  prevId?: string;
  onCreate?: (prevId: string, createId: string, kind: RouterKind) => void;
}

export interface RouteEdgeData {
  onInsert?: (src: string, tgt: string, kind: RouterKind) => void;
  isRouteConfigEdge?: boolean;
  routerId?: string;
  routeId?: string;
  setRoutePercentage?: (routerId: string, routeId: string, pct: number) => void;
}
