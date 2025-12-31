import type { Id } from "@/convex/_generated/dataModel";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { LMS_QUIZ_ASSISTANT_EXPERIENCE_ID } from "launchthat-plugin-support/assistant";

import { getConvex } from "~/lib/convex";
import { checkIpRateLimit, getClientIp } from "~/lib/support/ipRateLimit";
import {
  requireSupportWidgetAuth,
  SupportWidgetAuthError,
} from "~/lib/support/widgetAuth";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/await-thenable */

interface SupportMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface SupportRequestPayload {
  organizationId: string;
  widgetKey: string;
  clientSessionId?: string;
  threadId?: string;
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
  messages: SupportMessage[];
  experienceId?: string;
  experienceContext?: Record<string, unknown>;
}

class SupportChatBadRequestError extends Error {
  status = 400 as const;
}

const buildContextTags = (args: {
  experienceId: string;
  experienceContext: Record<string, unknown>;
}): string[] => {
  const tags: string[] = [];
  const ctx = args.experienceContext;

  // Generic LMS contextual tag support (used by planned `lms-content` experience).
  const postTypeSlug =
    typeof ctx.postTypeSlug === "string"
      ? ctx.postTypeSlug.toLowerCase()
      : null;
  const postId = typeof ctx.postId === "string" ? ctx.postId : null;
  if (postTypeSlug && postId) {
    tags.push(`lms:${postTypeSlug}:${postId}`);
  }

  return tags;
};

