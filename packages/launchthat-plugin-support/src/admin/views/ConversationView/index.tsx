"use client";

import type { GenericId as Id } from "convex/values";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { ResizablePanel, ResizablePanelGroup } from "@acme/ui/index";

import type {
  ContactDoc,
  ConversationSummary,
} from "../../components/ConversationInspector";
import { ConversationHeader } from "../../components/ConversationHeader";
import { ConversationInspector } from "../../components/ConversationInspector";
import { CustomerDashboard } from "../CustomerDashboard";
import { ConversationSidebar } from "./Sidebar";
import { ConversationTranscript } from "./Transcript";

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

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.pathname = basePath;
      url.searchParams.set("sessionId", sessionId);
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    if (!showInspector) {
      setIsInspectorCollapsed(false);
      inspectorPanelRef.current?.expand();
    }
  }, [showInspector]);

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
      <ConversationSidebar
        conversations={conversations}
        activeSessionId={activeSessionId}
        onSelect={handleSelectConversation}
      />
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
              <div className="flex h-full">
                {selectedConversation ? (
                  <ConversationTranscript
                    organizationId={organizationId}
                    sessionId={selectedConversation.sessionId}
                    conversation={selectedConversation}
                    contact={resolvedContact}
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
