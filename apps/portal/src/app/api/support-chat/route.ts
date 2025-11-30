import type { Id } from "@/convex/_generated/dataModel";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

import { getConvex } from "~/lib/convex";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/await-thenable */

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

    const organizationId = organizationIdParam as Id<"organizations">;
    const convex = getConvex();

    if (view === "helpdesk") {
      const limitParam = searchParams.get("limit");
      const limit =
        limitParam && !Number.isNaN(Number(limitParam))
          ? Math.max(1, Math.min(25, Number(limitParam)))
          : 6;

      const articles = await convex.query(api.core.posts.queries.getAllPosts, {
        organizationId,
        filters: {
          postTypeSlug: "helpdeskarticles",
          status: "published",
          limit,
        },
      });

      const normalized = articles.map((article) => ({
        id: article._id,
        title: article.title ?? "Untitled article",
        summary: buildSummary(article.excerpt ?? "", article.content ?? ""),
        updatedAt: formatRelativeTime(
          article.updatedAt ?? article._creationTime,
        ),
        slug: article.slug ?? undefined,
      }));

      return NextResponse.json({ articles: normalized });
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

function streamTextResponse(content: string) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function buildSummary(excerpt: string, content: string) {
  const candidate = excerpt.trim().length > 0 ? excerpt : stripMarkup(content);
  if (!candidate) {
    return "Open this article to read the full answer.";
  }
  return candidate.length > 180 ? `${candidate.slice(0, 177)}…` : candidate;
}

function stripMarkup(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRelativeTime(timestamp?: number | null) {
  if (!timestamp) {
    return "just now";
  }
  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 60_000) return "just now";
  if (deltaMs < 3_600_000) {
    return `${Math.round(deltaMs / 60_000)}m ago`;
  }
  if (deltaMs < 86_400_000) {
    return `${Math.round(deltaMs / 3_600_000)}h ago`;
  }
  const days = Math.round(deltaMs / 86_400_000);
  return `${days}d ago`;
}
