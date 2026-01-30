export const formatUsd = (cents: number): string => {
  const v = Math.round(cents) / 100;
  return `$${v.toFixed(2)}`;
};

export const stripClerkIssuerPrefix = (userKey: unknown): string => {
  const s = typeof userKey === "string" ? userKey.trim() : "";
  const pipeIdx = s.indexOf("|");
  if (pipeIdx === -1) return s;
  const tail = s.slice(pipeIdx + 1).trim();
  return tail || s;
};

