"use node";

import { v } from "convex/values";
import {
  buildSupportOpenAiOwnerKey,
  SUPPORT_OPENAI_NODE_TYPE,
} from "launchthat-plugin-support/assistant/openai";

import { internal } from "../../_generated/api";
import { action } from "../../_generated/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const extractOpenAiToken = (credentials: Record<string, string>) =>
  credentials.token ??
  credentials.apiKey ??
  credentials.api_key ??
  credentials.key ??
  null;

export const listAvailableModels = action({
  args: {
    organizationId: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    // Cast away deep generated types (can cause TS instantiation issues).
    const internalAny = internal as any;
    await ctx.runQuery(
      internalAny.plugins.support.queries.assertSupportAdmin,
      {},
    );

    const ownerId = buildSupportOpenAiOwnerKey(args.organizationId);

    const connection = (await ctx.runQuery(
      internalAny.integrations.connections.queries
        .getConnectionByNodeTypeAndOwner,
      {
        nodeType: SUPPORT_OPENAI_NODE_TYPE,
        ownerId,
      },
    )) as { _id: string } | null;
    if (!connection?._id) {
      throw new Error(
        "OpenAI API key is not configured for this organization.",
      );
    }

    const decrypted = (await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
      {
        connectionId: connection._id,
      },
    )) as { credentials?: Record<string, string> } | null;
    const token = decrypted?.credentials
      ? extractOpenAiToken(decrypted.credentials)
      : null;
    if (!token) {
      throw new Error("Unable to read OpenAI API key for this organization.");
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new Error(
        `OpenAI models request failed (${response.status}). ${bodyText}`.trim(),
      );
    }

    const json = (await response.json()) as {
      data?: { id?: unknown }[];
    };

    const ids = (json.data ?? [])
      .map((m) => (typeof m.id === "string" ? m.id : null))
      .filter((id): id is string => Boolean(id))
      .filter((id) => id.startsWith("gpt-") || id.startsWith("o"))
      .sort((a, b) => a.localeCompare(b));

    // Always include a couple safe defaults even if filtering returns nothing.
    const safeDefaults: string[] = ["gpt-4o-mini", "gpt-4.1-mini"];
    for (const d of safeDefaults) {
      if (!ids.includes(d)) ids.unshift(d);
    }

    // Dedupe while preserving order.
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(id);
    }

    return result;
  },
});
