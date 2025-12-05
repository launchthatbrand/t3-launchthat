"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { ChatWidgetTab, HelpdeskArticle } from "./supportChat/types";
import { Loader2, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import type { ChatHistoryMessage } from "./hooks/useSupportChatHistory";
import { ChatWidgetContent } from "./supportChat/ChatWidgetContent";
import { ChatWidgetFooter } from "./supportChat/ChatWidgetFooter";
import { ChatWidgetHeader } from "./supportChat/ChatWidgetHeader";
import type { GenericId as Id } from "convex/values";
import type { StoredSupportContact } from "./supportChat/utils";
import type { SupportChatSettings } from "../settings";
import { api } from "@portal/convexspec";
import { cn } from "@acme/ui";
import { parseLexicalRichText } from "./supportChat/utils";
import { useChat } from "@ai-sdk/react";
import { useHelpdeskArticles } from "./hooks/useHelpdeskArticles";
import usePresence from "@convex-dev/presence/react";
import { useSupportChatHistory } from "./hooks/useSupportChatHistory";
import { useSupportChatSession } from "./hooks/useSupportChatSession";
import { useSupportChatSettings } from "./hooks/useSupportChatSettings";
import { useSupportContactStorage } from "./hooks/useSupportContactStorage";

const stripFormattedPayload = (rawContent: string) => {
  if (!rawContent) {
    return rawContent;
  }
  const trimmed = rawContent.trim();
  if (!trimmed.startsWith("{")) {
    return rawContent;
  }
  try {
    return parseLexicalRichText(trimmed);
  } catch (error) {
    console.warn("[support-chat] failed to parse rich text content", error);
    return rawContent;
  }
};

export interface SupportChatWidgetProps {
  organizationId?: string | null;
  tenantName?: string;
  apiPath?: string;
  defaultContact?: StoredContact | null;
}

type LiveMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  agentName?: string;
};

type StoredContact = StoredSupportContact;

interface ContactFormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
}

const defaultContactForm: ContactFormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
};

type PresenceEntry =
  NonNullable<ReturnType<typeof usePresence>> extends Array<infer Entry>
    ? Entry
    : never;

export function SupportChatWidget({
  organizationId,
  tenantName = "your organization",
  apiPath = "/api/support-chat",
  defaultContact = null,
}: SupportChatWidgetProps) {
  if (!organizationId) {
    return null;
  }

  return (
    <SupportChatWidgetInner
      organizationId={organizationId}
      tenantName={tenantName}
      apiPath={apiPath}
      defaultContact={defaultContact}
    />
  );
}

interface SupportChatWidgetInnerProps {
  organizationId: string;
  tenantName: string;
  apiPath: string;
  defaultContact: StoredContact | null;
}

function SupportChatWidgetInner({
  organizationId,
  tenantName,
  apiPath,
  defaultContact,
}: SupportChatWidgetInnerProps) {
  const { sessionId } = useSupportChatSession(organizationId);
  const { contact, saveContact } = useSupportContactStorage(organizationId);
  const { settings, isLoading: settingsLoading } =
    useSupportChatSettings(organizationId);
  const { articles: helpdeskArticles } = useHelpdeskArticles(
    apiPath,
    organizationId,
  );
  const { initialMessages, isBootstrapped } = useSupportChatHistory(
    apiPath,
    organizationId,
    sessionId,
  );

  if (!isBootstrapped || settingsLoading) {
    return (
      <button
        type="button"
        className="bg-muted text-muted-foreground fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg"
        disabled
        aria-busy="true"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading support…
      </button>
    );
  }

  return (
    <ChatSurface
      apiPath={apiPath}
      organizationId={organizationId}
      sessionId={sessionId}
      tenantName={tenantName}
      initialMessages={initialMessages}
      settings={settings}
      contact={contact}
      onContactSaved={saveContact}
      helpdeskArticles={helpdeskArticles}
      defaultContact={defaultContact}
    />
  );
}

interface ChatSurfaceProps {
  organizationId: string;
  sessionId: string;
  tenantName: string;
  apiPath: string;
  initialMessages: ChatHistoryMessage[];
  settings: SupportChatSettings;
  contact: StoredContact | null;
  onContactSaved: (contact: StoredContact) => void;
  helpdeskArticles: HelpdeskArticle[];
  defaultContact: StoredContact | null;
}