const parseRequest = (payload: unknown): SupportRequestPayload => {
  if (!payload || typeof payload !== "object") {
    throw new SupportChatBadRequestError("Invalid request payload");
  }
  const body = payload as Record<string, unknown>;
  const organizationId = body.organizationId;
  const widgetKey = body.widgetKey;
  const clientSessionId = body.clientSessionId;
  if (
    typeof organizationId !== "string" ||
    organizationId.trim().length === 0
  ) {
    throw new SupportChatBadRequestError("organizationId is required");
  }
  if (typeof widgetKey !== "string" || widgetKey.trim().length === 0) {
    throw new SupportChatBadRequestError("widgetKey is required");
  }
  const messagesRaw = Array.isArray(body.messages) ? body.messages : [];

  const extractContent = (message: unknown): string => {
    if (!message || typeof message !== "object") {
      return "";
    }
    const m = message as Record<string, unknown>;
    if (typeof m.content === "string") {
      return m.content;
    }
    if (typeof m.text === "string") {
      return m.text;
    }
    if (Array.isArray(m.parts)) {
      return m.parts
        .map((part) => {
          if (!part || typeof part !== "object") return "";
          const p = part as Record<string, unknown>;
          return p.type === "text" && typeof p.text === "string" ? p.text : "";
        })
        .join("");
    }
    return "";
  };

  const messages: SupportMessage[] = messagesRaw
    .map((message) => ({
      id: typeof message?.id === "string" ? message.id : undefined,
      role:
        message?.role === "assistant" ||
        message?.role === "system" ||
        message?.role === "user"
          ? (message.role as SupportMessage["role"])
          : "user",
      content: extractContent(message),
    }))
    .filter((message) => message.content.length > 0);
  return {
    organizationId,
    widgetKey,
    clientSessionId:
      typeof clientSessionId === "string" && clientSessionId.trim().length > 0
        ? clientSessionId
        : undefined,
    threadId: typeof body.threadId === "string" ? body.threadId : undefined,
    contactId: typeof body.contactId === "string" ? body.contactId : undefined,
    contactEmail:
      typeof body.contactEmail === "string" ? body.contactEmail : undefined,
    contactName:
      typeof body.contactName === "string" ? body.contactName : undefined,
    messages,
    experienceId:
      typeof body.experienceId === "string" ? body.experienceId : undefined,
    experienceContext:
      (body.experienceContext &&
      typeof body.experienceContext === "object" &&
      !Array.isArray(body.experienceContext)
        ? (body.experienceContext as Record<string, unknown>)
        : undefined) ?? {},
  };
};

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkIpRateLimit({
      key: `support-chat:message:ip:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!ipLimit.allowed) {
      console.warn(
        JSON.stringify({
          event: "support_chat_rate_limited",
          route: "message",
          scope: "ip",
          ip,
          retryAfterMs: ipLimit.retryAfterMs,
        }),
      );
      return NextResponse.json(
        { error: "Rate limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(ipLimit.retryAfterMs / 1000)),
          },
        },
      );
    }

    console.log("[support-chat] incoming request");
    const parsed = parseRequest(await req.json());
    const convex = getConvex();
    const { organizationId } = await requireSupportWidgetAuth({
      req,
      convex,
      organizationIdParam: parsed.organizationId,
      widgetKey: parsed.widgetKey,
    });

    if (parsed.clientSessionId) {
      const sessionLimit = checkIpRateLimit({
        key: `support-chat:message:session:${organizationId}:${parsed.clientSessionId}`,
        limit: 30,
        windowMs: 60_000,
      });
      if (!sessionLimit.allowed) {
        console.warn(
          JSON.stringify({
            event: "support_chat_rate_limited",
            route: "message",
            scope: "clientSessionId",
            organizationId,
            clientSessionId: parsed.clientSessionId,
            retryAfterMs: sessionLimit.retryAfterMs,
          }),
        );
      return NextResponse.json(
          { error: "Rate limited" },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                Math.ceil(sessionLimit.retryAfterMs / 1000),
              ),
            },
          },
      );
      }
    }
    const threadId =
      parsed.threadId ??
      (
        await convex.mutation(
          (api as any).plugins.support.mutations.createThread,
          {
        organizationId,
            clientSessionId: parsed.clientSessionId,
        contactId: parsed.contactId ?? undefined,
        contactEmail: parsed.contactEmail ?? undefined,
        contactName: parsed.contactName ?? undefined,
        mode: undefined,
          },
        )
      ).threadId;
    const contactId = parsed.contactId ?? undefined;
    const contactEmail = parsed.contactEmail;
    const contactName = parsed.contactName;
    const experienceId = parsed.experienceId ?? "support";
    const experienceContext = parsed.experienceContext ?? {};
    const contextTags = buildContextTags({ experienceId, experienceContext });

    const userMessages = parsed.messages.filter(
      (message: SupportMessage) => message.role === "user",
    );
    const latestUserMessage = userMessages.at(-1)?.content ?? "";

    const conversationMode = await convex.query(
      api.plugins.support.queries.getConversationMode,
      {
        organizationId,
        threadId,
      },
    );

    const isManualMode = conversationMode === "manual";

    if (isManualMode) {
      const fallbackMessage =
        "Support assistant is not fully configured yet (missing API key).";
      await convex.mutation(api.plugins.support.mutations.recordMessage, {
        organizationId,
        threadId,
        role: "assistant",
        content: fallbackMessage,
        contactId,
        contactEmail,
        contactName,
        source: "system",
      });
      console.log(
        JSON.stringify({
          event: "support_chat_manual_mode",
          organizationId,
          threadId,
        }),
      );
      return streamTextResponse(fallbackMessage);
    }

    if (experienceId === LMS_QUIZ_ASSISTANT_EXPERIENCE_ID) {
      return await handleQuizAssistantExperience({
        convex,
        organizationId: organizationId as Id<"organizations">,
        threadId,
        contactEmail,
        contactName,
        experienceContext,
      });
    }

    // TODO: add component-native helpdesk matching; currently skip to agent reply.
    const agentStart = Date.now();
    const agentResult = await convex.action(
      api.plugins.support.agent.generateAgentReply,
      {
        organizationId,
        threadId,
        prompt: latestUserMessage,
        contactId: contactId ?? undefined,
        contactEmail,
        contactName,
        contextTags: contextTags.length > 0 ? contextTags : undefined,
      },
    );
    console.log(
      JSON.stringify({
        event: "support_chat_agent_reply",
        organizationId,
        threadId,
        durationMs: Date.now() - agentStart,
      }),
    );

    return streamTextResponse(agentResult?.text ?? "");
  } catch (error) {
    if (error instanceof SupportChatBadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof SupportWidgetAuthError) {
      console.warn(
        JSON.stringify({
          event: "support_chat_auth_failed",
          route: "message",
          status: error.status,
          message: error.message,
          origin: req.headers.get("origin"),
          host: req.headers.get("host"),
        }),
      );
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[support-chat] error", error);
    return NextResponse.json(
      { error: "Unable to generate a response at this time." },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkIpRateLimit({
      key: `support-chat:history:ip:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!ipLimit.allowed) {
      console.warn(
        JSON.stringify({
          event: "support_chat_rate_limited",
          route: "history",
          scope: "ip",
          ip,
          retryAfterMs: ipLimit.retryAfterMs,
        }),
      );
      return NextResponse.json(
        { error: "Rate limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(ipLimit.retryAfterMs / 1000)),
          },
        },
      );
    }

    const { searchParams } = new URL(req.url);
    const organizationIdParam = searchParams.get("organizationId");
    const widgetKey = searchParams.get("widgetKey");
    const view = searchParams.get("view") ?? "history";

    if (!organizationIdParam) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const convex = getConvex();
    const { organizationId } = await requireSupportWidgetAuth({
      req,
      convex,
      organizationIdParam,
      widgetKey,
    });

    if (view === "helpdesk") {
      // Component-based helpdesk listing not yet implemented; return empty.
      return NextResponse.json({ articles: [] });
    }

    const threadId =
      searchParams.get("threadId") ?? searchParams.get("sessionId");
    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required for history view" },
        { status: 400 },
      );
    }

    const messages = await convex.query(
      api.plugins.support.queries.listMessages,
      {
        organizationId,
        threadId,
      },
    );

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof SupportWidgetAuthError) {
      const { searchParams } = new URL(req.url);
      console.warn(
        JSON.stringify({
          event: "support_chat_auth_failed",
          route: "history",
          status: error.status,
          message: error.message,
          organizationIdParam: searchParams.get("organizationId"),
          origin: req.headers.get("origin"),
          host: req.headers.get("host"),
        }),
      );
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[support-chat] history error", error);
    return NextResponse.json(
      { error: "Unable to load chat history." },
      { status: 500 },
    );
  }
}

