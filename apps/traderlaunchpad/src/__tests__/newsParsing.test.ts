import { extractSymbolsDeterministic } from "../../../../packages/launchthat-plugin-news/src/convex/component/ingest/symbolExtract";

describe("news deterministic parsing", () => {
  test("extracts exact symbol tokens (EURUSD, US30)", () => {
    const supported = new Set(["EURUSD", "US30"]);
    const res = extractSymbolsDeterministic({
      title: "EURUSD rallies as US30 slips",
      supportedSymbols: supported,
      assetAliasMap: {},
    });
    expect(res.map((r) => r.symbol)).toEqual(["EURUSD", "US30"]);
    expect(res[0]?.matchKind).toBe("exact_symbol");
  });

  test("extracts pair normalization BTC/USD -> BTCUSD", () => {
    const supported = new Set(["BTCUSD"]);
    const res = extractSymbolsDeterministic({
      title: "BTC/USD jumps after ETF news",
      supportedSymbols: supported,
      assetAliasMap: {},
    });
    expect(res.map((r) => r.symbol)).toEqual(["BTCUSD"]);
    expect(res[0]?.matchKind).toBe("pair_normalized");
  });

  test("extracts alias terms (BITCOIN -> BTCUSD, GOLD -> XAUUSD)", () => {
    const supported = new Set(["BTCUSD", "XAUUSD"]);
    const res = extractSymbolsDeterministic({
      title: "Bitcoin and gold rise on weaker dollar",
      supportedSymbols: supported,
      assetAliasMap: { BITCOIN: "BTCUSD", GOLD: "XAUUSD" },
    });
    expect(res.map((r) => r.symbol)).toEqual(["BTCUSD", "XAUUSD"]);
  });

  test("respects disabledAliases", () => {
    const supported = new Set(["BTCUSD"]);
    const res = extractSymbolsDeterministic({
      title: "Bitcoin spikes",
      supportedSymbols: supported,
      assetAliasMap: { BITCOIN: "BTCUSD" },
      disabledAliases: new Set(["BITCOIN"]),
    });
    expect(res.map((r) => r.symbol)).toEqual([]);
  });

  test("caps maxLinks", () => {
    const supported = new Set(["BTCUSD", "ETHUSD", "XAUUSD", "XAGUSD", "USOIL", "US30"]);
    const res = extractSymbolsDeterministic({
      title: "Bitcoin Ethereum Gold Silver Oil US30",
      supportedSymbols: supported,
      assetAliasMap: {
        BITCOIN: "BTCUSD",
        ETHEREUM: "ETHUSD",
        GOLD: "XAUUSD",
        SILVER: "XAGUSD",
        OIL: "USOIL",
        US30: "US30",
      },
      maxLinks: 3,
    });
    expect(res).toHaveLength(3);
  });
});

