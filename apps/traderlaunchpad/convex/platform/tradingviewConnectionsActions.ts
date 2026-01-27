"use node";

import { v } from "convex/values";

import { action } from "../_generated/server";
import { env } from "../../src/env";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

// Avoid typed api imports here (can cause TS deep instantiation errors in node actions).
const componentsUntyped: any = require("../_generated/api").components;
const traderlaunchpadPlatform = componentsUntyped.launchthat_traderlaunchpad.connections.platform;

const textEncoder = new TextEncoder();

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

const base64Encode = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64");

const base64Decode = (input: string): Uint8Array =>
  new Uint8Array(Buffer.from(String(input), "base64"));

const deriveAesKey = async (keyMaterial: string): Promise<CryptoKey> => {
  const keyBytes = await crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(textEncoder.encode(keyMaterial)),
  );
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
};

const encryptSecret = async (plaintext: string, keyMaterial: string): Promise<string> => {
  const key = await deriveAesKey(keyMaterial);
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const iv = toArrayBuffer(ivBytes);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      toArrayBuffer(textEncoder.encode(plaintext)),
    ),
  );
  const tag = ciphertext.slice(ciphertext.length - 16);
  const data = ciphertext.slice(0, ciphertext.length - 16);
  const payload = {
    v: 1,
    alg: "aes-256-gcm",
    ivB64: base64Encode(ivBytes),
    tagB64: base64Encode(tag),
    dataB64: base64Encode(data),
  };
  const encoded = base64Encode(textEncoder.encode(JSON.stringify(payload)));
  return `enc_v1:${encoded}`;
};

export const upsertAccount = action({
  args: {
    accountId: v.optional(v.string()),
    label: v.string(),
    username: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("disabled"))),
    makeDefault: v.optional(v.boolean()),
    sessionId: v.string(),
    sessionSign: v.string(),
  },
  returns: v.object({ ok: v.boolean(), accountId: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const keyMaterial = env.TRADELOCKER_SECRETS_KEY;
    if (!keyMaterial) throw new Error("Missing TRADELOCKER_SECRETS_KEY");

    const label = args.label.trim();
    const sessionId = args.sessionId.trim();
    const sessionSign = args.sessionSign.trim();
    if (!label) throw new Error("Missing label");
    if (!sessionId) throw new Error("Missing TradingView sessionId");
    if (!sessionSign) throw new Error("Missing TradingView sessionSign");

    const sessionIdEncrypted = await encryptSecret(sessionId, keyMaterial);
    const sessionSignEncrypted = await encryptSecret(sessionSign, keyMaterial);

    const res: any = await ctx.runMutation(
      traderlaunchpadPlatform.upsertTradingViewConnectionWithSecrets,
      {
        connectionId: args.accountId ? (args.accountId as any) : undefined,
        label,
        username: args.username?.trim() ? args.username.trim() : undefined,
        status: args.status === "disabled" ? "disabled" : "active",
        makeDefault: Boolean(args.makeDefault),
        secrets: {
          sessionIdEncrypted,
          sessionSignEncrypted,
        },
      },
    );

    return {
      ok: true,
      accountId: typeof res?.connectionId === "string" ? res.connectionId : undefined,
    };
  },
});

export const validateAccount = action({
  args: {
    sessionId: v.string(),
    sessionSign: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    // NOTE: Real TradingView validation is intentionally deferred (requires a stable, supported auth flow).
    // For now, do basic shape validation so the UI can provide immediate feedback.
    const sid = args.sessionId.trim();
    const sig = args.sessionSign.trim();
    if (!sid || sid.length < 10) return { ok: false, error: "sessionId looks too short" };
    if (!sig || sig.length < 10) return { ok: false, error: "sessionSign looks too short" };
    return { ok: true };
  },
});

