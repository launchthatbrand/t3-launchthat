"use client";

import type { GenericId as Id } from "convex/values";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { ChevronsLeft, ChevronsRight, MessageSquare } from "lucide-react";

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

import type {
  ContactDoc,
  ConversationSummary,
} from "../components/ConversationInspector";
import { ConversationHeader } from "../components/ConversationHeader";
import { ConversationInspector } from "../components/ConversationInspector";
import { CustomerDashboard } from "./CustomerDashboard";

interface ConversationsViewProps {
  organizationId: Id<"organizations">;
  tenantName?: string;
  initialSessionId?: string;
  basePath: string;
}

const isContactId = (value: unknown): value is Id<"contacts"> =>
  typeof value === "string" && value.length > 0;

export function ConversationsView({
  organizationId,
  tenantName,
  initialSessionId,
  basePath,
}: ConversationsViewProps) {
  const router = useRouter();
  const conversations = (useQuery(
    api.plugins.support.queries.listConversations,
    { organizationId, limit: 100 },
  ) ?? []) as ConversationSummary[];

  const [activeTab, setActiveTab] = useState<"messages" | "dashboard">(
    "messages",
  );
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    initialSessionId,
  );

  useEffect(() => {
    setActiveSessionId((prev) => prev ?? initialSessionId);
  }, [initialSessionId]);

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
  const showInspector = Boolean(selectedConversation);
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  const handleSelectConversation = (sessionId: string) => {
    setActiveSessionId(sessionId);
    router.replace(`${basePath}?sessionId=${sessionId}`);
  };

  useEffect(() => {
    if (!showInspector) {
      setIsInspectorCollapsed(false);
      inspectorPanelRef.current?.expand();
    }
  }, [showInspector]);

  const collapseInspector = () => {
    if (!showInspector) return;
    inspectorPanelRef.current?.collapse();
    setIsInspectorCollapsed(true);
  };

  const toggleInspector = () => {
    if (!showInspector) return;
    if (isInspectorCollapsed) {
      inspectorPanelRef.current?.expand();
      setIsInspectorCollapsed(false);
    } else {
      inspectorPanelRef.current?.collapse();
      setIsInspectorCollapsed(true);
    }
  };

  return (
    <div className="flex h-full">
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
                    <button
                      key={conversation.sessionId}
                      type="button"
                      onClick={() =>
                        handleSelectConversation(conversation.sessionId)
                      }
                      className={`flex w-full flex-col gap-1 border-b p-4 text-left text-sm last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
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
                    </button>
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
      <div className="flex h-full w-full flex-col">
        <ConversationHeader
          contact={resolvedContact}
          conversation={selectedConversation}
          tenantName={tenantName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full flex-1 md:min-w-[450px]"
        >
          <ResizablePanel defaultSize={showInspector ? 70 : 100} minSize={40}>
            {activeTab === "messages" ? (
              <div className="h-full">
                {selectedConversation ? (
                  <ConversationTranscript
                    organizationId={organizationId}
                    sessionId={selectedConversation.sessionId}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Select a conversation to inspect the transcript.
                  </div>
                )}
              </div>
            ) : (
              <CustomerDashboard
                contact={resolvedContact}
                conversation={selectedConversation}
                tenantName={tenantName}
              />
            )}
          </ResizablePanel>
          {showInspector ? (
            <>
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={toggleInspector}
                  className="absolute -left-8 top-10 z-10 flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition hover:text-foreground"
                  aria-label={
                    isInspectorCollapsed
                      ? "Expand inspector"
                      : "Collapse inspector"
                  }
                >
                  {isInspectorCollapsed ? (
                    <ChevronsLeft className="h-4 w-4" />
                  ) : (
                    <ChevronsRight className="h-4 w-4" />
                  )}
                </button>
                {/* <ResizableHandle
                  withHandle
                  className="absolute left-0 cursor-col-resize bg-border"
                  onClick={collapseInspector}
                /> */}
              </div>
              <ResizablePanel
                ref={inspectorPanelRef}
                defaultSize={30}
                minSize={20}
                collapsedSize={0}
                collapsible
                onCollapse={() => setIsInspectorCollapsed(true)}
                onExpand={() => setIsInspectorCollapsed(false)}
              >
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
                  organizationName={tenantName}
                />
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

type SupportMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  contactId?: Id<"contacts">;
};

function ConversationTranscript({
  organizationId,
  sessionId,
}: {
  organizationId: Id<"organizations">;
  sessionId: string;
}) {
  const messages = (useQuery(api.plugins.support.queries.listMessages, {
    organizationId,
    sessionId,
  }) ?? []) as SupportMessage[];

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No messages yet for this conversation.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6">
      {messages.map((message) => (
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
      ))}
    </div>
  );
}
