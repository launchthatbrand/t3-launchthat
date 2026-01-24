import { query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_CODE_LENGTH = 6;

const normalizeAppKey = (raw: string): string => String(raw ?? "").trim();

export const getByCode = query({
  args: {
    appKey: v.string(),
    code: v.string(),
  },
  returns: v.union(
    v.object({
      code: v.string(),
      appKey: v.string(),
      path: v.string(),
      kind: v.optional(v.string()),
      targetId: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      disabledAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const appKey = normalizeAppKey(args.appKey);
    const code = String(args.code ?? "").trim();
    if (!appKey || !code) return null;

    const row = await ctx.db
      .query("shortlinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!row) return null;
    if (row.appKey !== appKey) return null;
    if (typeof row.disabledAt === "number" && row.disabledAt > 0) return null;
    if (typeof row.expiresAt === "number" && row.expiresAt > 0 && row.expiresAt < Date.now()) {
      return null;
    }

    return {
      code: row.code,
      appKey: row.appKey,
      path: row.path,
      kind: row.kind ? row.kind : undefined,
      targetId: row.targetId ? row.targetId : undefined,
      expiresAt: row.expiresAt,
      disabledAt: row.disabledAt,
    };
  },
});

export const getSettings = query({
  args: {
    appKey: v.string(),
  },
  returns: v.object({
    domain: v.string(),
    enabled: v.boolean(),
    codeLength: v.number(),
    alphabet: v.string(),
  }),
  handler: async (ctx, args) => {
    const appKey = normalizeAppKey(args.appKey);
    if (!appKey) {
      return {
        domain: "",
        enabled: false,
        codeLength: DEFAULT_CODE_LENGTH,
        alphabet: DEFAULT_ALPHABET,
      };
    }

    const row = await ctx.db
      .query("shortlinkSettings")
      .withIndex("by_appKey", (q) => q.eq("appKey", appKey))
      .first();

    const alphabet =
      typeof row?.alphabet === "string" && row.alphabet.trim().length >= 10
        ? row.alphabet.trim()
        : DEFAULT_ALPHABET;

    const codeLengthRaw = typeof row?.codeLength === "number" ? row.codeLength : DEFAULT_CODE_LENGTH;
    const codeLength = Math.max(4, Math.min(12, Math.floor(codeLengthRaw)));

    return {
      domain: typeof row?.domain === "string" ? row.domain : "",
      enabled: Boolean(row?.enabled),
      codeLength,
      alphabet,
    };
  },
});

