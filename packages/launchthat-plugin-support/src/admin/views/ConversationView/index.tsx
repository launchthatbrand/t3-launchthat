"use client";

import type { GenericId as Id } from "convex/values";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { ResizablePanel, ResizablePanelGroup } from "@acme/ui/resizable";

import type {
  ContactDoc,
  ConversationSummary,
} from "../../components/ConversationInspector";
import { ConversationHeader } from "../../components/ConversationHeader";
import { ConversationInspector } from "../../components/ConversationInspector";
import { SUPPORT_COPY } from "../../constants/supportCopy";
import { useSupportContact } from "../../hooks/useSupportContact";
import { useSupportConversations } from "../../hooks/useSupportConversations";
import { useSupportSessionState } from "../../hooks/useSupportSessionState";
import { CustomerDashboard } from "../CustomerDashboard";
import { ConversationSidebar } from "./Sidebar";
import { ConversationTranscript } from "./Transcript";

interface ConversationsViewProps {
  organizationId: Id<"organizations">;
  tenantName?: string;
  initialSessionId?: string;
  basePath: string;
  onConversationChange?: (
    conversation?: ConversationSummary,
    contact?: ContactDoc | null,
  ) => void;
}

const isContactId = (value: unknown): value is Id<"contacts"> =>
  typeof value === "string" && value.length > 0;

export function ConversationsView({
  organizationId,
  tenantName,
  initialSessionId,
  basePath,
  onConversationChange,
}: ConversationsViewProps) {
  const conversations = useSupportConversations(organizationId, 100);
  const { activeSessionId, handleSelectConversation } = useSupportSessionState(
    initialSessionId,
    basePath,
  );

  const [activeTab, setActiveTab] = useState<"messages" | "dashboard">(
    "messages",
  );

  const selectedConversation = useMemo(() => {
    if (!activeSessionId) {
      return undefined;
    }
    return conversations.find(
      (conversation) => conversation.sessionId === activeSessionId,
    );
  }, [activeSessionId, conversations]);

  const contact = useSupportContact(
    selectedConversation?.contactId &&
      isContactId(selectedConversation.contactId)
      ? (selectedConversation.contactId as Id<"contacts">)
      : undefined,
  );

  const resolvedContact = (contact ?? null) as ContactDoc | null;
  const showInspector = Boolean(selectedConversation);
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  useEffect(() => {
    if (!showInspector) {
      setIsInspectorCollapsed(false);
      inspectorPanelRef.current?.expand();
    }
  }, [showInspector]);

  useEffect(() => {
    onConversationChange?.(selectedConversation, resolvedContact);
  }, [onConversationChange, selectedConversation, resolvedContact]);

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
    <div className="bg-card flex h-full min-h-0">
      <ConversationSidebar
        conversations={conversations}
        activeSessionId={activeSessionId}
        onSelect={handleSelectConversation}
      />
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <ConversationHeader
          contact={resolvedContact}
          conversation={selectedConversation}
          tenantName={tenantName}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <ResizablePanelGroup
          direction="horizontal"
          className="flex h-full min-h-0 w-full flex-1 overflow-hidden md:min-w-[450px]"
        >
          <ResizablePanel
            defaultSize={showInspector ? 70 : 100}
            minSize={40}
            className="flex h-full min-h-0 overflow-hidden"
          >
            {activeTab === "messages" ? (
              <div className="flex h-full min-h-0 w-full overflow-hidden">
                {selectedConversation ? (
                  <ConversationTranscript
                    organizationId={organizationId}
                    sessionId={selectedConversation.sessionId}
                    conversation={selectedConversation}
                    contact={resolvedContact}
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full flex-1 items-center justify-center text-sm">
                    {SUPPORT_COPY.transcript.selectPrompt}
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
              <div className="relative flex h-full items-center">
                <button
                  type="button"
                  onClick={toggleInspector}
                  className="bg-background text-muted-foreground hover:text-foreground absolute top-10 -left-8 z-10 flex h-8 w-8 items-center justify-center rounded-md border shadow-sm transition"
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
                className="min-h-0 overflow-auto"
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
