"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo } from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";

import { ConversationsView } from "./views/ConversationsView";
import { DashboardView } from "./views/DashboardView";
import { ResponsesView } from "./views/ResponsesView";
import { SettingsView } from "./views/SettingsView";

export interface SupportSystemProps {
  organizationId: Id<"organizations">;
  tenantName?: string;
  params?: { segments?: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
}

const NAV_LINKS = [
  { label: "Dashboard", slug: "" },
  { label: "Responses", slug: "responses" },
  { label: "Conversations", slug: "conversations" },
  { label: "Settings", slug: "settings" },
];

export function SupportSystem({
  organizationId,
  tenantName,
  params,
  searchParams,
}: SupportSystemProps) {
  const segments = params?.segments ?? [];
  const routeKey = segments[0] ?? "";
  const sessionIdParam = searchParams?.sessionId;
  const initialSessionId =
    typeof sessionIdParam === "string" ? sessionIdParam : undefined;

  const content = useMemo(() => {
    switch (routeKey) {
      case "responses":
        return <ResponsesView organizationId={organizationId} />;
      case "conversations":
        return (
          <ConversationsView
            organizationId={organizationId}
            tenantName={tenantName}
            initialSessionId={initialSessionId}
            basePath="/admin/support/conversations"
          />
        );
      case "settings":
        return <SettingsView organizationId={organizationId} />;
      default:
        return (
          <DashboardView
            organizationId={organizationId}
            tenantName={tenantName}
          />
        );
    }
  }, [organizationId, routeKey, tenantName, initialSessionId]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">
                Support assistant
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold">
                  {tenantName ?? "Organization"}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {NAV_LINKS.map((link) => {
                const href = link.slug
                  ? `/admin/support/${link.slug}`
                  : "/admin/support";
                const isActive = routeKey === (link.slug ?? "");
                return (
                  <Link
                    key={link.slug}
                    href={href}
                    className={`rounded-full px-4 py-1 text-sm font-medium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/plugins">Plugin settings</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/support/conversations">
                View conversations
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="h-full w-full flex-1">{content}</main>
    </div>
  );
}
