"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type {
  NotificationTabDefinition,
  NotificationsAdapter,
  NotificationsPaginationResult,
} from "./types";
import { NotificationRowCard } from "./NotificationRowCard";

export function NotificationsList(props: {
  adapter: NotificationsAdapter;
  clerkId?: string | null;
  orgId?: string | null;
}) {
  const { adapter } = props;
  const tabs =
    adapter.tabs.length > 0 ? adapter.tabs : [{ id: "all", label: "All" }];

  const [activeTabId, setActiveTabId] = React.useState<string>(tabs[0]?.id ?? "all");
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<any[]>([]);

  const activeTab: NotificationTabDefinition =
    tabs.find((t) => t.id === activeTabId) ?? tabs[0]!;

  const convexUser = adapter.api.queries.getUserByClerkId
    ? useQuery(
        adapter.api.queries.getUserByClerkId,
        props.clerkId ? { clerkId: props.clerkId } : "skip",
      )
    : undefined;

  const result = useQuery(
    adapter.api.queries.paginate,
    adapter.buildPaginateArgs({
      clerkId: props.clerkId ?? null,
      orgId: props.orgId ?? null,
      tabKey: activeTab.tabKey,
      cursor,
      numItems: 20,
    }) as any,
  ) as NotificationsPaginationResult | undefined;

  const markAsRead = useMutation(adapter.api.mutations.markAsRead);
  const markAllAsRead = useMutation(adapter.api.mutations.markAllAsRead);

  React.useEffect(() => {
    setCursor(null);
    setItems([]);
  }, [activeTabId]);

  React.useEffect(() => {
    if (!result) return;
    const page = Array.isArray(result.page) ? result.page : [];
    setItems((prev) => {
      const byId = new Map<string, any>();
      const base = cursor ? prev : [];
      for (const n of base) byId.set(String(n._id), n);
      for (const n of page) byId.set(String(n._id), n);
      return Array.from(byId.values());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.continueCursor, result?.isDone, result?.page]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId } as any);
      setItems((prev) =>
        prev.map((n) => (String(n._id) === notificationId ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("[notifications] markAsRead failed", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const args = adapter.buildMarkAllArgs({
      clerkId: props.clerkId ?? null,
      orgId: props.orgId ?? null,
      convexUser,
    });
    if (!args) return;
    try {
      await markAllAsRead(args as any);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("[notifications] markAllAsRead failed", err);
    }
  };

  const handleLoadMore = () => {
    if (!result || result.isDone) return;
    setCursor(result.continueCursor ?? null);
  };

  const handleNotificationClick = async (n: any) => {
    const id = String(n?._id ?? "");
    if (id && n?.read !== true) {
      await handleMarkAsRead(id);
    }
    const url = typeof n?.actionUrl === "string" ? n.actionUrl : null;
    if (url) window.location.href = url;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={activeTabId} onValueChange={setActiveTabId}>
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} />
          ))}
        </Tabs>

        <Button type="button" variant="outline" onClick={handleMarkAllAsRead}>
          Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {result === undefined ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/60">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-6 text-sm text-white/60">
            No notifications.
          </div>
        ) : (
          items.map((n) => (
            <NotificationRowCard
              key={String(n._id)}
              notification={n}
              onClick={() => void handleNotificationClick(n)}
            />
          ))
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleLoadMore}
        disabled={!result || result.isDone}
      >
        {result?.isDone ? "All caught up" : "Load more"}
      </Button>
    </div>
  );
}

