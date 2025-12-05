"use node";

import { api, components, internal } from "@convex-config/_generated/api";

import type { ActionCtx } from "@convex-config/_generated/server";
import { Agent } from "@convex-dev/agent";
import type { Id } from "@convex-config/_generated/dataModel";
import { action } from "@convex-config/_generated/server";
import { createOpenAI } from "@ai-sdk/openai";
import { normalizeOrganizationId } from "../../constants";
import { supportOrganizationIdValidator } from "./schema";
import { v } from "convex/values";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

// eslint-disable-next-line turbo/no-undeclared-env-vars
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

const BASE_INSTRUCTIONS = [
  "You are a helpful support assistant for LaunchThat customers.",
  "Use the provided knowledge sources whenever they are available.",
  "If the answer is unclear, ask for clarification or suggest contacting a human representative.",
].join("\n");

const KNOWN_MISSING_KEY_MESSAGE =
  "Support assistant is not fully configured yet (missing API key).";

export const supportAgent = new Agent(components.agent, {
  name: "LaunchThat Support Assistant",
  description:
    "An AI helper that answers customer questions using LaunchThat data.",
  instructions: BASE_INSTRUCTIONS,
  languageModel: openai.chat("gpt-4o-mini"),
});

interface EnsureThreadArgs {
  organizationId: Id<"organizations">;
  sessionId: string;
}

const ensureAgentThreadId = async (
  ctx: ActionCtx,
  args: EnsureThreadArgs,
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
  const { threadId } = await supportAgent.createThread(ctx, {
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

    if (!OPENAI_API_KEY) {
      console.warn("[support-agent] missing OPENAI_API_KEY");
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

    const trimmedPrompt = args.prompt.trim();
    if (!trimmedPrompt) {
      return { text: "" };
    }

    const threadId = await ensureAgentThreadId(ctx, {
      ...args,
      organizationId,
    });

    let knowledgeEntries: Array<{
      title: string;
      content: string;
    }> = [];

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

    const { thread } = await supportAgent.continueThread(ctx, { threadId });
    const result = await thread.generateText({
      system: [BASE_INSTRUCTIONS, knowledgeContext].join("\n\n"),
      messages: [{ role: "user", content: trimmedPrompt }],
    });

    const text = result.text ?? "";

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
