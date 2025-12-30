"use node";

import type { Id } from "@convex-config/_generated/dataModel";
import type { ActionCtx } from "@convex-config/_generated/server";
import type { ModelMessage } from "ai";
import type { FunctionReference } from "convex/server";
import { createOpenAI } from "@ai-sdk/openai";
import { api, components, internal } from "@convex-config/_generated/api";
import { action } from "@convex-config/_generated/server";
import { generateText } from "ai";
import { v } from "convex/values";
import {
  buildSupportOpenAiOwnerKey,
  SUPPORT_OPENAI_NODE_TYPE,
} from "launchthat-plugin-support/assistant/openai";
import {
  defaultSupportAssistantBaseInstructions,
  supportAssistantBaseInstructionsKey,
} from "launchthat-plugin-support/settings";

import { normalizeOrganizationId } from "../../constants";
import { supportOrganizationIdValidator } from "./schema";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

const FALLBACK_BASE_INSTRUCTIONS = defaultSupportAssistantBaseInstructions;

const KNOWN_MISSING_KEY_MESSAGE =
  "Support assistant is not fully configured yet (missing OpenAI API key). Add one in Support → Settings → AI Assistant.";

const SUPPORT_MODEL_ID = "gpt-4.1-mini";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
type AnyInternalQueryRef = FunctionReference<
  "query",
  "internal",
  unknown,
  unknown
>;

const agentMessages = (
  components as unknown as {
    agent: { messages: { listMessagesByThreadId: AnyInternalQueryRef } };
  }
).agent.messages;

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
  history: { role: "user" | "assistant"; content: string }[];
  latestUserMessage: string;
}): ModelMessage[] => {
  const messages: ModelMessage[] = [];
  for (const message of args.history.slice(-12)) {
    const content = message.content.trim();
    if (!content) continue;
    messages.push({ role: message.role, content });
  }
  messages.push({ role: "user", content: args.latestUserMessage });
  return messages;
};

const inferPostTypeSlugFromContextTags = (tags?: string[]) => {
  if (!Array.isArray(tags)) return null;
  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (!tag) continue;
    const parts = tag.split(":").map((p) => p.trim());
    // Expected: lms:<postTypeSlug>:<postId>
    if (parts.length >= 3 && parts[0] === "lms") {
      const slug = parts[1];
      if (slug) return slug.toLowerCase();
    }
  }
  return null;
};

const parseStringOption = (value: unknown) => {
  if (typeof value === "string") return value;
  return null;
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
    threadId: v.string(),
    prompt: v.string(),
    contactId: v.optional(v.string()),
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
          threadId: args.threadId,
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

    // Persist the user message to the canonical agent thread storage first.
    await ctx.runMutation(
      internal.plugins.support.mutations.recordMessageInternal,
      {
        organizationId,
        threadId: args.threadId,
        role: "user",
        content: trimmedPrompt,
        contactId: args.contactId ?? undefined,
        contactEmail: args.contactEmail ?? undefined,
        contactName: args.contactName ?? undefined,
        source: "agent",
      },
    );

    let knowledgeEntries: {
      title: string;
      content: string;
    }[] = [];

    try {
      const tags = (args.contextTags ?? [])
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
        .slice(0, 10);
      knowledgeEntries =
        tags.length > 0
          ? await ctx.runAction(
              api.plugins.support.rag.searchKnowledgeForContext,
              {
                organizationId,
                query: trimmedPrompt,
                tags,
                limit: 5,
              },
            )
          : await ctx.runAction(api.plugins.support.rag.searchKnowledge, {
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

    // Determine effective base instructions: post-type override (if enabled) else global.
    let globalBaseInstructions = FALLBACK_BASE_INSTRUCTIONS;
    try {
      const stored = await ctx.runQuery(
        api.plugins.support.options.getSupportOption,
        {
          organizationId,
          key: supportAssistantBaseInstructionsKey,
        },
      );
      const asString = parseStringOption(stored);
      if (asString && asString.trim().length > 0) {
        globalBaseInstructions = asString.trim();
      }
    } catch (error) {
      console.warn(
        "[support-agent] failed to load global base instructions",
        error,
      );
    }

    let effectiveBaseInstructions = globalBaseInstructions;
    const inferredPostTypeSlug = inferPostTypeSlugFromContextTags(
      args.contextTags,
    );
    if (inferredPostTypeSlug) {
      try {
        const config = await ctx.runQuery(
          api.plugins.support.queries.getRagSourceConfigForPostType,
          { organizationId, postTypeSlug: inferredPostTypeSlug },
        );
        if (
          config?.isEnabled &&
          config.useCustomBaseInstructions &&
          config.baseInstructions.trim().length > 0
        ) {
          effectiveBaseInstructions = config.baseInstructions.trim();
        }
      } catch (error) {
        console.warn(
          "[support-agent] failed to load post-type base instructions",
          { inferredPostTypeSlug },
          error,
        );
      }
    }

    let text = "";
    try {
      const threadMessagesPageUnknown = await ctx.runQuery(
        agentMessages.listMessagesByThreadId,
        {
          threadId: args.threadId,
          order: "asc",
          paginationOpts: { cursor: null, numItems: 200 },
          excludeToolMessages: true,
        } as unknown,
      );

      const threadMessagesPage = threadMessagesPageUnknown as {
        page?: unknown[];
      };

      const extractText = (value: unknown): string => {
        if (typeof value === "string") return value;
        if (!Array.isArray(value)) return "";
        return value
          .map((part) => {
            if (!part || typeof part !== "object") return "";
            const p = part as Record<string, unknown>;
            return p.type === "text" && typeof p.text === "string"
              ? p.text
              : "";
          })
          .filter(Boolean)
          .join("\n");
      };

      type Role = "user" | "assistant";
      type HistoryItem = { role: Role; content: string };

      const historyRaw = (threadMessagesPage.page ?? []).flatMap(
        (row): HistoryItem[] => {
          const r = row as {
            message?: { role?: unknown; content?: unknown };
          } | null;
          const role = r?.message?.role;
          if (role !== "user" && role !== "assistant") return [];
          const content = extractText(r?.message?.content).trim();
          if (!content) return [];
          return [{ role: role as Role, content }];
        },
      );

      // Avoid duplicating the latest message if we just persisted it.
      const history =
        historyRaw.length > 0 &&
        historyRaw.at(-1)?.role === "user" &&
        historyRaw.at(-1)?.content === trimmedPrompt
          ? historyRaw.slice(0, -1)
          : historyRaw;

      const messages = buildConversationMessages({
        history,
        latestUserMessage: trimmedPrompt,
      });

      const result = await generateText({
        model: model as unknown,
        system: [effectiveBaseInstructions, knowledgeContext].join("\n\n"),
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
          threadId: args.threadId,
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