function streamTextResponse(content = "") {
  const normalized = content ?? "";
  const textPartId = crypto.randomUUID();

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "start" });

      if (normalized.length > 0) {
        writer.write({ type: "text-start", id: textPartId });
        writer.write({ type: "text-delta", id: textPartId, delta: normalized });
        writer.write({ type: "text-end", id: textPartId });
      }

      writer.write({ type: "finish", finishReason: "stop" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

interface QuizExperienceArgs {
  convex: ReturnType<typeof getConvex>;
  organizationId: Id<"organizations">;
  threadId: string;
  contactEmail?: string;
  contactName?: string;
  experienceContext: Record<string, unknown>;
}

async function handleQuizAssistantExperience(
  args: QuizExperienceArgs,
): Promise<Response> {
  const lessonIdRaw = args.experienceContext.lessonId;
  if (typeof lessonIdRaw !== "string") {
    const message =
      "Unable to generate a quiz because the lesson context was missing.";
    await recordAssistantMessage(args, message);
    return streamTextResponse(message);
  }

  const lessonOrgIdRaw = args.experienceContext.organizationId;
  const lessonOrganizationId =
    typeof lessonOrgIdRaw === "string"
      ? (lessonOrgIdRaw as Id<"organizations">)
      : args.organizationId;

  try {
    const result = await args.convex.action(
      api.plugins.lms.actions.generateQuizFromTranscript,
      {
        organizationId: lessonOrganizationId,
        lessonId: lessonIdRaw as Id<"posts">,
        questionCount:
          typeof args.experienceContext.questionCount === "number"
            ? args.experienceContext.questionCount
            : undefined,
      },
    );
    const builderUrl = result.builderUrl;
    const successMessage = `Created quiz "${result.quizTitle}" with ${result.questionCount} questions. Open builder: ${builderUrl}`;
    await recordAssistantMessage(args, successMessage);
    return streamTextResponse(successMessage);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Quiz assistant failed to complete the request.";
    await recordAssistantMessage(args, message);
    return streamTextResponse(message);
  }
}

async function recordAssistantMessage(
  args: QuizExperienceArgs,
  content: string,
) {
  await args.convex.mutation(api.plugins.support.mutations.recordMessage, {
    organizationId: args.organizationId,
    threadId: args.threadId,
    role: "assistant",
    content,
    contactEmail: args.contactEmail,
    contactName: args.contactName,
  });
}
