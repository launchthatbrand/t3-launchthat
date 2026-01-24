import { mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_CODE_LENGTH = 6;

const normalizeAppKey = (raw: string): string => String(raw ?? "").trim();

const normalizePath = (raw: string): string => {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // Disallow absolute URLs / protocol-relative URLs.
  if (s.includes("://")) return "";
  if (s.startsWith("//")) return "";

  // Force leading slash.
  if (!s.startsWith("/")) return "";

  // Basic length guard.
  if (s.length > 2048) return "";

  return s;
};

const normalizeDomain = (raw: string): string => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "";
  // hostname only (no protocol, no path)
  if (s.includes("://")) return "";
  if (s.includes("/")) return "";
  if (!/^[a-z0-9.-]+$/.test(s)) return "";
  return s;
};

const generateCode = (alphabet: string, length: number): string => {
  let out = "";
  const chars = alphabet.length > 0 ? alphabet : DEFAULT_ALPHABET;
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    out += chars[idx] ?? "0";
  }
  return out;
};

export const create = mutation({
  args: {
    appKey: v.string(),
    path: v.string(),
    kind: v.optional(v.string()),
    targetId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdByUserId: v.optional(v.string()),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const appKey = normalizeAppKey(args.appKey);
    if (!appKey) throw new Error("Invalid appKey");

    const path = normalizePath(args.path);
    if (!path) throw new Error("Invalid path (must be a relative path starting with /)");

    const kind = typeof args.kind === "string" ? args.kind.trim() : "";
    const targetId = typeof args.targetId === "string" ? args.targetId.trim() : "";

    // Prefer stable codes when kind/targetId are provided.
    if (kind && targetId) {
      const existing = await ctx.db
        .query("shortlinks")
        .withIndex("by_appKey_and_kind_and_targetId", (q) =>
          q.eq("appKey", appKey).eq("kind", kind).eq("targetId", targetId),
        )
        .first();
      if (
        existing &&
        !(typeof existing.disabledAt === "number" && existing.disabledAt > 0) &&
        !(typeof existing.expiresAt === "number" && existing.expiresAt > 0 && existing.expiresAt < Date.now())
      ) {
        return { code: existing.code };
      }
    }

    // Otherwise, avoid duplicates per appKey+path if it already exists.
    const existingByPath = await ctx.db
      .query("shortlinks")
      .withIndex("by_appKey_and_path", (q) => q.eq("appKey", appKey).eq("path", path))
      .first();
    if (
      existingByPath &&
      !(typeof existingByPath.disabledAt === "number" && existingByPath.disabledAt > 0) &&
      !(typeof existingByPath.expiresAt === "number" && existingByPath.expiresAt > 0 && existingByPath.expiresAt < Date.now())
    ) {
      return { code: existingByPath.code };
    }

    const settings = await ctx.db
      .query("shortlinkSettings")
      .withIndex("by_appKey", (q) => q.eq("appKey", appKey))
      .first();

    const alphabet =
      typeof settings?.alphabet === "string" && settings.alphabet.trim().length >= 10
        ? settings.alphabet.trim()
        : DEFAULT_ALPHABET;

    const codeLengthRaw =
      typeof settings?.codeLength === "number" ? settings.codeLength : DEFAULT_CODE_LENGTH;
    const codeLength = Math.max(4, Math.min(12, Math.floor(codeLengthRaw)));

    const now = Date.now();
    const expiresAt =
      typeof args.expiresAt === "number" && args.expiresAt > 0 ? args.expiresAt : undefined;

    for (let attempt = 0; attempt < 30; attempt++) {
      const code = generateCode(alphabet, codeLength);
      const collision = await ctx.db
        .query("shortlinks")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (collision) continue;

      await ctx.db.insert("shortlinks", {
        code,
        appKey,
        path,
        kind: kind || "",
        targetId: targetId || "",
        createdAt: now,
        createdByUserId:
          typeof args.createdByUserId === "string" && args.createdByUserId.trim()
            ? args.createdByUserId.trim()
            : undefined,
        expiresAt,
        clickCount: 0,
      });

      return { code };
    }

    throw new Error("Failed to generate unique shortlink code (too many collisions)");
  },
});

export const upsertSettings = mutation({
  args: {
    appKey: v.string(),
    domain: v.string(),
    enabled: v.boolean(),
    codeLength: v.number(),
    alphabet: v.optional(v.string()),
    updatedByUserId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appKey = normalizeAppKey(args.appKey);
    if (!appKey) throw new Error("Invalid appKey");

    const domain = normalizeDomain(args.domain);
    if (!domain) throw new Error("Invalid domain (hostname only, no protocol/path)");

    const codeLength = Math.max(4, Math.min(12, Math.floor(args.codeLength)));
    const alphabet =
      typeof args.alphabet === "string" && args.alphabet.trim().length >= 10
        ? args.alphabet.trim()
        : undefined;

    const now = Date.now();
    const existing = await ctx.db
      .query("shortlinkSettings")
      .withIndex("by_appKey", (q) => q.eq("appKey", appKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        domain,
        enabled: Boolean(args.enabled),
        codeLength,
        alphabet,
        updatedAt: now,
        updatedByUserId:
          typeof args.updatedByUserId === "string" && args.updatedByUserId.trim()
            ? args.updatedByUserId.trim()
            : undefined,
      });
      return null;
    }

    await ctx.db.insert("shortlinkSettings", {
      appKey,
      domain,
      enabled: Boolean(args.enabled),
      codeLength,
      alphabet,
      createdAt: now,
      updatedAt: now,
      updatedByUserId:
        typeof args.updatedByUserId === "string" && args.updatedByUserId.trim()
          ? args.updatedByUserId.trim()
          : undefined,
    });

    return null;
  },
});

