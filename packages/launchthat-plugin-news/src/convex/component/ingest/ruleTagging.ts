export type RuleDirection = "bullish" | "bearish" | "neutral";

export type RuleClassification = {
  method: "rules";
  version: "v1";
  topics: string[];
  direction?: RuleDirection;
};

const normalize = (s: string): string => s.trim().toUpperCase();

const hasAny = (text: string, needles: string[]): boolean => {
  for (const n of needles) {
    if (text.includes(n)) return true;
  }
  return false;
};

export const classifyByRules = (args: {
  title: string;
  summary?: string;
}): RuleClassification => {
  const text = `${normalize(args.title)} ${typeof args.summary === "string" ? normalize(args.summary) : ""}`.trim();

  const topics = new Set<string>();

  // Macro / CB
  if (hasAny(text, ["FED", "FOMC", "POWELL", "RATE CUT", "RATE HIKE", "INTEREST RATE", "ECB", "BOE", "BOJ", "CENTRAL BANK"])) {
    topics.add("central_bank");
  }
  if (hasAny(text, ["CPI", "PCE", "INFLATION", "PRICE PRESSURE"])) topics.add("inflation");
  if (hasAny(text, ["NFP", "NONFARM", "JOBLESS", "UNEMPLOYMENT", "PAYROLLS"])) topics.add("employment");
  if (hasAny(text, ["GDP", "PMI", "RECESSION", "GROWTH"])) topics.add("growth");

  // Asset classes (useful even before symbol linking)
  if (hasAny(text, ["BITCOIN", "BTC", "ETHEREUM", "ETH", "CRYPTO"])) topics.add("crypto");
  if (hasAny(text, ["GOLD", "XAU", "SILVER", "XAG"])) topics.add("metals");
  if (hasAny(text, ["OIL", "WTI", "BRENT"])) topics.add("energy");
  if (hasAny(text, ["US30", "DOW", "DJIA", "NASDAQ", "SP500", "S&P"])) topics.add("indices");
  if (hasAny(text, ["FOREX", "USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "NZD"])) topics.add("fx");

  // Direction (only when obvious).
  const bullish = hasAny(text, ["SURGE", "RALLY", "CLIMB", "JUMP", "SOAR", "GAINS", "REBOUND", "RISK-ON", "BULLISH"]);
  const bearish = hasAny(text, ["PLUNGE", "SINK", "DROP", "TUMBLE", "SLIDE", "SELL-OFF", "RISK-OFF", "BEARISH"]);

  let direction: RuleDirection | undefined;
  if (bullish && !bearish) direction = "bullish";
  if (bearish && !bullish) direction = "bearish";

  return {
    method: "rules",
    version: "v1",
    topics: Array.from(topics.values()).sort(),
    ...(direction ? { direction } : {}),
  };
};

