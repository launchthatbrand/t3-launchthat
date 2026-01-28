export type SymbolMatchKind = "exact_symbol" | "pair_normalized" | "alias_term";

export type ExtractedSymbol = {
  symbol: string;
  matchKind: SymbolMatchKind;
  matchText: string;
};

const normalize = (s: string): string => s.trim().toUpperCase();

const tokenSplit = (text: string): string[] =>
  text
    .toUpperCase()
    .split(/[^A-Z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

export const extractSymbolsDeterministic = (args: {
  title: string;
  summary?: string;
  supportedSymbols: Set<string>;
  assetAliasMap: Record<string, string>;
  disabledAliases?: Set<string>;
  maxLinks?: number;
}): ExtractedSymbol[] => {
  const maxLinks = Math.max(1, Math.min(10, args.maxLinks ?? 5));
  const title = normalize(args.title);
  const summary = typeof args.summary === "string" ? normalize(args.summary) : "";
  const text = `${title} ${summary}`.trim();
  const out: ExtractedSymbol[] = [];
  const seen = new Set<string>();

  const push = (symbol: string, matchKind: SymbolMatchKind, matchText: string) => {
    const sym = normalize(symbol);
    if (!sym) return;
    if (!args.supportedSymbols.has(sym)) return;
    if (seen.has(sym)) return;
    seen.add(sym);
    out.push({ symbol: sym, matchKind, matchText });
  };

  // 1) Exact token match (BTCUSD, XAUUSD, US30, EURUSD, ...)
  const tokens = tokenSplit(text);
  for (const t of tokens) {
    if (args.supportedSymbols.has(t)) push(t, "exact_symbol", t);
    if (out.length >= maxLinks) return out;
  }

  // 2) Pair normalization (BTC/USD, BTC-USD, BTC USD, BTC:USD -> BTCUSD)
  const pairRe = /([A-Z0-9]{2,6})\s*([/:\-])\s*([A-Z0-9]{2,6})/g;
  for (const m of text.matchAll(pairRe)) {
    const a = m[1] ?? "";
    const b = m[3] ?? "";
    if (!a || !b) continue;
    const joined = `${a}${b}`;
    push(joined, "pair_normalized", `${a}${m[2] ?? "/"}${b}`);
    if (out.length >= maxLinks) return out;
  }

  // 3) Alias terms (BITCOIN -> BTCUSD, GOLD -> XAUUSD, WTI -> USOIL, ...)
  const disabled = args.disabledAliases ?? new Set<string>();
  for (const tRaw of tokens) {
    const t = normalize(tRaw);
    if (!t || disabled.has(t)) continue;
    const mapped = args.assetAliasMap[t];
    if (mapped) push(mapped, "alias_term", t);
    if (out.length >= maxLinks) return out;
  }

  return out;
};

