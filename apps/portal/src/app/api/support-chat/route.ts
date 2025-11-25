import type { Id } from "@/convex/_generated/dataModel";
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

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

type SupportMessage = z.infer<typeof messageSchema>;

const requestSchema = z.object({
  organizationId: z.string().min(1),
  sessionId: z.string().optional(),
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
      });
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
      });
      return streamCannedResponse(cannedResponse.content);
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

function streamCannedResponse(content: string) {
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
