import type { Id } from "@/convex/_generated/dataModel";
import { LMS_QUIZ_ASSISTANT_EXPERIENCE_ID } from "launchthat-plugin-support/assistant";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { formatDataStreamPart } from "@ai-sdk/ui-utils";
import { getConvex } from "~/lib/convex";
import { resolveSupportOrganizationId } from "~/lib/support/resolveOrganizationId";

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
  sessionId?: string;
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
  messages: SupportMessage[];
  experienceId?: string;
  experienceContext?: Record<string, unknown>;
}

const parseRequest = (payload: unknown): SupportRequestPayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request payload");
  }
  const body = payload as Record<string, unknown>;
  const organizationId = body.organizationId;
  if (
    typeof organizationId !== "string" ||
    organizationId.trim().length === 0
  ) {
    throw new Error("organizationId is required");
  }
  const messagesRaw = Array.isArray(body.messages) ? body.messages : [];
  const messages: SupportMessage[] = messagesRaw
    .map((message) => ({
      id: typeof message?.id === "string" ? message.id : undefined,
      role:
        message?.role === "assistant" ||
        message?.role === "system" ||
        message?.role === "user"
          ? (message.role as SupportMessage["role"])
          : "user",
      content: typeof message?.content === "string" ? message.content : "",
    }))
    .filter((message) => message.content.length > 0);
  return {
    organizationId,
    sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
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
    console.log("[support-chat] incoming request");
    const parsed = parseRequest(await req.json());
    const convex = getConvex();
    const organizationId = await resolveSupportOrganizationId(
      convex,
      parsed.organizationId,
    );
    if (!organizationId) {
      return NextResponse.json(
        { error: "organization not found" },
        { status: 404 },
      );
    }
    const sessionId =
      parsed.sessionId ??
      `support-${organizationId}-${crypto.randomUUID().slice(0, 8)}`;
    const contactId = parsed.contactId ?? undefined;
    const contactEmail = parsed.contactEmail;
    const contactName = parsed.contactName;
    const experienceId = parsed.experienceId ?? "support";
    const experienceContext = parsed.experienceContext ?? {};

    const userMessages = parsed.messages.filter(
      (message: SupportMessage) => message.role === "user",
    );
    const latestUserMessage = userMessages.at(-1)?.content ?? "";

    if (latestUserMessage) {
      console.log("[support-chat] recording user message", {
        organizationId,
        sessionId,
        messagePreview: latestUserMessage.slice(0, 120),
      });
      await convex.mutation(api.plugins.support.mutations.recordMessage, {
        organizationId,
        sessionId,
        role: "user",
        content: latestUserMessage,
        contactId,
        contactEmail,
        contactName,
      });
    }

    const conversationMode = await convex.query(
      api.plugins.support.queries.getConversationMode,
      {
        organizationId,
        sessionId,
      },
    );

    const isManualMode = conversationMode === "manual";

    if (isManualMode) {
      const fallbackMessage =
        "Support assistant is not fully configured yet (missing API key).";
      await convex.mutation(api.plugins.support.mutations.recordMessage, {
        organizationId,
        sessionId,
        role: "assistant",
        content: fallbackMessage,
        contactId,
        contactEmail,
        contactName,
      });
      return streamTextResponse(fallbackMessage);
    }

    if (experienceId === LMS_QUIZ_ASSISTANT_EXPERIENCE_ID) {
      return await handleQuizAssistantExperience({
        convex,
        organizationId,
        sessionId,
        contactId: contactId as Id<"contacts"> | undefined,
        contactEmail,
        contactName,
        experienceContext,
      });
    }

    // TODO: add component-native helpdesk matching; currently skip to agent reply.
    const agentResult = await convex.action(
      api.plugins.support.agent.generateAgentReply,
      {
        organizationId,
        sessionId,
        prompt: latestUserMessage,
        contactId,
        contactEmail,
        contactName,
      },
    );

    if (agentResult?.text) {
      await convex.mutation(api.plugins.support.mutations.recordMessage, {
        organizationId,
        sessionId,
        role: "assistant",
        content: agentResult.text,
        contactId,
        contactEmail,
        contactName,
      });
    }

    return streamTextResponse(agentResult?.text ?? "");
  } catch (error) {
    console.error("[support-chat] error", error);
    return NextResponse.json(
      { error: "Unable to generate a response at this time." },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationIdParam = searchParams.get("organizationId");
    const view = searchParams.get("view") ?? "history";

    if (!organizationIdParam) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const convex = getConvex();
    const organizationId = await resolveSupportOrganizationId(
      convex,
      organizationIdParam,
    );
    if (!organizationId) {
      return NextResponse.json(
        { error: "organization not found" },
        { status: 404 },
      );
    }

    if (view === "helpdesk") {
      // Component-based helpdesk listing not yet implemented; return empty.
      return NextResponse.json({ articles: [] });
    }

    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required for history view" },
        { status: 400 },
      );
    }

    const messages = await convex.query(
      api.plugins.support.queries.listMessages,
      {
        organizationId,
        sessionId,
      },
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[support-chat] history error", error);
    return NextResponse.json(
      { error: "Unable to load chat history." },
      { status: 500 },
    );
  }
}

function streamTextResponse(content = "") {
  const normalized = content;

  const payload =
    formatDataStreamPart("text", normalized) +
    formatDataStreamPart("finish_message", {
      finishReason: "stop",
      usage: {
        promptTokens: 0,
        completionTokens: Math.max(1, Math.ceil(normalized.length / 4)),
      },
    });

  return new Response(payload, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

interface QuizExperienceArgs {
  convex: ReturnType<typeof getConvex>;
  organizationId: Id<"organizations">;
  sessionId: string;
  contactId?: Id<"contacts">;
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
    sessionId: args.sessionId,
    role: "assistant",
    content,
    contactId: args.contactId,
    contactEmail: args.contactEmail,
    contactName: args.contactName,
  });
}
