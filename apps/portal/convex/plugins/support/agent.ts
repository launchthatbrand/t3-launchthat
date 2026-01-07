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
  supportAssistantModelIdKey,
} from "launchthat-plugin-support/settings";

import { PORTAL_TENANT_ID, PORTAL_TENANT_SLUG } from "../../constants";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

const FALLBACK_BASE_INSTRUCTIONS = defaultSupportAssistantBaseInstructions;

const KNOWN_MISSING_KEY_MESSAGE =
  "Support assistant is not fully configured yet (missing OpenAI API key). Add one in Support → Settings → AI Assistant.";

// Prefer the newer small model, but fall back to a broadly-available model ID
// if the tenant's OpenAI account doesn't have access yet.
const PRIMARY_SUPPORT_MODEL_ID = "gpt-4.1-mini";
const FALLBACK_SUPPORT_MODEL_ID = "gpt-4o-mini";

// Narrow overly deep types from generated bindings to keep TS fast/stable.
// (Type-level inference here can get expensive; keep it loose.)
type AnyInternalQueryRef = FunctionReference<"query", "internal", any, any>;

const agentMessages = (
  components as unknown as {
    agent: { messages: { listMessagesByThreadId: AnyInternalQueryRef } };
  }
).agent.messages;

const createSupportModel = (apiKey: string, modelId: string) => {
  const openai = createOpenAI({ apiKey });
  // Bypass @convex-dev/agent thread machinery (currently crashing in stripUnknownFields).
  return openai.chat(modelId);
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
    organizationId: v.string(),
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
    const organizationId =
      args.organizationId === PORTAL_TENANT_SLUG
        ? PORTAL_TENANT_ID
        : (args.organizationId as Id<"organizations">);
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

    let configuredModelId: string | null = null;
    try {
      const stored = await ctx.runQuery(
        api.plugins.support.options.getSupportOption,
        {
          organizationId,
          key: supportAssistantModelIdKey,
        },
      );
      const asString = parseStringOption(stored);
      if (asString && asString.trim().length > 0) {
        configuredModelId = asString.trim();
      }
    } catch (error) {
      console.warn(
        "[support-agent] failed to load assistant model option",
        error,
      );
    }

    const primaryModelId = configuredModelId ?? PRIMARY_SUPPORT_MODEL_ID;
    const primaryModel = createSupportModel(apiKey, primaryModelId);
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
    const runModel = async (model: any) => {
      const threadMessagesPageUnknown = await ctx.runQuery(
        agentMessages.listMessagesByThreadId,
        {
          threadId: args.threadId,
          order: "asc",
          paginationOpts: { cursor: null, numItems: 200 },
          excludeToolMessages: true,
        } as any,
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
      interface HistoryItem { role: Role; content: string }

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
        model,
        system: [effectiveBaseInstructions, knowledgeContext].join("\n\n"),
        messages,
      });

      return typeof result.text === "string" ? result.text : "";
    };

    try {
      text = await runModel(primaryModel);
    } catch (modelError) {
      const errorMessage =
        modelError instanceof Error ? modelError.message : String(modelError);
      console.error("[support-agent] model error", {
        organizationId,
        model: primaryModelId,
        errorMessage,
      });

      // Best-effort: if the model isn't available for the org's OpenAI account yet,
      // retry with a broadly-available model.
      const shouldRetryWithFallback =
        errorMessage.toLowerCase().includes("model") &&
        (errorMessage.toLowerCase().includes("not found") ||
          errorMessage.toLowerCase().includes("does not exist") ||
          errorMessage.toLowerCase().includes("not available"));

      const fallbackModelId =
        primaryModelId === FALLBACK_SUPPORT_MODEL_ID
          ? PRIMARY_SUPPORT_MODEL_ID
          : FALLBACK_SUPPORT_MODEL_ID;

      if (shouldRetryWithFallback) {
        try {
          const fallbackModel = createSupportModel(apiKey, fallbackModelId);
          text = await runModel(fallbackModel);
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError);
          console.error("[support-agent] fallback model error", {
            organizationId,
            model: fallbackModelId,
            errorMessage: fallbackMessage,
          });
          text =
            "Support assistant is not fully configured yet (model unavailable). Please contact an administrator.";
        }
      } else if (
        errorMessage.toLowerCase().includes("unauthorized") ||
        errorMessage.toLowerCase().includes("invalid api key") ||
        errorMessage.toLowerCase().includes("incorrect api key")
      ) {
        text =
          "Support assistant is not fully configured yet (invalid OpenAI API key). Please contact an administrator.";
      } else {
        text =
          "Support assistant is not fully configured yet (model unavailable). Please contact an administrator.";
      }
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
