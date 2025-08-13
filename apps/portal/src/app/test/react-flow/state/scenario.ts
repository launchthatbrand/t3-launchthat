export type LinearKind = "start" | "checkout" | "order_confirmation" | "upsell";
export type NodeKind = LinearKind | "router";

export type RouterMode = "ab" | "basic";

export interface NodeConfig {
  id: string;
  kind: NodeKind;
  label: string;
  position: number;
  router?: RouterConfig | null;
}

export interface RouterRouteConfig {
  id: string;
  percentage?: number;
  nodes: NodeConfig[];
}

export interface RouterConfig {
  mode: RouterMode;
  routes: RouterRouteConfig[];
}

export interface ScenarioConfig {
  nodes: NodeConfig[];
}

export function createEmptyScenario(): ScenarioConfig {
  return { nodes: [] };
}

export function appendMainNode(
  scenario: ScenarioConfig,
  node: Omit<NodeConfig, "position">,
): ScenarioConfig {
  const position = scenario.nodes.length;
  return { nodes: [...scenario.nodes, { ...node, position }] };
}

export function insertMainNode(
  scenario: ScenarioConfig,
  atPosition: number,
  node: Omit<NodeConfig, "position">,
): ScenarioConfig {
  const normalized = Math.max(0, Math.min(atPosition, scenario.nodes.length));
  const withShift = scenario.nodes.map((n) =>
    n.position >= normalized ? { ...n, position: n.position + 1 } : n,
  );
  const inserted: NodeConfig = { ...node, position: normalized } as NodeConfig;
  const result = [...withShift, inserted].sort(
    (a, b) => a.position - b.position,
  );
  return { nodes: result };
}

export function removeMainNode(
  scenario: ScenarioConfig,
  id: string,
): ScenarioConfig {
  const removed = scenario.nodes.find((n) => n.id === id);
  if (!removed) return scenario;
  const pos = removed.position;
  const remaining = scenario.nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.position > pos ? { ...n, position: n.position - 1 } : n));
  return { nodes: remaining };
}

export function addRouterRoute(
  scenario: ScenarioConfig,
  routerId: string,
  makeRouteId: () => string,
): ScenarioConfig {
  const idx = scenario.nodes.findIndex((n) => n.id === routerId);
  if (idx < 0) return scenario;
  const r = scenario.nodes[idx];
  const router: RouterConfig = r.router ?? { mode: "ab", routes: [] };
  const newRoute: RouterRouteConfig = {
    id: makeRouteId(),
    percentage: undefined,
    nodes: [],
  };
  const updatedRouter: RouterConfig = {
    ...router,
    routes: [...router.routes, newRoute],
  };
  const updated = scenario.nodes.map((n, i) =>
    i === idx ? { ...r, router: updatedRouter } : n,
  );
  return { nodes: updated };
}

export function setRoutePercentage(
  scenario: ScenarioConfig,
  routerId: string,
  routeId: string,
  pct: number,
): ScenarioConfig {
  const idx = scenario.nodes.findIndex((n) => n.id === routerId);
  if (idx < 0) return scenario;
  const r = scenario.nodes[idx];
  if (!r.router) return scenario;
  const routes = r.router.routes.map((rt) =>
    rt.id === routeId ? { ...rt, percentage: pct } : rt,
  );
  const updated = scenario.nodes.map((n, i) =>
    i === idx ? { ...r, router: { ...r.router!, routes } } : n,
  );
  return { nodes: updated };
}

export function insertRouteNode(
  scenario: ScenarioConfig,
  routerId: string,
  routeId: string,
  atIndex: number,
  node: Omit<NodeConfig, "position">,
): ScenarioConfig {
  const idx = scenario.nodes.findIndex((n) => n.id === routerId);
  if (idx < 0) return scenario;
  const r = scenario.nodes[idx];
  if (!r.router) return scenario;
  const routes = r.router.routes.map((rt) => {
    if (rt.id !== routeId) return rt;
    const insertAt = Number.isFinite(atIndex)
      ? Math.max(0, Math.min(atIndex, rt.nodes.length))
      : rt.nodes.length;
    const before = rt.nodes.slice(0, insertAt);
    const after = rt.nodes.slice(insertAt);
    const newNode: NodeConfig = { ...node, position: insertAt } as NodeConfig;
    return { ...rt, nodes: [...before, newNode, ...after] };
  });
  const updated = scenario.nodes.map((n, i) =>
    i === idx ? { ...r, router: { ...r.router!, routes } } : n,
  );
  return { nodes: updated };
}
