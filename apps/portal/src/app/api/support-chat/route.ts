import type { Id } from "@/convex/_generated/dataModel";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { createOpenAI } from "@ai-sdk/openai";
import { formatStreamPart, streamText } from "ai";
import { z } from "zod";

import { env } from "~/env";
import { getConvex } from "~/lib/convex";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/await-thenable */

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const hasOpenAIApiKey = Boolean(env.OPENAI_API_KEY?.trim());

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

type SupportMessage = z.infer<typeof messageSchema>;

const requestSchema = z.object({
  organizationId: z.string().min(1),
  sessionId: z.string().optional(),
  contactId: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactName: z.string().optional(),
  messages: z.array(messageSchema),
});

export async function POST(req: Request) {
  try {
    console.log("[support-chat] incoming request");
    const parsed = requestSchema.parse(await req.json());
    const organizationId = parsed.organizationId as Id<"organizations">;
    const sessionId =
      parsed.sessionId ??
      `support-${organizationId}-${crypto.randomUUID().slice(0, 8)}`;
    const contactId = parsed.contactId
      ? (parsed.contactId as Id<"contacts">)
      : undefined;
    const contactEmail = parsed.contactEmail;
    const contactName = parsed.contactName;

    const convex = getConvex();
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

    const isManualMode = conversationMode.mode === "manual";

    if (isManualMode) {
      return streamTextResponse("");
    }

    const cannedResponse =
      latestUserMessage.length > 0
        ? await convex.query(api.plugins.support.queries.matchCannedResponse, {
            organizationId,
            question: latestUserMessage,
          })
        : null;

    if (cannedResponse) {
      console.log("[support-chat] matched canned response", {
        organizationId,
        entryId: cannedResponse.entryId,
        slug: cannedResponse.slug,
      });
      await convex.mutation(api.plugins.support.mutations.recordMessage, {
        organizationId,
        sessionId,
        role: "assistant",
        content: cannedResponse.content,
        contactId,
        contactEmail,
        contactName,
        source: "agent",
      });
      return streamTextResponse(cannedResponse.content);
    }

    console.log("[support-chat] querying knowledge + history", {
      organizationId,
      sessionId,
      query: latestUserMessage,
    });

    const [knowledge, existingMessages] = await Promise.all([
      convex.query(api.plugins.support.queries.listKnowledge, {
        organizationId,
        query: latestUserMessage,
        limit: 5,
      }),
      convex.query(api.plugins.support.queries.listMessages, {
        organizationId,
        sessionId,
      }),
    ]);

    const knowledgeContext =
      knowledge.length > 0
        ? knowledge
            .map(
              (entry: (typeof knowledge)[number], index: number) =>
                `Source ${index + 1}: ${entry.title}\n${entry.content}`,
            )
            .join("\n\n")
        : "No curated knowledge entries were found for this question.";

    const historyMessages = existingMessages.map(
      (message: (typeof existingMessages)[number]) => ({
        role: message.role,
        content: message.content,
      }),
    );

    const clientMessages = parsed.messages
      .filter(
        (message: SupportMessage) =>
          message.role === "assistant" || message.role === "user",
      )
      .map((message: SupportMessage) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      }));

    if (!hasOpenAIApiKey) {
      const noKeyMessage =
        "Support assistant is not fully configured yet (missing API key).";
      console.warn("[support-chat] missing OPENAI_API_KEY");
      await convex.mutation(api.plugins.support.mutations.recordMessage, {
        organizationId,
        sessionId,
        role: "assistant",
        content: noKeyMessage,
        contactId,
        contactEmail,
        contactName,
        source: "agent",
      });
      return streamTextResponse(noKeyMessage);
    }

    console.log("[support-chat] streaming LLM response", {
      organizationId,
      sessionId,
      knowledgeEntries: knowledge.length,
      historyMessages: existingMessages.length,
    });

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: [
        "You are a helpful support chatbot for the current organization.",
        "Always prefer the provided knowledge sources when answering questions.",
        "If the answer is unclear, ask a clarifying question or direct the user to contact support.",
        "Knowledge base:\n",
        knowledgeContext,
      ].join("\n"),
      messages: [...historyMessages, ...clientMessages],
      onFinish: async ({ text }) => {
        if (!text) return;
        await convex.mutation(api.plugins.support.mutations.recordMessage, {
          organizationId,
          sessionId,
          role: "assistant",
          content: text,
          contactId,
          contactEmail,
          contactName,
          source: "agent",
        });
      },
    });

    return result.toAIStreamResponse();
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
    const sessionId = searchParams.get("sessionId");

    if (!organizationIdParam || !sessionId) {
      return NextResponse.json(
        { error: "organizationId and sessionId are required" },
        { status: 400 },
      );
    }

    const organizationId = organizationIdParam as Id<"organizations">;
    const convex = getConvex();

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

function streamTextResponse(content: string) {
  const encoder = new TextEncoder();
  const textPart = formatStreamPart("text", content);
  const finishPart = formatStreamPart("finish_message", {
    finishReason: "stop",
    usage: {
      promptTokens: 0,
      completionTokens: content.length,
    },
  });

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(textPart));
      controller.enqueue(encoder.encode(finishPart));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
