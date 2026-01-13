"use node";

import type { Id } from "@convex-config/_generated/dataModel";
import type { ActionCtx } from "@convex-config/_generated/server";
import type { ModelMessage } from "ai";
import type { FunctionReference } from "convex/server";
import { createOpenAI } from "@ai-sdk/openai";
import { api, components, internal } from "@convex-config/_generated/api";
import { action } from "@convex-config/_generated/server";
import { generateObject } from "ai";
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
import { z } from "zod";

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
      (entry, index) =>
        `Source ${index}:\nTitle: ${entry.title}\nContent:\n${entry.content}`,
    )
    .join("\n\n");
};

const isGreetingLike = (prompt: string) => {
  const t = prompt.trim().toLowerCase();
  if (!t) return true;
  // Very short / low-signal messages shouldn’t attach sources.
  if (t.length <= 4) return true;
  return (
    t === "hi" ||
    t === "hey" ||
    t === "hello" ||
    t === "yo" ||
    t === "sup" ||
    t === "thanks" ||
    t === "thank you" ||
    t === "thx" ||
    t === "ok" ||
    t === "okay"
  );
};

interface ModelJsonResult {
  text: string;
  usedSourceIndexes: number[];
}

interface SupportSource {
  title: string;
  url: string;
  source?: string;
  slug?: string;
}

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
    sessionId: v.optional(v.string()),
    prompt: v.string(),
    contactId: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contextTags: v.optional(v.array(v.string())),
  },
  returns: v.object({
    text: v.string(),
    sources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        source: v.optional(v.string()),
        slug: v.optional(v.string()),
      }),
    ),
    usedSourceIndexes: v.array(v.number()),
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
          sessionId: args.sessionId,
          role: "assistant",
          content: KNOWN_MISSING_KEY_MESSAGE,
          contactId: args.contactId ?? undefined,
          contactEmail: args.contactEmail ?? undefined,
          contactName: args.contactName ?? undefined,
          source: "agent",
        },
      );
      return {
        text: KNOWN_MISSING_KEY_MESSAGE,
        sources: [],
        usedSourceIndexes: [],
      };
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
      return { text: "", sources: [], usedSourceIndexes: [] };
    }

    // Persist the user message to the canonical agent thread storage first.
    await ctx.runMutation(
      internal.plugins.support.mutations.recordMessageInternal,
      {
        organizationId,
        threadId: args.threadId,
        sessionId: args.sessionId,
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

    // UI-only citations: the model should NOT print sources; the UI will render them.
    const uiCitationsInstruction =
      "Do not include sources/citations/links in your response. The UI will render relevant sources separately.";

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
    let usedSourceIndexes: number[] = [];
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
      interface HistoryItem {
        role: Role;
        content: string;
      }

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

      // Prefer schema-enforced structured output so we always get usedSourceIndexes.
      const schema = z.object({
        text: z.string(),
        usedSourceIndexes: z.array(z.number().int()).default([]),
      });

      const result = await generateObject({
        model,
        schema,
        system: [
          effectiveBaseInstructions,
          uiCitationsInstruction,
          // Remind the model that the UI renders sources separately
          // and to only mark sources it actually used.
          "Return a JSON object with fields { text, usedSourceIndexes }. Only include source indexes you actually used.",
          knowledgeContext,
        ].join("\n\n"),
        messages,
      });

      return result.object;
    };

    try {
      const primary = (await runModel(
        primaryModel,
      )) as unknown as ModelJsonResult;
      text = typeof primary.text === "string" ? primary.text : "";
      usedSourceIndexes = Array.isArray(primary.usedSourceIndexes)
        ? primary.usedSourceIndexes
        : [];
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
          const fallback = (await runModel(
            fallbackModel,
          )) as unknown as ModelJsonResult;
          text = typeof fallback.text === "string" ? fallback.text : "";
          usedSourceIndexes = Array.isArray(fallback.usedSourceIndexes)
            ? fallback.usedSourceIndexes
            : [];
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

    const sources: SupportSource[] = knowledgeEntries
      .flatMap((entry) => {
        const slug =
          typeof (entry as any).slug === "string" && (entry as any).slug.trim()
            ? String((entry as any).slug).trim()
            : undefined;
        const urlPath =
          typeof (entry as any).urlPath === "string" &&
          String((entry as any).urlPath).trim().length > 0
            ? String((entry as any).urlPath).trim()
            : null;

        const sourceRaw =
          typeof (entry as any).source === "string"
            ? String((entry as any).source)
            : "";
        const looksLikeHelpdesk =
          sourceRaw === "helpdesk" ||
          sourceRaw.includes("helpdeskarticles") ||
          sourceRaw.startsWith("post:helpdeskarticles");

        const url =
          urlPath ?? (looksLikeHelpdesk && slug ? `/helpdesk/${slug}` : "");
        if (!url) return [];
        const out: SupportSource = { title: entry.title, url };
        if (typeof (entry as any).source === "string") {
          out.source = (entry as any).source as string;
        }
        if (slug) out.slug = slug;
        return [out];
      })
      .slice(0, 10);

    // Best-effort: older RAG entries (indexed before we added urlPath metadata) may only have slug/source.
    // If we have a slug but the URL points at the wrong place, attempt to resolve an LMS canonical URL by slug.
    const resolvedSources = [...sources];
    for (let i = 0; i < resolvedSources.length; i += 1) {
      const src = resolvedSources[i];
      if (!src) continue;

      // If it’s already a course/lesson route, keep it.
      if (src.url.startsWith("/course/") || src.url.startsWith("/lesson/")) {
        continue;
      }

      // If it’s a helpdesk URL but the underlying slug is actually an LMS lesson,
      // try to resolve to /course/:courseSlug/lesson/:lessonSlug.
      const slug = src.slug;
      if (!slug) continue;

      const lmsPost = (await ctx.runQuery(
        api.plugins.lms.posts.queries.getPostBySlug as any,
        {
          slug,
          organizationId: String(organizationId),
        },
      )) as Record<string, unknown> | null;
      if (!lmsPost) continue;

      const postTypeSlug =
        typeof (lmsPost as any).postTypeSlug === "string"
          ? String((lmsPost as any).postTypeSlug).toLowerCase()
          : "";
      const postId =
        typeof (lmsPost as any)._id === "string"
          ? String((lmsPost as any)._id)
          : typeof (lmsPost as any).id === "string"
            ? String((lmsPost as any).id)
            : "";
      if (!postTypeSlug || !postId) continue;

      if (postTypeSlug === "courses") {
        resolvedSources[i] = { ...src, url: `/course/${slug}` };
        continue;
      }

      if (postTypeSlug === "lessons") {
        const meta = (await ctx.runQuery(
          api.plugins.lms.posts.queries.getPostMeta as any,
          {
            postId,
            organizationId: String(organizationId),
          },
        )) as { key?: unknown; value?: unknown }[];

        const metaMap = new Map<string, string>();
        for (const entry of meta) {
          const key = typeof entry.key === "string" ? entry.key : null;
          if (!key) continue;
          const value = entry.value;
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            metaMap.set(key, String(value));
          }
        }

        const courseId =
          metaMap.get("courseId") ?? metaMap.get("course_id") ?? null;
        if (courseId) {
          const coursePost = (await ctx.runQuery(
            api.plugins.lms.posts.queries.getPostById as any,
            {
              id: courseId,
              organizationId: String(organizationId),
            },
          )) as { slug?: unknown } | null;
          const courseSlug =
            typeof coursePost?.slug === "string" && coursePost.slug.trim()
              ? coursePost.slug.trim()
              : String(courseId);
          resolvedSources[i] = {
            ...src,
            url: `/course/${courseSlug}/lesson/${slug}`,
          };
        } else {
          resolvedSources[i] = { ...src, url: `/lesson/${slug}` };
        }
      }
    }

    // Hard guard: greetings should never show sources (even if RAG returned matches).
    if (isGreetingLike(trimmedPrompt)) {
      usedSourceIndexes = [];
    } else {
      // If the model didn't mark any used sources, but we have obviously-relevant sources,
      // prefer showing at least one. This keeps Discord/web UIs from looking "unsourced"
      // when we're clearly answering from tenant knowledge.
      if (
        Array.isArray(usedSourceIndexes) &&
        usedSourceIndexes.length === 0 &&
        resolvedSources.length > 0
      ) {
        const promptLower = trimmedPrompt.toLowerCase();
        const promptWords = promptLower
          .split(/\s+/g)
          .map((w) => w.trim())
          .filter((w) => w.length >= 4)
          .slice(0, 6);

        const bestIndex = resolvedSources.findIndex((src) => {
          const haystack =
            `${src.title} ${src.url} ${src.slug ?? ""}`.toLowerCase();
          // Require at least one meaningful word match (keeps generic prompts from forcing sources).
          return promptWords.some((w) => haystack.includes(w));
        });

        if (bestIndex >= 0) {
          usedSourceIndexes = [bestIndex];
        }
      }

      // Clamp to known source indexes and dedupe.
      const maxIndex = resolvedSources.length - 1;
      usedSourceIndexes = Array.from(
        new Set(
          usedSourceIndexes
            .filter((i) => typeof i === "number" && Number.isInteger(i))
            .filter((i) => i >= 0 && i <= maxIndex),
        ),
      );
    }

    if (text.trim()) {
      const assistantPayload = JSON.stringify({
        kind: "assistant_response_v1",
        text,
        sources: resolvedSources,
        usedSourceIndexes,
      });
      await ctx.runMutation(
        internal.plugins.support.mutations.recordMessageInternal,
        {
          organizationId,
          threadId: args.threadId,
          sessionId: args.sessionId,
          role: "assistant",
          content: assistantPayload,
          contactId: args.contactId ?? undefined,
          contactEmail: args.contactEmail ?? undefined,
          contactName: args.contactName ?? undefined,
          source: "agent",
        },
      );
    }

    return { text, sources: resolvedSources, usedSourceIndexes };
  },
});
