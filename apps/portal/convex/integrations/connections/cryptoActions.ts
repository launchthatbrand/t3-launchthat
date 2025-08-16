"use node";

import { decryptRecord, encryptRecord, maskFromRecord } from "../lib/crypto";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

/** Create connection with encrypted secrets (internal only) */
export const createWithEncryptedSecrets = internalAction({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    credentials: v.string(),
    config: v.optional(v.string()),
    ownerId: v.union(v.id("users"), v.string()),
    status: v.string(),
    createdAt: v.number(),
  },
  returns: v.id("connections"),
  handler: async (ctx, args) => {
    const credentialsRecord = { token: args.credentials };
    const ciphertext = encryptRecord(credentialsRecord);
    const maskedCredentials = maskFromRecord(credentialsRecord);

    return await ctx.runMutation(
      internal.integrations.connections.internalConnections
        .insertConnectionWithSecrets,
      {
        appId: args.appId,
        name: args.name,
        credentials: args.credentials,
        ciphertext,
        maskedCredentials,
        status: args.status,
        config: args.config,
        ownerId: args.ownerId,
        createdAt: args.createdAt,
      },
    );
  },
});

/** Rotate connection secrets with encryption (internal only) */
export const rotateEncryptedSecrets = internalAction({
  args: {
    connectionId: v.id("connections"),
    newCredentials: v.record(v.string(), v.string()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const ciphertext = encryptRecord(args.newCredentials);
    const maskedCredentials = maskFromRecord(args.newCredentials);

    return await ctx.runMutation(
      internal.integrations.connections.internalConnections
        .updateConnectionSecrets,
      {
        connectionId: args.connectionId,
        credentials:
          args.newCredentials.token ?? Object.values(args.newCredentials)[0],
        ciphertext,
        maskedCredentials,
        expiresAt: args.expiresAt,
      },
    );
  },
});

/** Get decrypted secrets (internal only) */
export const getDecryptedSecrets = internalAction({
  args: { connectionId: v.id("connections") },
  returns: v.union(
    v.object({
      credentials: v.record(v.string(), v.string()),
      expiresAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const raw = await ctx.runQuery(
      internal.integrations.connections.internalConnections.getRawById,
      { id: args.connectionId },
    );
    if (!raw?.secrets) return null;

    // Try decrypted format first
    if (raw.secrets.ciphertext) {
      try {
        const credentials = decryptRecord(raw.secrets.ciphertext);
        return {
          credentials,
          expiresAt: raw.secrets.expiresAt,
        };
      } catch (error) {
        console.error("Failed to decrypt secrets:", error);
        // Fall back to legacy format
      }
    }

    // Legacy format fallback
    if (raw.secrets.credentials) {
      return {
        credentials: raw.secrets.credentials,
        expiresAt: raw.secrets.expiresAt,
      };
    }

    return null;
  },
});
