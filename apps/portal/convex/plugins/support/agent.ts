"use node";

import type { Id } from "@convex-config/_generated/dataModel";
import type { ActionCtx } from "@convex-config/_generated/server";
import { createOpenAI } from "@ai-sdk/openai";
import { api, components, internal } from "@convex-config/_generated/api";
import { action } from "@convex-config/_generated/server";
import { generateText, type ModelMessage } from "ai";
import { v } from "convex/values";
import {
  buildSupportOpenAiOwnerKey,
  SUPPORT_OPENAI_NODE_TYPE,
} from "launchthat-plugin-support/assistant/openai";

import { normalizeOrganizationId } from "../../constants";
import { supportOrganizationIdValidator } from "./schema";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

const BASE_INSTRUCTIONS = [
  "You are a helpful support assistant for LaunchThat customers.",
  "Use the provided knowledge sources whenever they are available.",
  "If the answer is unclear, ask for clarification or suggest contacting a human representative.",
].join("\n");

const KNOWN_MISSING_KEY_MESSAGE =
  "Support assistant is not fully configured yet (missing OpenAI API key). Add one in Support → Settings → AI Assistant.";

const SUPPORT_MODEL_ID = "gpt-4.1-mini";

const createSupportModel = (apiKey: string) => {
  const openai = createOpenAI({ apiKey });
  // Bypass @convex-dev/agent thread machinery (currently crashing in stripUnknownFields).
  return openai.chat(SUPPORT_MODEL_ID);
};

const buildKnowledgeContext = (
  entries: { title: string; content: string }[],
) => {
  if (entries.length === 0) {
    return "No curated knowledge entries were found for this question.";
  }

  return entries
    .map(
      (entry, index) => `Source ${index + 1}: ${entry.title}\n${entry.content}`,
    )
    .join("\n\n");
};

const buildConversationMessages = (args: {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  latestUserMessage: string;
}): ModelMessage[] => {
  const messages: ModelMessage[] = [];
  for (const message of args.history.slice(-12)) {
    const content = message.content?.trim();
    if (!content) continue;
    messages.push({ role: message.role, content });
  }
  messages.push({ role: "user", content: args.latestUserMessage });
  return messages;
};

const resolveOrganizationOpenAiKey = async (
  ctx: ActionCtx,
  organizationId: Id<"organizations">,
) => {
  const ownerId = buildSupportOpenAiOwnerKey(organizationId);
  const connection = await ctx.runQuery(
    internal.integrations.connections.queries.getConnectionByNodeTypeAndOwner,
    {
      nodeType: SUPPORT_OPENAI_NODE_TYPE,
      ownerId,
    },
  );
  if (!connection) {
    return null;
  }
  const decrypted = await ctx.runAction(
    internal.integrations.connections.cryptoActions.getDecryptedSecrets,
    {
      connectionId: connection._id,
    },
  );
  if (!decrypted?.credentials) {
    return null;
  }
  const credentials = decrypted.credentials;
  return (
    credentials.token ??
    credentials.apiKey ??
    credentials.api_key ??
    credentials.key ??
    null
  );
};

export const generateAgentReply = action({
  args: {
    organizationId: supportOrganizationIdValidator,
    sessionId: v.string(),
    prompt: v.string(),
    contactId: v.optional(v.id("contacts")),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contextTags: v.optional(v.array(v.string())),
  },
  returns: v.object({
    text: v.string(),
  }),
  handler: async (ctx, args) => {
    const organizationId = normalizeOrganizationId(args.organizationId);
    const apiKey = await resolveOrganizationOpenAiKey(ctx, organizationId);

    if (!apiKey) {
      console.warn(
        "[support-agent] missing OpenAI key for org",
        organizationId,
      );
      await ctx.runMutation(
        internal.plugins.support.mutations.recordMessageInternal,
        {
          organizationId,
          sessionId: args.sessionId,
          role: "assistant",
          content: KNOWN_MISSING_KEY_MESSAGE,
          contactId: args.contactId ?? undefined,
          contactEmail: args.contactEmail ?? undefined,
          contactName: args.contactName ?? undefined,
          source: "agent",
        },
      );
      return { text: KNOWN_MISSING_KEY_MESSAGE };
    }

    const model = createSupportModel(apiKey);
    const trimmedPrompt = args.prompt.trim();
    if (!trimmedPrompt) {
      return { text: "" };
    }

    let knowledgeEntries: {
      title: string;
      content: string;
    }[] = [];

    try {
      const tags = (args.contextTags ?? [])
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 10);
      knowledgeEntries =
        tags.length > 0
          ? await ctx.runAction(internal.plugins.support.rag.searchKnowledgeForContext, {
              organizationId,
              query: trimmedPrompt,
              tags,
              limit: 5,
            })
          : await ctx.runAction(internal.plugins.support.rag.searchKnowledge, {
              organizationId,
              query: trimmedPrompt,
              limit: 5,
            });
    } catch (searchError) {
      console.error("[support-agent] rag search failed", searchError);
    }

    if (knowledgeEntries.length === 0) {
      knowledgeEntries = await ctx.runQuery(
        api.plugins.support.queries.listHelpdeskArticles,
        {
          organizationId,
          query: trimmedPrompt,
          limit: 5,
        },
      );
    }

    const knowledgeContext = buildKnowledgeContext(
      knowledgeEntries.map((entry) => ({
        title: entry.title,
        content: entry.content,
      })),
    );

    let text = "";
    try {
      const history = await ctx.runQuery(api.plugins.support.queries.listMessages, {
        organizationId,
        sessionId: args.sessionId,
      });

      const messages = buildConversationMessages({
        history: history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        latestUserMessage: trimmedPrompt,
      });

      const result = await generateText({
        model,
        system: [BASE_INSTRUCTIONS, knowledgeContext].join("\n\n"),
        messages,
      });

      text = typeof result.text === "string" ? result.text : "";
    } catch (modelError) {
      console.error("[support-agent] model error", modelError);
      text =
        "Support assistant is not fully configured yet (model unavailable). Please contact an administrator.";
    }

    if (text.trim()) {
      await ctx.runMutation(
        internal.plugins.support.mutations.recordMessageInternal,
        {
          organizationId,
          sessionId: args.sessionId,
          role: "assistant",
          content: text,
          contactId: args.contactId ?? undefined,
          contactEmail: args.contactEmail ?? undefined,
          contactName: args.contactName ?? undefined,
          source: "agent",
        },
      );
    }

    return { text };
  },
});