function ChatSurface({
  organizationId,
  sessionId,
  tenantName,
  apiPath,
  initialMessages,
  settings,
  contact,
  onContactSaved,
  helpdeskArticles,
  defaultContact,
}: ChatSurfaceProps) {
  const supportsDirectConvex = useMemo(() => {
    if (!organizationId) return false;
    return /^[a-z0-9]{24}$/i.test(organizationId);
  }, [organizationId]);

  const openStorageKey = useMemo(
    () => `support-chat-open-${organizationId}`,
    [organizationId],
  );
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const stored = window.localStorage.getItem(openStorageKey);
    return stored === "true";
  });
  const [contactForm, setContactForm] =
    useState<ContactFormState>(defaultContactForm);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<ChatWidgetTab>("conversations");
  const [presenceState, setPresenceState] = useState<PresenceEntry[]>([]);

  useEffect(() => {
    if (!defaultContact) {
      return;
    }

    if (
      !contact ||
      contact.email !== defaultContact.email ||
      contact.fullName !== defaultContact.fullName ||
      (!contact.contactId && defaultContact.contactId)
    ) {
      onContactSaved({
        contactId: defaultContact.contactId ?? contact?.contactId,
        fullName: defaultContact.fullName ?? contact?.fullName,
        email: defaultContact.email ?? contact?.email,
      });
    }
  }, [contact, defaultContact, onContactSaved]);

  const shouldCollectContact = settings.requireContact && !contact;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    setMessages,
    setInput,
  } = useChat({
    api: apiPath,
    id: sessionId,
    initialMessages,
    body: {
      organizationId,
      sessionId,
      contactId: contact?.contactId,
    },
    onError: (err) => {
      console.error("[support-chat] streaming error", err);
    },
  });

  const displayedMessages = useMemo(
    () =>
      messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          ...message,
          content:
            typeof message.content === "string"
              ? stripFormattedPayload(message.content)
              : message.content,
        })),
    [messages],
  );
  const previousMessageCountRef = useRef(displayedMessages.length);

  const liveMessages =
    (useQuery(
      api.plugins.support.queries.listMessages,
      organizationId && sessionId && supportsDirectConvex
        ? {
            organizationId: organizationId as Id<"organizations">,
            sessionId,
          }
        : "skip",
    ) as LiveMessage[] | undefined) ?? [];

  useEffect(() => {
    if (!liveMessages) {
      return;
    }

    const normalized = liveMessages.map((message) => {
      const fallbackTimestamp =
        ("createdAt" in message
          ? (message as { createdAt?: number }).createdAt
          : undefined) ?? Date.now();

      return {
        id: message._id ?? `${message.role}-${fallbackTimestamp}`,
        role: message.role as "user" | "assistant" | "system",
        content: message.content,
      };
    });

    setMessages((current) => {
      let next = current;
      const existingIds = new Set(current.map((message) => message.id));

      normalized.forEach((incoming) => {
        if (existingIds.has(incoming.id)) {
          return;
        }

        const duplicateIndex = next.findIndex(
          (message) =>
            message.role === incoming.role &&
            message.content.trim() === incoming.content.trim(),
        );

        if (duplicateIndex >= 0) {
          const updated = [...next];
          updated[duplicateIndex] = incoming;
          next = updated;
          existingIds.add(incoming.id);
          return;
        }

        next = [...next, incoming];
        existingIds.add(incoming.id);
      });

      return next;
    });
  }, [liveMessages, setMessages]);

  const agentMetadataByMessageId = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const message of liveMessages) {
      const messageId = message._id ?? `${message.role}-${message.createdAt}`;
      if (message.agentName) {
        map.set(messageId, message.agentName);
      }
    }
    return map;
  }, [liveMessages]);

  const lastAssistantAgentName = useMemo(() => {
    for (let i = liveMessages.length - 1; i >= 0; i--) {
      const message = liveMessages[i];
      if (!message) {
        continue;
      }
      if (message.role === "assistant" && message.agentName) {
        return message.agentName;
      }
    }
    return undefined;
  }, [liveMessages]);

  const agentPresence = useQuery(
    api.plugins.support.queries.getAgentPresence,
    organizationId && sessionId && supportsDirectConvex
      ? {
          organizationId: organizationId as Id<"organizations">,
          sessionId,
        }
      : "skip",
  );

  const resolvedAgentName =
    agentPresence?.agentName ??
    presenceState.find((entry) => entry.online && entry.data?.role === "agent")
      ?.data?.name ??
    lastAssistantAgentName ??
    "Support agent";

  const agentIsTyping = agentPresence?.status === "typing";

  const conversationMode = useQuery(
    api.plugins.support.queries.getConversationMode,
    organizationId && sessionId && supportsDirectConvex
      ? {
          organizationId: organizationId as Id<"organizations">,
          sessionId,
        }
      : "skip",
  );

  const isManualMode =
    supportsDirectConvex && conversationMode?.mode === "manual";

  const presenceRoomId =
    organizationId && sessionId
      ? `support:${organizationId}:${sessionId}`
      : null;

  const visitorPresenceMetadata = useMemo(
    () => ({
      role: "visitor" as const,
      name: contact?.fullName ?? undefined,
      email: contact?.email ?? undefined,
    }),
    [contact?.email, contact?.fullName],
  );

  const handlePresenceChange = useCallback((state: PresenceEntry[]) => {
    setPresenceState((previous) =>
      presenceArraysEqual(previous, state) ? previous : state,
    );
  }, []);

  const onlineAgentCount = useMemo(
    () =>
      presenceState.filter(
        (entry) => entry.online && entry.data?.role === "agent",
      ).length,
    [presenceState],
  );

  const recordMessage = useMutation(
    api.plugins.support.mutations.recordMessage,
  );
  const [isManualSending, setIsManualSending] = useState(false);

  const assistantIsResponding = !isManualMode && isLoading;
  const showSubmitSpinner = isManualMode ? isManualSending : isLoading;
  const isSubmitDisabled = showSubmitSpinner || input.trim().length === 0;
  const composerDisabled = assistantIsResponding || isManualSending;

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) {
      return;
    }

    const previousCount = previousMessageCountRef.current;
    const hasNewMessage = displayedMessages.length > previousCount;

    if (
      hasNewMessage ||
      (assistantIsResponding && displayedMessages.length >= previousCount)
    ) {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: previousCount > 0 ? "smooth" : "auto",
      });
    }

    previousMessageCountRef.current = displayedMessages.length;
  }, [assistantIsResponding, displayedMessages.length]);

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim().length === 0) {
      return;
    }

    if (isManualMode) {
      const content = input.trim();
      const optimisticId = `manual-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          role: "user" as const,
          content,
        },
      ]);
      setInput("");
      setIsManualSending(true);
      try {
        if (supportsDirectConvex) {
          const insertedId = await recordMessage({
            organizationId: organizationId as Id<"organizations">,
            sessionId,
            role: "user",
            content,
            contactId: contact?.contactId
              ? (contact.contactId as Id<"contacts">)
              : undefined,
            contactName: contact?.fullName,
            contactEmail: contact?.email,
          });
          setMessages((prev) =>
            prev.map((message) =>
              message.id === optimisticId
                ? { ...message, id: String(insertedId) }
                : message,
            ),
          );
        }
      } catch (manualError) {
        console.error("[support-chat] manual send failed", manualError);
      } finally {
        setIsManualSending(false);
      }
      return;
    }

    await handleSubmit(event);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(openStorageKey);
    setIsOpen(stored === "true");
  }, [openStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(openStorageKey, JSON.stringify(isOpen));
  }, [isOpen, openStorageKey]);

  useEffect(() => {
    if (isOpen && messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isOpen]);

  const handleContactFieldChange = (
    field: keyof ContactFormState,
    value: string,
  ) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactError(null);

    const requiredErrors: string[] = [];
    if (settings.fields.fullName && !contactForm.fullName.trim()) {
      requiredErrors.push("Full name is required");
    }
    if (settings.fields.email && !contactForm.email.trim()) {
      requiredErrors.push("Email is required");
    }
    if (requiredErrors.length > 0) {
      setContactError(requiredErrors.join(". "));
      return;
    }

    setIsSubmittingContact(true);
    try {
      const response = await fetch("/api/support-chat/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          sessionId,
          fullName: contactForm.fullName.trim() || undefined,
          email: contactForm.email.trim() || undefined,
          phone: contactForm.phone.trim() || undefined,
          company: contactForm.company.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.contactId) {
        throw new Error(data.error ?? "Unable to save contact");
      }

      const persisted: StoredContact = {
        contactId: data.contactId as string,
        fullName: data.contact?.fullName ?? contactForm.fullName.trim(),
        email: contactForm.email.trim() || undefined,
      };

      onContactSaved(persisted);
      setContactForm(defaultContactForm);
      setContactError(null);
    } catch (err) {
      console.error("[support-chat] contact capture failed", err);
      setContactError(
        err instanceof Error
          ? err.message
          : "Unable to save your details. Please try again.",
      );
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleTabChange = (tab: ChatWidgetTab) => {
    setActiveTab(tab);
  };

  const handleComposerInputChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    handleInputChange(event);
  };

  return (
    <>
      {isOpen && presenceRoomId && (
        <ConversationPresenceBridge
          roomId={presenceRoomId}
          userId={`visitor:${sessionId}`}
          metadata={visitorPresenceMetadata}
          onChange={handlePresenceChange}
        />
      )}
      {isOpen && (
        <div className="border-border/60 bg-card fixed right-4 bottom-20 z-50 w-full max-w-sm rounded-2xl border shadow-2xl">
          <ChatWidgetHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onClose={() => setIsOpen(false)}
            shouldCollectContact={shouldCollectContact}
            settings={settings}
            resolvedAgentName={resolvedAgentName}
            tenantName={tenantName}
            onlineAgentCount={onlineAgentCount}
          />
          <ChatWidgetContent
            activeTab={activeTab}
            settings={settings}
            shouldCollectContact={shouldCollectContact}
            contactForm={contactForm}
            contactError={contactError}
            isSubmittingContact={isSubmittingContact}
            onContactFieldChange={handleContactFieldChange}
            onSubmitContact={submitContact}
            messageListRef={messageListRef}
            displayedMessages={displayedMessages as ChatHistoryMessage[]}
            agentMetadataByMessageId={agentMetadataByMessageId}
            assistantIsResponding={assistantIsResponding}
            error={error}
            reload={reload}
            agentIsTyping={agentIsTyping && activeTab === "conversations"}
            resolvedAgentName={resolvedAgentName}
            tenantName={tenantName}
            helpdeskArticles={helpdeskArticles}
          />
          <ChatWidgetFooter
            activeTab={activeTab}
            shouldCollectContact={shouldCollectContact}
            composerDisabled={composerDisabled}
            input={input}
            onInputChange={handleComposerInputChange}
            onSubmit={handleChatSubmit}
            isSubmitDisabled={isSubmitDisabled}
            showSubmitSpinner={showSubmitSpinner}
          />
        </div>
      )}

      <button
        type="button"
        className="bg-primary text-primary-foreground shadow-primary/40 focus-visible:ring-primary/80 fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open support chat"
      >
        <MessageCircle className="h-4 w-4" />
        Support
      </button>
    </>
  );
}

interface PresenceBridgeProps {
  roomId: string;
  userId: string;
  metadata?: Record<string, unknown>;
  onChange: (state: PresenceEntry[]) => void;
}

const ConversationPresenceBridge = ({
  roomId,
  userId,
  metadata,
  onChange,
}: PresenceBridgeProps) => {
  const presenceState = usePresence(api.presence, roomId, userId, 15000) ?? [];
  const updateMetadata = useMutation(api.presence.updateRoomUser);

  useEffect(() => {
    onChange(presenceState);
  }, [onChange, presenceState]);

  useEffect(() => {
    if (!metadata) {
      return;
    }
    void updateMetadata({ roomId, userId, data: metadata }).catch(() => {
      // Metadata is optional for presence display; ignore failures.
    });
  }, [metadata, roomId, updateMetadata, userId]);

  return null;
};

const presenceArraysEqual = (
  previous: PresenceEntry[],
  next: PresenceEntry[],
) => {
  if (previous.length !== next.length) {
    return false;
  }
  for (let index = 0; index < previous.length; index++) {
    const prev = previous[index];
    const curr = next[index];
    if (!prev || !curr) {
      return false;
    }
    const prevMetadata =
      typeof prev.data === "object" && prev.data ? prev.data : {};
    const currMetadata =
      typeof curr.data === "object" && curr.data ? curr.data : {};
    if (
      prev.userId !== curr.userId ||
      prev.online !== curr.online ||
      JSON.stringify(prevMetadata) !== JSON.stringify(currMetadata)
    ) {
      return false;
    }
  }
  return true;
};
