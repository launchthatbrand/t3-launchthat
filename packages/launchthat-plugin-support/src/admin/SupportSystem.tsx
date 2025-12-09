"use client";

import type { GenericId as Id } from "convex/values";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";
import { AppSidebar } from "@acme/ui/layout/app-sidebar";
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
import { SettingsView } from "./views/SettingsView";

type NavHrefBuilder = (slug: string) => string;

const defaultNavHref: NavHrefBuilder = (slug) =>
  slug ? `/admin/support/${slug}` : "/admin/support";

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
  buildNavHref?: NavHrefBuilder;
}

const NAV_LINKS = [
  { label: "Dashboard", slug: "" },
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
  buildNavHref = defaultNavHref,
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
            buildNavHref={buildNavHref}
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
    buildNavHref,
  ]);
  return (
    <div className="flex flex-1 flex-col">
      <SidebarProvider
        className="flex h-auto min-h-auto flex-1 flex-col"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <header className="flex h-12 shrink-0 items-center justify-end gap-2 border-b px-4">
          <div className="w-full">
            <Tabs>
              <TabsList className="h-auto rounded-none">
                {NAV_LINKS.map((link) => {
                  const href = buildNavHref(link.slug ?? "");
                  const isActive = routeKey === (link.slug ?? "");
                  return (
                    <TabsTrigger
                      key={link.slug}
                      value={link.slug ?? ""}
                      asChild
                    >
                      <Link
                        href={href}
                        className={`bg-muted rounded-none px-4 py-1 text-sm font-medium ${
                          isActive
                            ? "bg-primary"
                            : "text-muted-foreground hover:bg-muted/80"
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
        <div className="relative flex w-full flex-1">
          {routeKey === "conversations" && (
            <ConversationLeftSidebar
              conversations={conversations}
              activeSessionId={testSessionId}
              onSelect={updateTestSessionId}
              className="h-auto"
            />
          )}
          <SidebarInset className="INSET relative">{content}</SidebarInset>
          {routeKey === "conversations" && (
            <ConversationRightSidebar
              side="right"
              className="absolute h-auto"
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
        </div>
      </SidebarProvider>
    </div>
  );
}
