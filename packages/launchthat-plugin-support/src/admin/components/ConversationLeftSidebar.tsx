"use client";

import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";

import { cn } from "@acme/ui";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
} from "@acme/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { ConversationSummary } from "../components/ConversationInspector";
import { SUPPORT_COPY } from "../constants/supportCopy";

type SidebarFilter = "mine" | "unassigned" | "all";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
  className?: string;
}

export function ConversationLeftSidebar({
  conversations,
  activeSessionId,
  onSelect,
  className,
}: ConversationSidebarProps) {
  const [filter, setFilter] = useState<SidebarFilter>("all");

  const filteredConversations = useMemo(() => {
    switch (filter) {
      case "mine":
        return conversations.filter((conversation) => conversation.contactId);
      case "unassigned":
        return conversations.filter((conversation) => !conversation.contactId);
      default:
        return conversations;
    }
  }, [conversations, filter]);

  return (
    <Sidebar
      collapsible="none"
      className={cn("hidden border-r md:flex", className)}
    >
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as SidebarFilter)}
      >
        <SidebarHeader className="flex h-32 flex-col justify-between gap-1 border-b p-0">
          <div className="flex flex-col gap-1 p-4">
            <div className="flex w-full flex-col justify-between gap-3">
              <div className="text-foreground text-base font-medium">
                Conversations
              </div>
              {/* <Label className="flex items-center gap-2 text-sm">
                <span>Unreads</span>
                <Switch className="shadow-none" />
              </Label> */}
            </div>
            <SidebarInput placeholder="Search session ID…" />
          </div>
          <TabsList className="flex h-auto w-auto justify-start rounded-none p-0">
            <TabsTrigger value="mine" className="rounded-none text-xs">
              Mine
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="rounded-none text-xs">
              Unassigned
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-none text-xs">
              All
            </TabsTrigger>
          </TabsList>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="flex max-h-[90vh] flex-1 flex-col overflow-y-scroll">
              {filteredConversations?.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const isActive =
                    activeSessionId === conversation.sessionId ||
                    (!activeSessionId &&
                      filteredConversations[0]?.sessionId ===
                        conversation.sessionId);
                  return (
                    <button
                      key={conversation.sessionId}
                      type="button"
                      onClick={() => onSelect(conversation.sessionId)}
                      className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full flex-col gap-1 border-b p-4 text-left text-sm last:border-b-0 ${
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
                            <span className="text-muted-foreground text-[11px]">
                              {conversation.contactEmail}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground ml-auto text-xs">
                          {new Date(conversation.lastAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {conversation.lastMessage}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
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
                <div className="text-muted-foreground p-6 text-sm">
                  {SUPPORT_COPY.sidebar.emptyState}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
}
