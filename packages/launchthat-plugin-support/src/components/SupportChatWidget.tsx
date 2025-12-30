"use client";

import type { UIMessage } from "ai";
import type { GenericId as Id } from "convex/values";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { api } from "@portal/convexspec";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MessageCircle } from "lucide-react";

import { cn } from "@acme/ui";
import { Drawer, DrawerContent, DrawerTrigger } from "@acme/ui/drawer";
import { useMediaQuery } from "@acme/ui/hooks/use-media-query";

import type {
  AssistantExperienceId,
  AssistantExperienceTrigger,
} from "../assistant/experiences";
import type { SupportChatSettings } from "../settings";
import type { ChatHistoryMessage } from "./hooks/useSupportChatHistory";
import type { ChatWidgetTab, HelpdeskArticle } from "./supportChat/types";
import type { StoredSupportContact } from "./supportChat/utils";
import {
  DEFAULT_ASSISTANT_EXPERIENCE_ID,
  getAssistantExperience,
  SUPPORT_ASSISTANT_EVENT,
} from "../assistant/experiences";
import { useHelpdeskArticles } from "./hooks/useHelpdeskArticles";
import { useSupportChatHistory } from "./hooks/useSupportChatHistory";
import { useSupportChatThread } from "./hooks/useSupportChatSession";
import { useSupportChatSettings } from "./hooks/useSupportChatSettings";
import { useSupportContactStorage } from "./hooks/useSupportContactStorage";
import { ChatWidgetContent } from "./supportChat/ChatWidgetContent";
import { ChatWidgetFooter } from "./supportChat/ChatWidgetFooter";
import { ChatWidgetHeader } from "./supportChat/ChatWidgetHeader";
import { parseLexicalRichText } from "./supportChat/utils";

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

const isConvexId = (value?: string | null): boolean =>
  typeof value === "string" && /^[a-z0-9]{24}$/i.test(value);

