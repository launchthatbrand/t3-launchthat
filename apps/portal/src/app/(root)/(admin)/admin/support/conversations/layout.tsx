"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Label,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  Switch,
} from "@acme/ui/index";
import { Separator } from "@acme/ui/separator";

import type {
  ContactDoc,
  ConversationSummary,
} from "../_components/ConversationInspector";
import { useTenant } from "~/context/TenantContext";
import ConversationHeader from "../_components/ConversationHeader";
import { ConversationInspector } from "../_components/ConversationInspector";

const isContactId = (value: unknown): value is Id<"contacts"> =>
  typeof value === "string" && value.length > 0;

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("sessionId");
  const [activeTab, setActiveTab] = useState<"messages" | "dashboard">(
    "messages",
  );

  useEffect(() => {
    setActiveTab("messages");
  }, [activeSessionId]);

  const conversationsQuery = useQuery(
    api.plugins.support.queries.listConversations,
    organizationId ? { organizationId, limit: 100 } : "skip",
  );
  const conversations = useMemo(
    () => (conversationsQuery ?? []) as ConversationSummary[],
    [conversationsQuery],
  );

  const selectedConversation = useMemo(() => {
    if (!activeSessionId) {
      return undefined;
    }
    return conversations.find(
      (conversation) => conversation.sessionId === activeSessionId,
    );
  }, [activeSessionId, conversations]);

  const contactsApi = api as any;
  const contact = useQuery(
    contactsApi.core.contacts.queries.get,
    selectedConversation?.contactId &&
      isContactId(selectedConversation.contactId)
      ? { contactId: selectedConversation.contactId }
      : "skip",
  ) as ContactDoc | null;

  const resolvedContact = contact ?? null;

  const showInspector = Boolean(activeSessionId);

  return (
    <div className="flex flex-1">
      <Sidebar
        collapsible="none"
        className="hidden w-80 flex-1 border-r md:flex"
      >
        <SidebarHeader className="h-24 gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              Conversations
            </div>
            <Label className="flex items-center gap-2 text-sm">
              <span>Unreads</span>
              <Switch className="shadow-none" />
            </Label>
          </div>
          <SidebarInput placeholder="Search session ID…" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const isActive =
                    activeSessionId === conversation.sessionId ||
                    (!activeSessionId &&
                      conversations[0]?.sessionId === conversation.sessionId);
                  return (
                    <Link
                      key={conversation.sessionId}
                      href={`/admin/support/conversations?sessionId=${conversation.sessionId}`}
                      className={`flex flex-col gap-1 border-b p-4 text-sm last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        isActive ? "bg-sidebar-accent/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {conversation.contactName ??
                              `Session ${conversation.sessionId.slice(-6)}`}
                          </span>
                          {conversation.contactEmail && (
                            <span className="text-[11px] text-muted-foreground">
                              {conversation.contactEmail}
                            </span>
                          )}
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(conversation.lastAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {conversation.totalMessages} messages ·{" "}
                        {conversation.lastRole === "user"
                          ? "Waiting on assistant"
                          : "Assistant replied"}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  Conversations will appear here once visitors start chatting.
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex w-full flex-col">
        <ConversationHeader
          contact={resolvedContact}
          conversation={selectedConversation}
          tenantName={tenant?.name}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full flex-1 md:min-w-[450px]"
        >
          <ResizablePanel defaultSize={showInspector ? 70 : 100} minSize={40}>
            {activeTab === "messages" ? (
              <div className="h-full">{children}</div>
            ) : (
              <CustomerDashboard
                contact={resolvedContact}
                conversation={selectedConversation}
                tenantName={tenant?.name}
              />
            )}
          </ResizablePanel>
          {showInspector ? (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <ConversationInspector
                  conversation={selectedConversation}
                  contact={resolvedContact}
                  fallbackName={
                    selectedConversation?.contactName ??
                    (selectedConversation
                      ? `Session ${selectedConversation.sessionId.slice(-6)}`
                      : undefined)
                  }
                  fallbackEmail={selectedConversation?.contactEmail}
                  organizationName={tenant?.name}
                />
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

interface CustomerDashboardProps {
  contact: ContactDoc | null;
  conversation: ConversationSummary | undefined;
  tenantName?: string;
}

const CustomerDashboard = ({
  contact,
  conversation,
  tenantName,
}: CustomerDashboardProps) => {
  const createdAt = contact ? formatDateTime(contact.createdAt) : "—";
  const lastActive = conversation ? formatDateTime(conversation.lastAt) : "—";
  const totalMessages = conversation?.totalMessages ?? 0;
  const tags = contact?.tags ?? [];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact summary</CardTitle>
          <CardDescription>
            Profile details for this visitor within {tenantName ?? "your org"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <DetailRow label="Email" value={contact?.email ?? "Not provided"} />
          <DetailRow label="Phone" value={contact?.phone ?? "Not provided"} />
          <DetailRow
            label="Company"
            value={contact?.company ?? tenantName ?? "Unknown"}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tags
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No tags assigned</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Conversation activity</CardTitle>
          <CardDescription>Recent engagement metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <DetailRow label="First seen" value={createdAt} />
          <DetailRow label="Last active" value={lastActive} />
          <DetailRow
            label="Messages exchanged"
            value={`${totalMessages} message${totalMessages === 1 ? "" : "s"}`}
          />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Conversation status:{" "}
            <span className="font-medium text-foreground">
              {conversation?.lastRole === "user"
                ? "Waiting on agent response"
                : "Assistant responded"}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

const formatDateTime = (value?: number) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};
