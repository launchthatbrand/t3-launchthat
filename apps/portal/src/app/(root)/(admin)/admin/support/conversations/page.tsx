"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { useTenant } from "~/context/TenantContext";

interface SupportMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
}

export default function SupportConversationsPage() {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const messages = (useQuery(
    api.plugins.support.queries.listMessages,
    sessionId && organizationId ? { organizationId, sessionId } : "skip",
  ) ?? []) as SupportMessage[];

  const contactSummary = messages.find((message) => message.contactId);

  if (!sessionId) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
        Select a conversation from the sidebar to inspect the transcript.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            Session {sessionId.slice(-6)}
            <Badge variant="outline">{tenant?.name ?? "Organization"}</Badge>
          </CardTitle>
          {contactSummary && (
            <div className="text-xs text-muted-foreground">
              Contact:{" "}
              <span className="font-medium">
                {contactSummary.contactName ?? "Unknown visitor"}
              </span>
              {contactSummary.contactEmail && (
                <span className="ml-2">{contactSummary.contactEmail}</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    message.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No messages found for this session yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
