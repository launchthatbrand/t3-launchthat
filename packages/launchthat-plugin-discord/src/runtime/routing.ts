export type MatchStrategy = "first_match" | "multi_cast" | "priority";

export type RoutingRule = {
  enabled: boolean;
  channelId: string;
  order: number;
  priority: number;
  actorRoles?: string[] | null;
  symbols?: string[] | null;
};

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

export function resolveChannelsForEventFromRules(args: {
  matchStrategy: MatchStrategy;
  rules: RoutingRule[];
  actorRole: string;
  symbol: string;
}): string[] {
  const actorRole = String(args.actorRole ?? "").trim();
  const symbol = normalizeSymbol(String(args.symbol ?? ""));

  const rules = (Array.isArray(args.rules) ? args.rules : [])
    .filter((r) => Boolean(r.enabled) && Boolean(r.channelId?.trim()))
    .map((r) => ({
      enabled: Boolean(r.enabled),
      channelId: String(r.channelId ?? "").trim(),
      order: Number.isFinite(r.order) ? r.order : 0,
      priority: Number.isFinite(r.priority) ? r.priority : 0,
      actorRoles: Array.isArray(r.actorRoles)
        ? r.actorRoles.filter((s) => typeof s === "string")
        : null,
      symbols: Array.isArray(r.symbols)
        ? r.symbols
            .filter((s) => typeof s === "string")
            .map((s) => normalizeSymbol(s))
            .filter(Boolean)
        : null,
    }));

  rules.sort((a, b) => a.order - b.order);

  const matches = rules.filter((r) => {
    const roleOk = r.actorRoles ? r.actorRoles.includes(actorRole) : true;
    const symbolOk = r.symbols ? r.symbols.includes(symbol) : true;
    return roleOk && symbolOk;
  });

  if (matches.length === 0) return [];

  if (args.matchStrategy === "multi_cast") {
    return matches.map((m) => m.channelId);
  }

  if (args.matchStrategy === "priority") {
    const max = Math.max(...matches.map((m) => m.priority));
    return matches.filter((m) => m.priority === max).map((m) => m.channelId);
  }

  // first_match
  return [matches[0]!.channelId];
}

