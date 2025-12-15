"use node";

import type { Id } from "@convex-config/_generated/dataModel";
import type { ActionCtx } from "@convex-config/_generated/server";
import { createOpenAI } from "@ai-sdk/openai";
import { api, components, internal } from "@convex-config/_generated/api";
import { action } from "@convex-config/_generated/server";
import { Agent } from "@convex-dev/agent";
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

const createSupportAgent = (apiKey: string) => {
  const openai = createOpenAI({ apiKey });
  return new Agent(components.agent, {
    name: "LaunchThat Support Assistant",
    instructions: BASE_INSTRUCTIONS,
    // Use a v2-compatible OpenAI model ID (AI SDK 5 requires v2 spec names)
    languageModel: openai.chat(SUPPORT_MODEL_ID),
  });
};

interface EnsureThreadArgs {
  organizationId: Id<"organizations">;
  sessionId: string;
}

const ensureAgentThreadId = async (
  ctx: ActionCtx,
  args: EnsureThreadArgs,
  agent: Agent,
): Promise<string> => {
  const conversationMetadata = await ctx.runQuery(
    internal.plugins.support.queries.getConversationMetadata,
    {
      organizationId: args.organizationId,
      sessionId: args.sessionId,
    },
  );

  if (conversationMetadata?.agentThreadId) {
    return conversationMetadata.agentThreadId;
  }

  const userId =
    conversationMetadata?.contactId ??
    `${args.organizationId}:${args.sessionId}`;
  const { threadId } = await agent.createThread(ctx, {
    userId,
    title: `support-${args.sessionId}`,
  });

  await ctx.runMutation(
    internal.plugins.support.mutations.setConversationAgentThread,
    {
      organizationId: args.organizationId,
      sessionId: args.sessionId,
      agentThreadId: threadId,
    },
  );

  return threadId;
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

    const supportAgent = createSupportAgent(apiKey);
    const trimmedPrompt = args.prompt.trim();
    if (!trimmedPrompt) {
      return { text: "" };
    }

    const threadId = await ensureAgentThreadId(
      ctx,
      {
        ...args,
        organizationId,
      },
      supportAgent,
    );

    let knowledgeEntries: {
      title: string;
      content: string;
    }[] = [];

    try {
      knowledgeEntries = await ctx.runAction(
        internal.plugins.support.rag.searchKnowledge,
        {
          organizationId,
          query: trimmedPrompt,
          limit: 5,
        },
      );
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
    const { thread } = await supportAgent.continueThread(ctx, { threadId });
    try {
      const result = await thread.generateText({
        system: [BASE_INSTRUCTIONS, knowledgeContext].join("\n\n"),
        messages: [{ role: "user", content: trimmedPrompt }],
      });
      text = result.text ?? "";
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
