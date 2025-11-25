"use client";

import { useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

export interface SupportChatWidgetProps {
  organizationId?: string | null;
  tenantName?: string;
  apiPath?: string;
}

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

function SupportChatWidgetInner({
  organizationId,
  tenantName,
  apiPath,
}: SupportChatWidgetInnerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  if (!sessionIdRef.current) {
    sessionIdRef.current = generateSessionId(organizationId);
  }

  const sessionId = sessionIdRef.current;

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
    body: {
      organizationId,
      sessionId,
    },
  });

  const displayedMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages],
  );

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ask Support</p>
              <p className="text-xs text-muted-foreground">
                Answers tailored for {tenantName}
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

          <div className="flex h-80 flex-col gap-4 overflow-y-auto px-4 py-4">
            {displayedMessages.length === 0 && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                Ask anything about {tenantName}—policies, orders, or the
                contents of your courses. This assistant is scoped to your
                organization and combines curated FAQs with product details.
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
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
            className="border-t border-border/60 p-3"
          >
            <div className="flex items-center gap-2">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question..."
                className="min-h-[40px] flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Responses may reference your courses, lessons, and FAQs.
            </p>
          </form>
        </div>
      )}

      <button
        type="button"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
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
