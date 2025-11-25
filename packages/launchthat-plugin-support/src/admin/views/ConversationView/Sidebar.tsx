"use client";

import { MessageSquare } from "lucide-react";

import {
  Label,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@acme/ui/index";

import type { ConversationSummary } from "../../components/ConversationInspector";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeSessionId,
  onSelect,
}: ConversationSidebarProps) {
  return (
    <Sidebar collapsible="none" className="hidden w-[350px] border-r md:flex">
      <Tabs>
        <SidebarHeader className="gap-2 border-b p-0">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex w-full flex-col justify-between gap-3">
              <div className="text-base font-medium text-foreground">
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
            <TabsTrigger value="mine" className="rounded-none">
              Mine
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="rounded-none">
              Unassigned
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-none">
              All
            </TabsTrigger>
          </TabsList>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="max-h-[calc(100vh-340px)] overflow-y-scroll px-0">
            <SidebarGroupContent className="overflow-y-scroll">
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
                      onClick={() => onSelect(conversation.sessionId)}
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
      </Tabs>
    </Sidebar>
  );
}
