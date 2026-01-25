export type CommunityPosition = {
  userId: string;
  direction: "long" | "short";
  netQty: number;
  avgEntryPrice?: number | null;
  openedAt: number;
};

export type CommunityCluster = {
  count: number;
  direction: "long" | "short" | "mixed";
  avgEntryPrice: number;
  avgOpenedAt: number;
  totalAbsQty: number;
  netQty: number;
  userIds: string[];
};

const safeNumber = (n: unknown, fallback: number): number =>
  typeof n === "number" && Number.isFinite(n) ? n : fallback;

/**
 * Cluster community open positions into <= maxClusters buckets by entry price.
 *
 * Strategy:
 * - Filter invalid rows (missing avgEntryPrice).
 * - Sort by entry price.
 * - Greedy price-binning using a dynamic bin width derived from price range.
 * - If bins exceed maxClusters, merge smallest neighboring bins until <= maxClusters.
 */
export const clusterCommunityPositions = (args: {
  positions: CommunityPosition[];
  maxClusters: number;
}): CommunityCluster[] => {
  const maxClusters = Math.max(1, Math.min(10, safeNumber(args.maxClusters, 10)));
  const rows = Array.isArray(args.positions) ? args.positions : [];

  const valid = rows
    .map((p) => ({
      userId: String(p.userId ?? ""),
      direction: p.direction === "short" ? ("short" as const) : ("long" as const),
      netQty: safeNumber(p.netQty, 0),
      avgEntryPrice:
        typeof p.avgEntryPrice === "number" && Number.isFinite(p.avgEntryPrice)
          ? p.avgEntryPrice
          : null,
      openedAt: safeNumber(p.openedAt, 0),
    }))
    .filter((p) => Boolean(p.userId) && p.avgEntryPrice !== null);

  if (valid.length === 0) return [];

  const sorted = valid.slice().sort((a, b) => (a.avgEntryPrice! - b.avgEntryPrice!));
  const minP = sorted[0]!.avgEntryPrice!;
  const maxP = sorted[sorted.length - 1]!.avgEntryPrice!;
  const range = Math.max(0, maxP - minP);

  // Heuristic: target ~maxClusters bins; widen if range is tiny.
  const binWidth = range > 0 ? range / Math.min(maxClusters, 10) : Math.max(1e-6, minP * 0.0005);

  type Bin = {
    sumPriceWeighted: number;
    sumAbsQty: number;
    sumOpenedAtWeighted: number;
    netQty: number;
    count: number;
    userIds: string[];
    longCount: number;
    shortCount: number;
    minPrice: number;
    maxPrice: number;
  };

  const bins: Bin[] = [];
  let current: Bin | null = null;

  const startNew = (p: (typeof sorted)[number]): Bin => ({
    sumPriceWeighted: p.avgEntryPrice! * Math.abs(p.netQty || 1),
    sumAbsQty: Math.abs(p.netQty || 1),
    sumOpenedAtWeighted: safeNumber(p.openedAt, 0) * Math.abs(p.netQty || 1),
    netQty: p.netQty,
    count: 1,
    userIds: [p.userId],
    longCount: p.direction === "long" ? 1 : 0,
    shortCount: p.direction === "short" ? 1 : 0,
    minPrice: p.avgEntryPrice!,
    maxPrice: p.avgEntryPrice!,
  });

  for (const p of sorted) {
    if (!current) {
      current = startNew(p);
      bins.push(current);
      continue;
    }

    const price = p.avgEntryPrice!;
    const within = price - current.maxPrice <= binWidth;
    if (!within) {
      current = startNew(p);
      bins.push(current);
      continue;
    }

    const w = Math.abs(p.netQty || 1);
    current.sumPriceWeighted += price * w;
    current.sumAbsQty += w;
    current.sumOpenedAtWeighted += safeNumber(p.openedAt, 0) * w;
    current.netQty += p.netQty;
    current.count += 1;
    current.userIds.push(p.userId);
    if (p.direction === "long") current.longCount += 1;
    else current.shortCount += 1;
    current.maxPrice = Math.max(current.maxPrice, price);
  }

  const toCluster = (b: Bin): CommunityCluster => {
    const avgEntryPrice = b.sumAbsQty > 0 ? b.sumPriceWeighted / b.sumAbsQty : b.minPrice;
    const avgOpenedAt = b.sumAbsQty > 0 ? b.sumOpenedAtWeighted / b.sumAbsQty : 0;
    const direction =
      b.longCount > 0 && b.shortCount > 0
        ? ("mixed" as const)
        : b.shortCount > 0
          ? ("short" as const)
          : ("long" as const);
    return {
      count: b.count,
      direction,
      avgEntryPrice,
      avgOpenedAt,
      totalAbsQty: b.sumAbsQty,
      netQty: b.netQty,
      userIds: b.userIds,
    };
  };

  // If we have too many bins, merge smallest neighboring bins until <= maxClusters.
  const mergeNeighbors = (left: Bin, right: Bin): Bin => ({
    sumPriceWeighted: left.sumPriceWeighted + right.sumPriceWeighted,
    sumAbsQty: left.sumAbsQty + right.sumAbsQty,
    sumOpenedAtWeighted: left.sumOpenedAtWeighted + right.sumOpenedAtWeighted,
    netQty: left.netQty + right.netQty,
    count: left.count + right.count,
    userIds: left.userIds.concat(right.userIds),
    longCount: left.longCount + right.longCount,
    shortCount: left.shortCount + right.shortCount,
    minPrice: Math.min(left.minPrice, right.minPrice),
    maxPrice: Math.max(left.maxPrice, right.maxPrice),
  });

  let work = bins.slice();
  while (work.length > maxClusters) {
    // Find smallest bin by weight; merge with the closer neighbor.
    let minIdx = 0;
    let minW = work[0]!.sumAbsQty;
    for (let i = 1; i < work.length; i++) {
      const w = work[i]!.sumAbsQty;
      if (w < minW) {
        minW = w;
        minIdx = i;
      }
    }

    const leftIdx = minIdx - 1;
    const rightIdx = minIdx + 1;
    if (leftIdx < 0 && rightIdx >= work.length) break;
    if (leftIdx < 0) {
      work.splice(minIdx, 2, mergeNeighbors(work[minIdx]!, work[rightIdx]!));
      continue;
    }
    if (rightIdx >= work.length) {
      work.splice(leftIdx, 2, mergeNeighbors(work[leftIdx]!, work[minIdx]!));
      continue;
    }

    const leftGap = Math.abs(work[minIdx]!.minPrice - work[leftIdx]!.maxPrice);
    const rightGap = Math.abs(work[rightIdx]!.minPrice - work[minIdx]!.maxPrice);
    if (leftGap <= rightGap) {
      work.splice(leftIdx, 2, mergeNeighbors(work[leftIdx]!, work[minIdx]!));
    } else {
      work.splice(minIdx, 2, mergeNeighbors(work[minIdx]!, work[rightIdx]!));
    }
  }

  return work
    .map(toCluster)
    .sort((a, b) => b.totalAbsQty - a.totalAbsQty)
    .slice(0, maxClusters);
};

