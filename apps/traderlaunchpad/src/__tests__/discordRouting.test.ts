import { resolveChannelsForEventFromRules } from "launchthat-plugin-discord/runtime/routing";

describe("resolveChannelsForEventFromRules", () => {
  test("first_match returns first matching rule by order", () => {
    const result = resolveChannelsForEventFromRules({
      matchStrategy: "first_match",
      actorRole: "member",
      symbol: "BTCUSD",
      rules: [
        {
          enabled: true,
          channelId: "chan-2",
          order: 1,
          priority: 0,
          symbols: ["BTCUSD"],
        },
        {
          enabled: true,
          channelId: "chan-1",
          order: 0,
          priority: 0,
          symbols: ["BTCUSD"],
        },
      ],
    });
    expect(result).toEqual(["chan-1"]);
  });

  test("multi_cast returns all matches in order", () => {
    const result = resolveChannelsForEventFromRules({
      matchStrategy: "multi_cast",
      actorRole: "admin",
      symbol: "BTCUSD",
      rules: [
        {
          enabled: true,
          channelId: "chan-admin-any",
          order: 0,
          priority: 0,
          actorRoles: ["admin"],
        },
        {
          enabled: true,
          channelId: "chan-admin-btc",
          order: 1,
          priority: 0,
          actorRoles: ["admin"],
          symbols: ["BTCUSD"],
        },
      ],
    });
    expect(result).toEqual(["chan-admin-any", "chan-admin-btc"]);
  });

  test("priority returns highest priority match(es)", () => {
    const result = resolveChannelsForEventFromRules({
      matchStrategy: "priority",
      actorRole: "admin",
      symbol: "BTCUSD",
      rules: [
        {
          enabled: true,
          channelId: "low",
          order: 0,
          priority: 1,
          actorRoles: ["admin"],
        },
        {
          enabled: true,
          channelId: "high-a",
          order: 1,
          priority: 5,
          actorRoles: ["admin"],
          symbols: ["BTCUSD"],
        },
        {
          enabled: true,
          channelId: "high-b",
          order: 2,
          priority: 5,
          actorRoles: ["admin"],
          symbols: ["BTCUSD"],
        },
      ],
    });
    expect(result).toEqual(["high-a", "high-b"]);
  });

  test("role and symbol conditions both apply, symbol matching is case-insensitive", () => {
    const result = resolveChannelsForEventFromRules({
      matchStrategy: "first_match",
      actorRole: "admin",
      symbol: "btcusd",
      rules: [
        {
          enabled: true,
          channelId: "wrong-role",
          order: 0,
          priority: 0,
          actorRoles: ["member"],
          symbols: ["BTCUSD"],
        },
        {
          enabled: true,
          channelId: "correct",
          order: 1,
          priority: 0,
          actorRoles: ["admin"],
          symbols: ["BTCUSD"],
        },
      ],
    });
    expect(result).toEqual(["correct"]);
  });

  test("no matches returns empty array", () => {
    const result = resolveChannelsForEventFromRules({
      matchStrategy: "first_match",
      actorRole: "member",
      symbol: "EURUSD",
      rules: [
        {
          enabled: true,
          channelId: "btc-only",
          order: 0,
          priority: 0,
          symbols: ["BTCUSD"],
        },
      ],
    });
    expect(result).toEqual([]);
  });
});

