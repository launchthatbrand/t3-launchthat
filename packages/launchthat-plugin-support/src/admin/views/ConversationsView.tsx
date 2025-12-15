"use client";

import type {
  ContactDoc,
  ConversationSummary,
} from "../components/ConversationInspector";
import { useEffect, useMemo, useRef } from "react";

import { ConversationComposer } from "../components/Composer";
import type { GenericId as Id } from "convex/values";
import { api } from "@portal/convexspec";
import { cn } from "@acme/ui";
import { useQuery } from "convex/react";
import { useSupportContact } from "../hooks/useSupportContact";

type SupportMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  messageType?: "chat" | "email_inbound" | "email_outbound";
  agentName?: string;
};

interface TestViewProps {
  organizationId: Id<"organizations">;
  tenantName?: string;
  conversations: ConversationSummary[];
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onConversationChange?: (
    conversation?: ConversationSummary,
    contact?: ContactDoc | null,
  ) => void;
}

export function TestView({
  organizationId,
  tenantName,
  conversations,
  activeSessionId,
  onSelectSession,
  onConversationChange,
}: TestViewProps) {
  const selectedConversation = useMemo(() => {
    if (!conversations.length) {
      return undefined;
    }
    if (activeSessionId) {
      return (
        conversations.find(
          (conversation) => conversation.sessionId === activeSessionId,
        ) ?? conversations[0]
      );
    }
    return conversations[0];
  }, [conversations, activeSessionId]);

  const contactDoc = useSupportContact(
    selectedConversation?.contactId
      ? (selectedConversation.contactId as Id<"contacts">)
      : undefined,
  );

  const contactForComposer: ContactDoc | null =
    contactDoc ??
    (selectedConversation
      ? {
          _id: (selectedConversation.contactId ??
            "placeholder-contact") as Id<"contacts">,
          organizationId,
          fullName: selectedConversation.contactName ?? "Unknown visitor",
          email: selectedConversation.contactEmail ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : null);

  const selectedSessionId = selectedConversation?.sessionId ?? null;

  const messages =
    (useQuery(
      api.plugins.support.queries.listMessages,
      selectedSessionId
        ? {
            organizationId,
            sessionId: selectedSessionId,
          }
        : "skip",
    ) as SupportMessage[] | undefined) ?? [];

  const hasRenderableConversation =
    Boolean(selectedConversation) && conversations.length > 0;

  const renderedMessages: SupportMessage[] = hasRenderableConversation
    ? messages
    : [];

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [renderedMessages.length, selectedSessionId]);

  useEffect(() => {
    onConversationChange?.(selectedConversation, contactDoc ?? null);
  }, [onConversationChange, selectedConversation, contactDoc]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={listRef}
          className="bg-muted/20 flex-1 overflow-y-auto px-6 py-6 pb-10"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {renderedMessages.length === 0 ? (
              <div className="text-muted-foreground text-center text-sm">
                {selectedConversation
                  ? "No messages yet in this conversation."
                  : "Select a conversation from the sidebar to preview messages."}
              </div>
            ) : (
              renderedMessages.map((message) => (
                <div
                  key={message._id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm whitespace-pre-line shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground",
                    )}
                  >
                    {message.role === "assistant" && message.agentName ? (
                      <p className="text-muted-foreground mb-1 text-xs font-semibold">
                        {message.agentName}
                      </p>
                    ) : null}
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card/95 border-border/80 supports-backdrop-filter:bg-card/75 sticky bottom-0 border-t p-2 shadow-2xl backdrop-blur">
          {selectedConversation ? (
            <ConversationComposer
              organizationId={organizationId}
              sessionId={selectedConversation.sessionId}
              conversation={selectedConversation}
              contact={contactForComposer}
            />
          ) : (
            <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
              {tenantName
                ? `Select a conversation from the sidebar to preview ${tenantName}'s composer experience.`
                : "Select a conversation from the sidebar to preview the composer."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
