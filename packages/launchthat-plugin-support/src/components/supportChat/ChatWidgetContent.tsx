"use client";

import type { FormEvent, MutableRefObject } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import type { SupportChatSettings } from "../../settings";
import type { ChatHistoryMessage } from "../hooks/useSupportChatHistory";
import type { ChatWidgetTab, HelpdeskArticle } from "./types";

interface ContactFormState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
}

interface ChatWidgetContentProps {
  activeTab: ChatWidgetTab;
  settings: SupportChatSettings;
  shouldCollectContact: boolean;
  contactForm: ContactFormState;
  contactError: string | null;
  isSubmittingContact: boolean;
  onContactFieldChange: (field: keyof ContactFormState, value: string) => void;
  onSubmitContact: (event: FormEvent<HTMLFormElement>) => void;
  messageListRef: MutableRefObject<HTMLDivElement | null>;
  displayedMessages: ChatHistoryMessage[];
  agentMetadataByMessageId: Map<string, string | undefined>;
  assistantIsResponding: boolean;
  error: Error | undefined;
  reload: () => void;
  agentIsTyping: boolean;
  resolvedAgentName: string;
  tenantName: string;
  helpdeskArticles: HelpdeskArticle[];
}

export const ChatWidgetContent = ({
  activeTab,
  settings,
  shouldCollectContact,
  contactForm,
  contactError,
  isSubmittingContact,
  onContactFieldChange,
  onSubmitContact,
  messageListRef,
  displayedMessages,
  agentMetadataByMessageId,
  assistantIsResponding,
  error,
  reload,
  agentIsTyping,
  resolvedAgentName,
  tenantName,
  helpdeskArticles,
}: ChatWidgetContentProps) => {
  if (activeTab === "helpdesk") {
    return (
      <div className="flex h-80 flex-col gap-3 overflow-y-auto px-4 py-4">
        {helpdeskArticles.map((article) => (
          <div
            key={article.id}
            className="bg-muted/40 rounded-lg border p-3 text-sm"
          >
            <p className="font-semibold">{article.title}</p>
            <p className="text-muted-foreground text-xs">{article.summary}</p>
            <p className="text-muted-foreground mt-2 text-[11px]">
              Updated {article.updatedAt}
            </p>
          </div>
        ))}
        {helpdeskArticles.length === 0 ? (
          <div className="text-muted-foreground text-center text-sm">
            No helpdesk articles available.
          </div>
        ) : null}
      </div>
    );
  }

  if (shouldCollectContact) {
    return (
      <form
        className="flex h-80 flex-col gap-3 overflow-y-auto px-4 py-4"
        onSubmit={onSubmitContact}
      >
        {settings.fields.fullName && (
          <div className="space-y-1 text-sm">
            <Label htmlFor="support-fullName">Full name</Label>
            <Input
              id="support-fullName"
              value={contactForm.fullName}
              onChange={(event) =>
                onContactFieldChange("fullName", event.target.value)
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
                onContactFieldChange("email", event.target.value)
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
                onContactFieldChange("phone", event.target.value)
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
                onContactFieldChange("company", event.target.value)
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
    );
  }

  return (
    <div
      className="flex h-80 flex-col gap-4 overflow-y-auto px-4 py-4"
      ref={messageListRef}
    >
      {displayedMessages.length === 0 && (
        <div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-xs">
          Ask anything about {tenantName}—policies, orders, or your course
          content. This assistant combines curated FAQs with product details
          specific to your account.
        </div>
      )}

      {displayedMessages.map((message) => {
        const assistantName = message.id
          ? agentMetadataByMessageId.get(message.id)
          : undefined;
        return (
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
              {message.role === "assistant" && assistantName ? (
                <p className="text-muted-foreground mb-1 text-[11px] font-semibold">
                  {assistantName}
                </p>
              ) : null}
              {message.content}
            </div>
          </div>
        );
      })}

      {assistantIsResponding && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Thinking...
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-2 text-xs">
          Something went wrong.{" "}
          <button type="button" onClick={reload} className="underline">
            Try again
          </button>
        </div>
      )}

      {agentIsTyping && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {resolvedAgentName} is typing…
        </div>
      )}
    </div>
  );
};
