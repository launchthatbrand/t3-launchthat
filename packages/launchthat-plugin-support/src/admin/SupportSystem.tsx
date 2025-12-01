"use client";

import type { GenericId as Id } from "convex/values";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@acme/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type {
  ContactDoc,
  ConversationSummary,
} from "./components/ConversationInspector";
import { ConversationLeftSidebar } from "./components/ConversationLeftSidebar";
import { ConversationRightSidebar } from "./components/ConversationRightSidebar";
import { useSupportConversations } from "./hooks/useSupportConversations";
import { ArticlesView } from "./views/ArticlesView";
import { TestView } from "./views/ConversationsView";
import { DashboardView } from "./views/DashboardView";
import { ResponsesView } from "./views/ResponsesView";
import { SettingsView } from "./views/SettingsView";

export interface SupportSystemProps {
  organizationId: Id<"organizations">;
  tenantName?: string;
  params?: { segments?: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
  currentAgent?: {
    id: string;
    name?: string;
    imageUrl?: string;
  };
}

const NAV_LINKS = [
  { label: "Dashboard", slug: "" },
  { label: "Canned responses", slug: "responses" },
  { label: "Articles", slug: "articles" },
  { label: "Conversations", slug: "conversations" },
  { label: "Settings", slug: "settings" },
];

export function SupportSystem({
  organizationId,
  tenantName,
  params,
  searchParams,
  currentAgent,
}: SupportSystemProps) {
  const segments = params?.segments ?? [];
  const routeKey = segments[0] ?? "";
  const sessionIdParam = searchParams?.sessionId;
  const initialSessionId =
    typeof sessionIdParam === "string" ? sessionIdParam : undefined;

  const conversations = useSupportConversations(organizationId, 100);
  const [testSessionId, setTestSessionId] = useState<string | undefined>(
    initialSessionId,
  );
  const [sidebarConversation, setSidebarConversation] = useState<
    ConversationSummary | undefined
  >(undefined);
  const [sidebarContact, setSidebarContact] = useState<ContactDoc | null>(null);

  const handleConversationChange = useCallback(
    (conversation?: ConversationSummary, contact?: ContactDoc | null) => {
      setSidebarConversation(conversation);
      setSidebarContact(contact ?? null);
    },
    [],
  );

  const updateTestSessionId = useCallback(
    (next?: string) => {
      setTestSessionId(next);
      if (routeKey !== "test" || typeof window === "undefined") {
        return;
      }

      const url = new URL(window.location.href);
      if (next) {
        url.searchParams.set("sessionId", next);
      } else {
        url.searchParams.delete("sessionId");
      }
      window.history.replaceState(null, "", url.toString());
    },
    [routeKey],
  );

  useEffect(() => {
    if (routeKey === "test" && !testSessionId && conversations.length > 0) {
      updateTestSessionId(conversations[0]?.sessionId);
    }
  }, [routeKey, conversations, testSessionId, updateTestSessionId]);

  useEffect(() => {
    if (routeKey !== "conversations" && routeKey !== "test") {
      setSidebarConversation(undefined);
      setSidebarContact(null);
    }
  }, [routeKey]);

  const content = useMemo(() => {
    switch (routeKey) {
      case "responses":
        return <ResponsesView organizationId={organizationId} />;
      case "conversations":
        return (
          <TestView
            organizationId={organizationId}
            tenantName={tenantName}
            conversations={conversations}
            activeSessionId={testSessionId}
            onConversationChange={handleConversationChange}
          />
        );
      case "settings":
        return <SettingsView organizationId={organizationId} />;
      case "articles":
        return <ArticlesView organizationId={organizationId} />;
      case "test":
        return (
          <TestView
            organizationId={organizationId}
            tenantName={tenantName}
            conversations={conversations}
            activeSessionId={testSessionId}
            onConversationChange={handleConversationChange}
          />
        );
      default:
        return (
          <DashboardView
            organizationId={organizationId}
            tenantName={tenantName}
          />
        );
    }
  }, [
    routeKey,
    organizationId,
    tenantName,
    conversations,
    testSessionId,
    handleConversationChange,
  ]);
  return (
    <SidebarProvider className="SIDEBAR_PROVIDER relative max-h-[calc(100vh-56px)] min-h-0 flex-1 overflow-hidden bg-red-500">
      {routeKey === "conversations" && (
        <ConversationLeftSidebar
          conversations={conversations}
          activeSessionId={testSessionId}
          onSelect={updateTestSessionId}
        />
      )}
      <SidebarInset className="h-full overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-end gap-2 border-b px-4">
          <div>
            <Tabs>
              <TabsList className="h-auto rounded-none">
                {NAV_LINKS.map((link) => {
                  const href = link.slug
                    ? `/admin/support/${link.slug}`
                    : "/admin/support";
                  const isActive = routeKey === (link.slug ?? "");
                  return (
                    <TabsTrigger key={link.slug} value={link.slug} asChild>
                      <Link
                        href={href}
                        className={`rounded-none px-4 py-1 text-sm font-medium ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
          <SidebarTrigger className="-mr-1 rotate-180" />
        </header>
        {content}
      </SidebarInset>
      {routeKey === "conversations" && (
        <ConversationRightSidebar
          side="right"
          className="absolute"
          conversation={sidebarConversation}
          contact={sidebarContact}
          fallbackName={
            sidebarConversation?.contactName ??
            (sidebarConversation
              ? `Session ${sidebarConversation.sessionId.slice(-6)}`
              : undefined)
          }
          fallbackEmail={sidebarConversation?.contactEmail}
          organizationName={tenantName}
          organizationId={organizationId}
          currentAgent={currentAgent}
        />
      )}
    </SidebarProvider>
    // <div className="bg-background flex flex-1 flex-col">
    //   <header className="bg-card border-b">
    //     <div className="mx-auto mt-5 flex flex-wrap items-center justify-between gap-4 p-0">
    //       <div className="flex items-center justify-between gap-4">
    //         <div className="space-y-1">
    //           {/* <p className="text-muted-foreground text-xs uppercase">
    //             Support assistant
    //           </p>
    //           <div className="flex flex-wrap items-center gap-3">
    //             <h1 className="text-xl font-semibold">
    //               {tenantName ?? "Organization"}
    //             </h1>
    //           </div> */}
    //         </div>
    //         <Tabs>
    //           <TabsList className="h-auto rounded-none pb-0">
    //             {NAV_LINKS.map((link) => {
    //               const href = link.slug
    //                 ? `/admin/support/${link.slug}`
    //                 : "/admin/support";
    //               const isActive = routeKey === (link.slug ?? "");
    //               return (
    //                 <TabsTrigger key={link.slug} value={link.slug} asChild>
    //                   <Link
    //                     href={href}
    //                     className={`rounded-none px-4 py-1 text-sm font-medium ${
    //                       isActive
    //                         ? "bg-primary text-primary-foreground"
    //                         : "bg-muted text-muted-foreground hover:bg-muted/80"
    //                     }`}
    //                   >
    //                     {link.label}
    //                   </Link>
    //                 </TabsTrigger>
    //               );
    //             })}
    //           </TabsList>
    //         </Tabs>
    //       </div>
    //     </div>
    //   </header>
    //   <main className="h-full w-full flex-1">{content}</main>
    // </div>
  );
}