export interface SupportChatWidgetProps {
  organizationId?: string | null;
  tenantName?: string;
  apiPath?: string;
  defaultContact?: StoredContact | null;
  bubbleVariant?: "offset" | "flush-right-square";
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

type PresenceEntry = {
  userId: string;
  online?: boolean;
  data?: Record<string, unknown>;
};

export function SupportChatWidget({
  organizationId,
  tenantName = "your organization",
  apiPath = "/api/support-chat",
  defaultContact = null,
  bubbleVariant = "offset",
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
      bubbleVariant={bubbleVariant}
    />
  );
}

interface SupportChatWidgetInnerProps {
  organizationId: string;
  tenantName: string;
  apiPath: string;
  defaultContact: StoredContact | null;
  bubbleVariant: "offset" | "flush-right-square";
}

function SupportChatWidgetInner({
  organizationId,
  tenantName,
  apiPath,
  defaultContact,
  bubbleVariant,
}: SupportChatWidgetInnerProps) {
  const { threadId } = useSupportChatThread(organizationId);
  const { contact, saveContact } = useSupportContactStorage(organizationId);
  const { settings, isLoading: settingsLoading } =
    useSupportChatSettings(organizationId);
  const { articles: helpdeskArticles } = useHelpdeskArticles(
    apiPath,
    organizationId,
  );
  const { initialMessages, isBootstrapped } = useSupportChatHistory(
    organizationId,
    threadId,
  );

  if (!isBootstrapped || settingsLoading) {
    return (
      <button
        type="button"
        className={cn(
          "bg-muted text-muted-foreground fixed bottom-4 z-50 flex items-center gap-2 text-sm font-medium shadow-lg",
          bubbleVariant === "flush-right-square"
            ? "right-0 h-12 w-12 justify-center rounded-l-xl p-0"
            : "right-4 rounded-full px-4 py-3",
        )}
        disabled
        aria-busy="true"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {bubbleVariant === "flush-right-square" ? (
          <span className="sr-only">Loading support…</span>
        ) : (
          "Loading support…"
        )}
      </button>
    );
  }

  return (
    <ChatSurface
      apiPath={apiPath}
      organizationId={organizationId}
      threadId={threadId ?? ""}
      tenantName={tenantName}
      initialMessages={initialMessages}
      settings={settings}
      contact={contact}
      onContactSaved={saveContact}
      helpdeskArticles={helpdeskArticles}
      defaultContact={defaultContact}
      bubbleVariant={bubbleVariant}
    />
  );
}

interface ChatSurfaceProps {
  organizationId: string;
  threadId: string;
  tenantName: string;
  apiPath: string;
  initialMessages: ChatHistoryMessage[];
  settings: SupportChatSettings;
  contact: StoredContact | null;
  onContactSaved: (contact: StoredContact) => void;
  helpdeskArticles: HelpdeskArticle[];
  defaultContact: StoredContact | null;
  bubbleVariant: "offset" | "flush-right-square";
}

function ChatSurface({
  organizationId,
  threadId,
  tenantName,
  apiPath,
  initialMessages,
  settings,
  contact,
  onContactSaved,
  helpdeskArticles,
  defaultContact,
  bubbleVariant,
}: ChatSurfaceProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const normalizedContactId = useMemo(
    () =>
      contact?.contactId && isConvexId(contact.contactId)
        ? (contact.contactId as Id<"contacts">)
        : undefined,
    [contact?.contactId],
  );

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
  const [activeExperienceId, setActiveExperienceId] =
    useState<AssistantExperienceId>(DEFAULT_ASSISTANT_EXPERIENCE_ID);
  const [experienceContext, setExperienceContext] = useState<
    Record<string, unknown>
  >({});
  const activeExperience = useMemo(
    () => getAssistantExperience(activeExperienceId),
    [activeExperienceId],
  );

  const defaultContactConvexId = useMemo(
    () =>
      defaultContact && isConvexId(defaultContact.contactId)
        ? defaultContact.contactId
        : undefined,
    [defaultContact?.contactId],
  );

  const fallbackContactId = useMemo(
    () =>
      contact?.contactId ?? defaultContact?.contactId ?? `visitor-${threadId}`,
    [contact?.contactId, defaultContact?.contactId, threadId],
  );

  useEffect(() => {
    if (!defaultContact) {
      return;
    }

    if (
      !contact ||
      contact.email !== defaultContact.email ||
      contact.fullName !== defaultContact.fullName ||
      (defaultContactConvexId && normalizedContactId !== defaultContactConvexId)
    ) {
      onContactSaved({
        contactId: defaultContactConvexId ?? fallbackContactId,
        fullName: defaultContact.fullName ?? contact?.fullName,
        email: defaultContact.email ?? contact?.email,
      });
    }
  }, [
    contact,
    defaultContact,
    defaultContactConvexId,
    fallbackContactId,
    normalizedContactId,
    onContactSaved,
  ]);

  const shouldCollectContact = settings.requireContact && !contact;

  const requestBodyRef = useRef({
    organizationId,
    threadId,
    contactId: normalizedContactId,
    contactEmail: contact?.email ?? defaultContact?.email ?? undefined,
    contactName: contact?.fullName ?? defaultContact?.fullName ?? undefined,
    experienceId: activeExperienceId,
    experienceContext,
  });

  useEffect(() => {
    requestBodyRef.current = {
      organizationId,
      threadId,
      contactId: normalizedContactId,
      contactEmail: contact?.email ?? defaultContact?.email ?? undefined,
      contactName: contact?.fullName ?? defaultContact?.fullName ?? undefined,
      experienceId: activeExperienceId,
      experienceContext,
    };
  }, [
    activeExperienceId,
    contact?.email,
    contact?.fullName,
    defaultContact?.email,
    defaultContact?.fullName,
    experienceContext,
    normalizedContactId,
    organizationId,
    threadId,
  ]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiPath,
        body: () => requestBodyRef.current,
      }),
    [apiPath],
  );

  const initialUiMessages = useMemo((): UIMessage[] => {
    return (initialMessages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      parts: [
        {
          type: "text",
          text:
            typeof message.content === "string"
              ? message.content
              : JSON.stringify(message.content),
        },
      ],
    }));
  }, [initialMessages]);

  const { messages, setMessages, sendMessage, regenerate, status, error } =
    useChat({
      id: threadId,
      messages: initialUiMessages,
      transport,
      onError: (err) => {
        console.error("[support-chat] streaming error", err);
      },
    });

  const [input, setInput] = useState("");

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) {
        return;
      }
      void sendMessage({ text: trimmed });
      setInput("");
    },
    [input, sendMessage],
  );

  const isLoading = status === "submitted" || status === "streaming";

  const reload = useCallback(() => {
    void regenerate();
  }, [regenerate]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AssistantExperienceTrigger>).detail;
      if (!detail) {
        return;
      }
      setIsOpen(true);
      const nextExperienceId =
        detail.experienceId ?? DEFAULT_ASSISTANT_EXPERIENCE_ID;
      setActiveExperienceId(nextExperienceId);
      const nextContext = detail.context ?? {};
      setExperienceContext(nextContext);

      requestBodyRef.current = {
        organizationId,
        threadId,
        contactId: normalizedContactId,
        contactEmail: contact?.email ?? defaultContact?.email ?? undefined,
        contactName: contact?.fullName ?? defaultContact?.fullName ?? undefined,
        experienceId: nextExperienceId,
        experienceContext: nextContext,
      };

      if (detail.message && detail.message.length > 0) {
        if (!shouldCollectContact) {
          window.requestAnimationFrame(() => {
            void sendMessage({ text: detail.message ?? "" });
          });
        }
      }
    };

    window.addEventListener(SUPPORT_ASSISTANT_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(
        SUPPORT_ASSISTANT_EVENT,
        handler as EventListener,
      );
    };
  }, [
    contact?.email,
    contact?.fullName,
    defaultContact?.email,
    defaultContact?.fullName,
    normalizedContactId,
    organizationId,
    sendMessage,
    threadId,
    shouldCollectContact,
  ]);

  const displayedMessages = useMemo(
    () =>
      messages
        .filter((message) => message.role !== "system")
        .map((message) => {
          const rawText = message.parts
            .filter(isTextUIPart)
            .map((part) => part.text)
            .join("");

          return {
            id: message.id,
            role: message.role,
            content: stripFormattedPayload(rawText),
          };
        }),
    [messages],
  );
  const previousMessageCountRef = useRef(displayedMessages.length);

  const liveMessages =
    (useQuery(
      api.plugins.support.queries.listMessages,
      organizationId && threadId
        ? {
            organizationId: organizationId as Id<"organizations">,
          threadId,
          }
        : "skip",
    ) as LiveMessage[] | undefined) ?? [];

  useEffect(() => {
    if (!liveMessages) {
      return;
    }

    const incomingUiMessages: UIMessage[] = liveMessages.map((message) => ({
      id: message._id,
      role: message.role,
      parts: [{ type: "text", text: message.content }],
    }));

    // Use Convex-persisted messages as the source of truth to avoid duplicates.
    // (The chat transport also keeps an in-memory message list for streaming.)
    // This replacement keeps the UI stable and prevents "double send / triple reply"
    // when the same message exists both in-memory and in Convex.
    setMessages(incomingUiMessages);
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

  type AgentPresenceResult = {
    agentUserId?: string;
    agentName?: string;
    status?: "typing" | "idle";
  };
  const agentPresence = useQuery(
    api.plugins.support.queries.getAgentPresence,
    organizationId && threadId
      ? {
          organizationId: organizationId as Id<"organizations">,
          threadId,
        }
      : "skip",
  ) as AgentPresenceResult | null | undefined;

  const resolvedAgentName: string =
    (agentPresence?.agentName as string | undefined) ??
    (presenceState.find((entry) => entry.online && entry.data?.role === "agent")
      ?.data?.name as string | undefined) ??
    lastAssistantAgentName ??
    "Support agent";

  const agentIsTyping = agentPresence?.status === "typing";

  const conversationMode = useQuery(
    api.plugins.support.queries.getConversationMode,
    organizationId && threadId
      ? {
          organizationId: organizationId as Id<"organizations">,
          threadId,
        }
      : "skip",
  );

  const isManualMode = conversationMode === "manual";

  const presenceRoomId =
    organizationId && threadId
      ? `support:${organizationId}:${threadId}`
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
          parts: [{ type: "text", text: content }],
        },
      ]);
      setInput("");
      setIsManualSending(true);
      try {
        await recordMessage({
          organizationId: organizationId as Id<"organizations">,
          threadId,
          role: "user",
          content,
          contactId: normalizedContactId,
          contactName: contact?.fullName,
          contactEmail: contact?.email,
        });
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
          threadId,
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
          userId={`visitor:${threadId}`}
          metadata={visitorPresenceMetadata}
          onChange={handlePresenceChange}
        />
      )}
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen} repositionInputs={false}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className={cn(
                "bg-primary text-primary-foreground shadow-primary/40 focus-visible:ring-primary/80 fixed bottom-4 z-50 flex items-center gap-2 text-sm font-medium shadow-lg transition hover:scale-105 focus-visible:ring-2 focus-visible:outline-none",
                bubbleVariant === "flush-right-square"
                  ? "right-0 h-12 w-12 justify-center rounded-l-xl p-0"
                  : "right-4 rounded-full px-4 py-3",
              )}
              aria-label="Open support chat"
            >
              <MessageCircle className="h-4 w-4" />
              {bubbleVariant === "flush-right-square" ? (
                <span className="sr-only">Support</span>
              ) : (
                "Support"
              )}
            </button>
          </DrawerTrigger>
          <DrawerContent className="p-0">
            <div className="border-border/60 bg-card mx-auto w-full max-w-sm rounded-t-2xl border shadow-2xl">
              <ChatWidgetHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onClose={() => setIsOpen(false)}
                shouldCollectContact={shouldCollectContact}
                settings={settings}
                resolvedAgentName={resolvedAgentName}
                tenantName={tenantName}
                onlineAgentCount={onlineAgentCount}
                experienceLabel={
                  activeExperienceId === DEFAULT_ASSISTANT_EXPERIENCE_ID
                    ? undefined
                    : activeExperience.label
                }
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
          </DrawerContent>
        </Drawer>
      ) : (
        <>
          {isOpen && (
            <div
              className={cn(
                "border-border/60 bg-card fixed bottom-20 z-50 w-full max-w-sm rounded-2xl border shadow-2xl",
                bubbleVariant === "flush-right-square" ? "right-0" : "right-4",
              )}
            >
              <ChatWidgetHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onClose={() => setIsOpen(false)}
                shouldCollectContact={shouldCollectContact}
                settings={settings}
                resolvedAgentName={resolvedAgentName}
                tenantName={tenantName}
                onlineAgentCount={onlineAgentCount}
                experienceLabel={
                  activeExperienceId === DEFAULT_ASSISTANT_EXPERIENCE_ID
                    ? undefined
                    : activeExperience.label
                }
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
            className={cn(
              "bg-primary text-primary-foreground shadow-primary/40 focus-visible:ring-primary/80 fixed bottom-4 z-50 flex items-center gap-2 text-sm font-medium shadow-lg transition hover:scale-105 focus-visible:ring-2 focus-visible:outline-none",
              bubbleVariant === "flush-right-square"
                ? "right-0 h-12 w-12 justify-center rounded-l-xl p-0"
                : "right-4 rounded-full px-4 py-3",
            )}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label="Open support chat"
          >
            <MessageCircle className="h-4 w-4" />
            {bubbleVariant === "flush-right-square" ? (
              <span className="sr-only">Support</span>
            ) : (
              "Support"
            )}
          </button>
        </>
      )}
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
  const presenceState: PresenceEntry[] = [];

  useEffect(() => {
    onChange(presenceState);
  }, [onChange, presenceState]);

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
