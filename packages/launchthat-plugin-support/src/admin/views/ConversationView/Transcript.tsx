"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useRef } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import { Badge, cn } from "@acme/ui/index";

import type {
  ContactDoc,
  ConversationSummary,
} from "../../components/ConversationInspector";
import { ConversationComposer } from "./Composer";

type SupportMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  contactId?: Id<"contacts">;
  messageType?: "chat" | "email_inbound" | "email_outbound";
  subject?: string;
  htmlBody?: string;
  textBody?: string;
};

interface ConversationTranscriptProps {
  organizationId: Id<"organizations">;
  sessionId: string;
  conversation: ConversationSummary;
  contact: ContactDoc | null;
}

export function ConversationTranscript({
  organizationId,
  sessionId,
  conversation,
  contact,
}: ConversationTranscriptProps) {
  const messages = (useQuery(api.plugins.support.queries.listMessages, {
    organizationId,
    sessionId,
  }) ?? []) as SupportMessage[];

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <div className="CONVERSATION-TRANSCRIPT relative flex max-h-[calc(100vh-340px)] flex-1 flex-col">
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto p-6"
        data-testid="conversation-messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet for this conversation.
          </div>
        ) : (
          messages.map((message) => {
            const isAssistant = message.role === "assistant";
            const isEmail =
              message.messageType === "email_inbound" ||
              message.messageType === "email_outbound";
            const showHtml =
              isEmail && message.htmlBody && message.htmlBody.trim().length > 0;

            return (
              <div
                key={message._id}
                className={cn(
                  "flex",
                  isAssistant ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow transition",
                    isAssistant
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {message.subject ? (
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {message.subject}
                    </p>
                  ) : null}

                  {showHtml ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: message.htmlBody ?? "",
                      }}
                      suppressHydrationWarning
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground/80">
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                    {isEmail ? (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/30 text-[10px]"
                      >
                        Email
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto border-t bg-background">
        <ConversationComposer
          organizationId={organizationId}
          sessionId={sessionId}
          conversation={conversation}
          contact={contact}
        />
      </div>
    </div>
  );
}
