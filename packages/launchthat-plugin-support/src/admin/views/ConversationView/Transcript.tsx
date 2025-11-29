"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useRef } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type {
  ContactDoc,
  ConversationSummary,
} from "../../components/ConversationInspector";
import { SUPPORT_COPY } from "../../constants/supportCopy";
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
  agentName?: string;
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
  const setConversationMode = useMutation(
    api.plugins.support.mutations.setConversationMode,
  );
  const messages = (useQuery(api.plugins.support.queries.listMessages, {
    organizationId,
    sessionId,
  }) ?? []) as SupportMessage[];

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const currentMode = conversation.mode ?? "agent";
  const isAgentMode = currentMode === "agent";

  const toggleMode = async () => {
    try {
      await setConversationMode({
        organizationId,
        sessionId,
        mode: isAgentMode ? "manual" : "agent",
      });
      toast.success(
        isAgentMode
          ? "Switched to manual mode. The assistant will stop replying."
          : "Agent mode re-enabled. The assistant can reply again.",
      );
    } catch (error) {
      console.error("[conversation] toggle mode failed", error);
      toast.error("Unable to update conversation mode. Please try again.");
    }
  };

  return (
    <div className="CONVERSATION-TRANSCRIPT relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-border/70 bg-muted/40 flex items-center justify-between border-b px-6 py-3 text-xs">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {isAgentMode ? "Agent mode enabled" : "Manual reply mode"}
          </span>
          <span className="text-muted-foreground">
            {isAgentMode
              ? "Assistant responses will be sent automatically."
              : "Assistant is bypassed. Respond manually in this conversation."}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void toggleMode()}
          aria-label="Toggle agent mode"
        >
          {isAgentMode ? "Switch to manual" : "Enable agent"}
        </Button>
      </div>
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-6 pb-40"
        data-testid="conversation-messages"
      >
        {messages.length === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center text-sm">
            {SUPPORT_COPY.transcript.emptyState}
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
                  {isAssistant && message.agentName ? (
                    <p className="text-muted-foreground mb-1 text-xs font-semibold">
                      {message.agentName}
                    </p>
                  ) : null}
                  {message.subject ? (
                    <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
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
                    <p className="break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}

                  <div className="text-muted-foreground/80 mt-2 flex flex-wrap items-center gap-2 text-[10px] tracking-wide uppercase">
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

      <div className="bg-card/95 border-border/80 supports-[backdrop-filter]:bg-card/75 sticky bottom-0 border-t px-6 py-4 shadow-2xl backdrop-blur">
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
