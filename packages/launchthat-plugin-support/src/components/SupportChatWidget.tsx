"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import type { SupportChatSettings } from "../settings";
import { defaultSupportChatSettings } from "../settings";

export interface SupportChatWidgetProps {
  organizationId?: string | null;
  tenantName?: string;
  apiPath?: string;
}

interface StoredMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface StoredContact {
  contactId: string;
  fullName?: string;
  email?: string;
}

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

function generateSessionId(organizationId: string) {
  if (typeof crypto?.randomUUID === "function") {
    return `support-${organizationId}-${crypto.randomUUID()}`;
  }
  return `support-${organizationId}-${Date.now()}`;
}

export function SupportChatWidget({
  organizationId,
  tenantName = "your organization",
  apiPath = "/api/support-chat",
}: SupportChatWidgetProps) {
  if (!organizationId) {
    return null;
  }

  return (
    <SupportChatWidgetInner
      organizationId={organizationId}
      tenantName={tenantName}
      apiPath={apiPath}
    />
  );
}

interface SupportChatWidgetInnerProps {
  organizationId: string;
  tenantName: string;
  apiPath: string;
}

function readStoredContact(key: string): StoredContact | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredContact) : null;
  } catch {
    return null;
  }
}

function SupportChatWidgetInner({
  organizationId,
  tenantName,
  apiPath,
}: SupportChatWidgetInnerProps) {
  const sessionStorageKey = useMemo(
    () => `support-session-${organizationId}`,
    [organizationId],
  );
  const contactStorageKey = useMemo(
    () => `support-contact-${organizationId}`,
    [organizationId],
  );

  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return generateSessionId(organizationId);
    }
    const stored = window.localStorage.getItem(sessionStorageKey);
    if (stored) {
      return stored;
    }
    const fresh = generateSessionId(organizationId);
    window.localStorage.setItem(sessionStorageKey, fresh);
    return fresh;
  });
  const [initialMessages, setInitialMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([]);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [settings, setSettings] = useState<SupportChatSettings>(
    defaultSupportChatSettings,
  );
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [contact, setContact] = useState<StoredContact | null>(() =>
    readStoredContact(contactStorageKey),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(sessionStorageKey);
    if (stored) {
      setSessionId(stored);
    } else {
      const fresh = generateSessionId(organizationId);
      window.localStorage.setItem(sessionStorageKey, fresh);
      setSessionId(fresh);
    }
  }, [organizationId, sessionStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = readStoredContact(contactStorageKey);
    if (stored) {
      setContact(stored);
    }
  }, [contactStorageKey]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setIsBootstrapped(false);
      try {
        const url = new URL(apiPath, window.location.origin);
        url.searchParams.set("organizationId", organizationId);
        url.searchParams.set("sessionId", sessionId);
        const response = await fetch(url.toString(), { method: "GET" });
        if (!response.ok) {
          throw new Error("Failed to load chat history");
        }
        const data: { messages: StoredMessage[] } = await response.json();
        if (!cancelled) {
          const normalized =
            data.messages?.map((message) => ({
              id: message._id,
              role: message.role,
              content: message.content,
            })) ?? [];
          setInitialMessages(normalized);
        }
      } catch (error) {
        console.error("[support-chat] failed to load history", error);
        if (!cancelled) {
          setInitialMessages([]);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapped(true);
        }
      }
    }
    if (sessionId) {
      void loadHistory();
    }
    return () => {
      cancelled = true;
    };
  }, [apiPath, organizationId, sessionId]);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const response = await fetch(
          `/api/support-chat/settings?organizationId=${organizationId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load support settings");
        }
        const data = await response.json();
        if (!cancelled) {
          setSettings({
            ...defaultSupportChatSettings,
            ...(data.settings ?? {}),
          });
        }
      } catch (error) {
        console.error("[support-chat] settings error", error);
        if (!cancelled) {
          setSettings(defaultSupportChatSettings);
        }
      } finally {
        if (!cancelled) {
          setSettingsLoaded(true);
        }
      }
    }
    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const handleContactSaved = (next: StoredContact) => {
    setContact(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(contactStorageKey, JSON.stringify(next));
    }
  };

  if (!isBootstrapped || !settingsLoaded) {
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
      onContactSaved={handleContactSaved}
    />
  );
}

interface ChatSurfaceProps {
  organizationId: string;
  sessionId: string;
  tenantName: string;
  apiPath: string;
  initialMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }>;
  settings: SupportChatSettings;
  contact: StoredContact | null;
  onContactSaved: (contact: StoredContact) => void;
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
}: ChatSurfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contactForm, setContactForm] =
    useState<ContactFormState>(defaultContactForm);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const shouldCollectContact = settings.requireContact && !contact;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
  } = useChat({
    api: apiPath,
    id: sessionId,
    initialMessages,
    body: {
      organizationId,
      sessionId,
      contactId: contact?.contactId,
    },
  });

  const displayedMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages],
  );

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

  return (
    <>
      {isOpen && (
        <div className="border-border/60 bg-card fixed right-4 bottom-24 z-50 w-full max-w-sm rounded-2xl border shadow-2xl">
          <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                {shouldCollectContact ? settings.introHeadline : "Ask Support"}
              </p>
              <p className="text-muted-foreground text-xs">
                {shouldCollectContact
                  ? settings.welcomeMessage
                  : `Answers tailored for ${tenantName}`}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              aria-label="Close support chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {shouldCollectContact ? (
            <form
              className="flex h-80 flex-col gap-3 overflow-y-auto px-4 py-4"
              onSubmit={submitContact}
            >
              {settings.fields.fullName && (
                <div className="space-y-1 text-sm">
                  <Label htmlFor="support-fullName">Full name</Label>
                  <Input
                    id="support-fullName"
                    value={contactForm.fullName}
                    onChange={(event) =>
                      handleContactFieldChange("fullName", event.target.value)
                    }
                    placeholder="Jane Customer"
                    required
                  />
                </div>
              )}
              {settings.fields.email && (
                <div className="space-y-1 text-sm">
                  <Label htmlFor="support-email">Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(event) =>
                      handleContactFieldChange("email", event.target.value)
                    }
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              )}
              {settings.fields.phone && (
                <div className="space-y-1 text-sm">
                  <Label htmlFor="support-phone">Phone</Label>
                  <Input
                    id="support-phone"
                    value={contactForm.phone}
                    onChange={(event) =>
                      handleContactFieldChange("phone", event.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              )}
              {settings.fields.company && (
                <div className="space-y-1 text-sm">
                  <Label htmlFor="support-company">Company</Label>
                  <Input
                    id="support-company"
                    value={contactForm.company}
                    onChange={(event) =>
                      handleContactFieldChange("company", event.target.value)
                    }
                    placeholder="Acme Co."
                  />
                </div>
              )}

              {contactError && (
                <p className="text-destructive text-xs">{contactError}</p>
              )}
              <p className="text-muted-foreground text-[11px]">
                {settings.privacyMessage}
              </p>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmittingContact}>
                  {isSubmittingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Start chatting"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex h-80 flex-col gap-4 overflow-y-auto px-4 py-4">
                {displayedMessages.length === 0 && (
                  <div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-xs">
                    Ask anything about {tenantName}—policies, orders, or your
                    course content. This assistant combines curated FAQs with
                    product details specific to your account.
                  </div>
                )}

                {displayedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking...
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-lg p-2 text-xs">
                    Something went wrong.{" "}
                    <button
                      type="button"
                      onClick={() => reload()}
                      className="underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-border/60 border-t p-3"
              >
                <div className="flex items-center gap-2">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a question..."
                    className="border-border/60 bg-background focus:border-primary min-h-[40px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || input.trim().length === 0}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 text-center text-[10px]">
                  Responses may reference your courses, lessons, and FAQs.
                </p>
              </form>
            </>
          )}
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
