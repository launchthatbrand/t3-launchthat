"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Activity,
  ArrowRight,
  MessageSquareText,
  NotebookPen,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";

interface ConversationSummary {
  sessionId: string;
  lastMessage: string;
  lastRole: "user" | "assistant";
  lastAt: number;
  firstAt: number;
  totalMessages: number;
}

interface KnowledgeEntrySummary {
  _id: string;
}

export default function SupportDashboardPage() {
  const tenant = useTenant();
  const organizationId = tenant?._id;

  const knowledgeEntries = (useQuery(
    api.plugins.support.queries.listKnowledgeEntries,
    organizationId ? { organizationId } : "skip",
  ) ?? []) as KnowledgeEntrySummary[];
  const conversations = (useQuery(
    api.plugins.support.queries.listConversations,
    organizationId ? { organizationId, limit: 50 } : "skip",
  ) ?? []) as ConversationSummary[];

  const totalResponses = knowledgeEntries.length;
  const activeConversations = conversations.length;
  const openConversations = conversations.filter(
    (conversation) => conversation.lastRole === "user",
  ).length;

  return (
    <AdminLayout
      title="Support dashboard"
      description="Monitor how the assistant is performing and jump into key workflows."
    >
      <AdminLayoutContent>
        <AdminLayoutMain className="space-y-8 py-6">
          <section>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Canned responses"
                value={totalResponses}
                description="Pre-programmed answers ready to serve instantly."
                icon={<NotebookPen className="h-5 w-5 text-primary" />}
              />
              <StatCard
                title="Active conversations"
                value={activeConversations}
                description="Unique sessions currently tracked for this tenant."
                icon={<MessageSquareText className="h-5 w-5 text-primary" />}
              />
              <StatCard
                title="Waiting on reply"
                value={openConversations}
                description="Conversations where the last message was from a visitor."
                icon={<Activity className="h-5 w-5 text-primary" />}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Quick actions</CardTitle>
                  <CardDescription>
                    Triage responses, inspect transcripts, and configure the
                    assistant.
                  </CardDescription>
                </div>
                <Badge variant="outline">{tenant?.name ?? "Org"}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickLink
                  href="/admin/support/responses"
                  label="Manage canned responses"
                  description="Add triggers, edit copy, and control priority."
                />
                <QuickLink
                  href="/admin/support/conversations"
                  label="Review live conversations"
                  description="Inspect transcripts, escalate, or follow up."
                />
                <QuickLink
                  href="/admin/plugins"
                  label="Plugin configuration"
                  description="Toggle support assistance and related features."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest conversations</CardTitle>
                <CardDescription>
                  Snapshot of the most recent visitor sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversations.length > 0 ? (
                  conversations.slice(0, 5).map((conversation) => (
                    <div
                      key={conversation.sessionId}
                      className="flex items-start justify-between rounded-md border p-3 text-sm"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          Session {conversation.sessionId.slice(-6)}
                        </p>
                        <p className="line-clamp-2 text-muted-foreground">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>
                          {new Date(conversation.lastAt).toLocaleDateString()}
                        </p>
                        <p>
                          {conversation.totalMessages} message
                          {conversation.totalMessages === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Conversations will appear here once visitors start chatting.
                  </p>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/support/conversations">
                    View all conversations
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border px-4 py-3 transition hover:bg-muted"
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
