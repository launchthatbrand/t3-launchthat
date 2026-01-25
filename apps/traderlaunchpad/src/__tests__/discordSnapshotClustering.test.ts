import type {
  CommunityPosition,
} from "../../../../packages/launchthat-plugin-traderlaunchpad/src/runtime/discordSnapshot/clustering";
import {
  clusterCommunityPositions,
} from "../../../../packages/launchthat-plugin-traderlaunchpad/src/runtime/discordSnapshot/clustering";

describe("clusterCommunityPositions", () => {
  it("clusters into <= 10 buckets", () => {
    const positions: CommunityPosition[] = Array.from({ length: 50 }).map((_, i) => ({
      userId: `u${i}`,
      direction: i % 2 === 0 ? ("long" as const) : ("short" as const),
      netQty: 1,
      avgEntryPrice: 100 + i,
      openedAt: 1_700_000_000_000 + i * 60_000,
    }));
    const clusters = clusterCommunityPositions({ positions, maxClusters: 10 });
    expect(clusters.length).toBeLessThanOrEqual(10);
  });

  it("returns empty when avgEntryPrice missing", () => {
    const clusters = clusterCommunityPositions({
      positions: [
        {
          userId: "u1",
          direction: "long",
          netQty: 1,
          openedAt: 1,
        },
      ],
      maxClusters: 10,
    });
    expect(clusters).toEqual([]);
  });

  it("marks mixed direction when both long and short are in same bucket", () => {
    const clusters = clusterCommunityPositions({
      positions: [
        {
          userId: "u1",
          direction: "long",
          netQty: 1,
          avgEntryPrice: 100,
          openedAt: 10,
        },
        {
          userId: "u2",
          direction: "short",
          netQty: 1,
          avgEntryPrice: 100,
          openedAt: 20,
        },
      ],
      maxClusters: 10,
    });
    expect(clusters.length).toBe(1);
    expect(clusters[0]?.direction).toBe("mixed");
  });
});

