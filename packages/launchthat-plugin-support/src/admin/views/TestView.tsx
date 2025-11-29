"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useMemo, useRef } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import { cn } from "@acme/ui";

import type {
  ContactDoc,
  ConversationSummary,
} from "../components/ConversationInspector";
import { useSupportContact } from "../hooks/useSupportContact";
import { ConversationComposer } from "./ConversationView/Composer";

type SupportMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  messageType?: "chat" | "email_inbound" | "email_outbound";
  agentName?: string;
};

const MOCK_MESSAGE_COUNT = 28;

const MOCK_MESSAGES: SupportMessage[] = Array.from(
  { length: MOCK_MESSAGE_COUNT },
  (_, index) => {
    const isUser = index % 2 === 0;
    return {
      _id: `mock-${index}`,
      role: isUser ? "user" : "assistant",
      content: isUser
        ? `User message ${index + 1}. I have a question about enrollment timelines and billing cycles. Could you clarify the steps again?`
        : `Assistant response ${index + 1}. Absolutely! Here's a detailed explanation so you have everything you need:\n\n1. Navigate to the enrollment section.\n2. Choose your preferred plan.\n3. Confirm details and submit.\n\nLet me know if you'd like screenshots or additional guidance.`,
      createdAt: Date.now() - (MOCK_MESSAGE_COUNT - index) * 60_000,
      messageType: "chat",
      agentName: isUser ? undefined : "Support Agent",
    };
  },
);

const fallbackConversation: ConversationSummary = {
  sessionId: "test-session",
  contactId: "test-contact-id",
  contactName: "Test Contact",
  contactEmail: "test@example.com",
  lastMessage:
    MOCK_MESSAGES[MOCK_MESSAGES.length - 1]?.content ??
    "Thanks for the clarification!",
  origin: "chat",
  lastRole: "assistant",
  lastAt: Date.now(),
  firstAt: Date.now(),
  totalMessages: MOCK_MESSAGES.length,
  mode: "agent",
};

const buildFallbackContact = (
  organizationId: Id<"organizations">,
): ContactDoc => ({
  _id: "test-contact-id" as Id<"contacts">,
  organizationId,
  fullName: "Test Contact",
  email: "test@example.com",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

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

  const conversationForComposer = selectedConversation ?? fallbackConversation;

  const contactDoc = useSupportContact(
    selectedConversation?.contactId
      ? (selectedConversation.contactId as Id<"contacts">)
      : undefined,
  );

  const contactForComposer: ContactDoc =
    contactDoc ??
    (selectedConversation
      ? {
          _id: (selectedConversation.contactId ??
            "test-contact-id") as Id<"contacts">,
          organizationId,
          fullName: selectedConversation.contactName ?? "Unknown visitor",
          email: selectedConversation.contactEmail ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : buildFallbackContact(organizationId));

  const messages =
    (useQuery(api.plugins.support.queries.listMessages, {
      organizationId,
      sessionId: conversationForComposer.sessionId,
    }) as SupportMessage[] | undefined) ?? [];

  const renderedMessages =
    selectedConversation && conversations.length > 0 ? messages : MOCK_MESSAGES;

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [renderedMessages.length, conversationForComposer.sessionId]);

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

        <div className="bg-card/95 border-border/80 supports-[backdrop-filter]:bg-card/75 sticky bottom-0 border-t p-2 shadow-2xl backdrop-blur">
          {selectedConversation ? (
            <ConversationComposer
              organizationId={organizationId}
              sessionId={conversationForComposer.sessionId}
              conversation={conversationForComposer}
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
