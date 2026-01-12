"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { toast } from "sonner";

import { useTenant } from "~/context/TenantContext";
import { useConvexUser } from "~/hooks/useConvexUser";
import {
  buildNotificationEventCatalog,
  groupCatalogByCategory,
} from "~/lib/notifications/notificationCatalog";

import { Badge } from "@acme/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Bell, CheckCircle2, Clock, Mail, MessageSquare, XCircle } from "lucide-react";

type ManualBroadcastRow = {
  _id: string;
  createdAt: number;
  title: string;
  content?: string;
  actionUrl?: string;
  sinkIds: string[];
  status: "scheduled" | "running" | "complete" | "failed";
  sinkStatus?: Record<
    string,
    { status: "scheduled" | "running" | "complete" | "failed"; error?: string; sent?: number }
  >;
  inAppSent?: number;
  emailSent?: number;
};

const getStatusBadge = (status: ManualBroadcastRow["status"]) => {
  if (status === "complete") {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  }
  if (status === "running") {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" /> Running
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Clock className="h-3 w-3" /> Scheduled
    </Badge>
  );
};

const SinkIcons = (props: { row: ManualBroadcastRow }) => {
  const { row } = props;
  const sinks = row.sinkIds ?? [];
  const sinkStatus = row.sinkStatus ?? {};

  const render = (sinkId: string) => {
    const st = sinkStatus[sinkId]?.status ?? "scheduled";
    const className =
      st === "complete"
        ? "text-emerald-600"
        : st === "failed"
          ? "text-red-600"
          : st === "running"
            ? "text-amber-600"
            : "text-muted-foreground";

    const title =
      sinkId === "inApp"
        ? `In-app (${st})`
        : sinkId === "email"
          ? `Email (${st})`
          : sinkId === "discord.announcements"
            ? `Discord (${st})`
            : `${sinkId} (${st})`;

    const Icon =
      sinkId === "inApp"
        ? Bell
        : sinkId === "email"
          ? Mail
          : sinkId === "discord.announcements"
            ? MessageSquare
            : Bell;

    return (
      <span key={sinkId} className="inline-flex items-center gap-1">
        <Icon className={`h-4 w-4 ${className}`} title={title} />
        {sinkId === "email" && typeof row.emailSent === "number" ? (
          <span className="text-muted-foreground text-xs">{row.emailSent}</span>
        ) : null}
        {sinkId === "inApp" && typeof row.inAppSent === "number" ? (
          <span className="text-muted-foreground text-xs">{row.inAppSent}</span>
        ) : null}
      </span>
    );
  };

  return <div className="flex items-center gap-2">{sinks.map(render)}</div>;
};

export default function AdminNotificationSettingsPage() {
  const { user: convexUser } = useConvexUser();
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;

  const convexUserDoc = convexUser as Doc<"users"> | null | undefined;

  const catalog = useMemo(() => buildNotificationEventCatalog(), []);
  const grouped = useMemo(() => groupCatalogByCategory(catalog), [catalog]);

  const orgDefaults = useQuery(
    api.core.notifications.settings.getOrgDefaults,
    orgId ? { orgId } : "skip",
  ) as { inAppDefaults?: Record<string, boolean>; emailDefaults?: Record<string, boolean> } | null | undefined;

  const setOrgDefaults = useMutation(api.core.notifications.settings.setOrgDefaults);
  const sendTest = useAction(api.core.notifications.test.sendTestNotificationToUser);
  const createBroadcast = useMutation(api.core.notifications.broadcasts.createManualBroadcast);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const catalogOptions = useMemo(
    () => catalog.map((c) => ({ key: c.eventKey, label: c.label })),
    [catalog],
  );
  const [testEventKey, setTestEventKey] = useState<string>("lms.course.stepAdded");
  const [testTitle, setTestTitle] = useState<string>("Test notification");
  const [testContent, setTestContent] = useState<string>("This is a test.");
  const [testActionUrl, setTestActionUrl] = useState<string>("/account?tab=notifications");

  const [broadcastTitle, setBroadcastTitle] = useState<string>("Announcement");
  const [broadcastContent, setBroadcastContent] = useState<string>("");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState<string>("");
  const [broadcastSinkIds, setBroadcastSinkIds] = useState<Record<string, boolean>>({
    inApp: true,
    email: true,
    "discord.announcements": false,
  });

  const broadcastRows = useQuery(
    api.core.notifications.broadcasts.listManualBroadcastsForOrg,
    orgId && convexUserDoc?._id
      ? { orgId, actorUserId: convexUserDoc._id, limit: 50 }
      : "skip",
  ) as ManualBroadcastRow[] | null | undefined;

  const columns: ColumnDef<ManualBroadcastRow>[] = useMemo(
    () => [
      {
        id: "createdAt",
        header: "Time",
        cell: (row) => (
          <div className="text-sm">
            {typeof row.createdAt === "number"
              ? new Date(row.createdAt).toLocaleString()
              : ""}
          </div>
        ),
      },
      {
        id: "message",
        header: "Message",
        cell: (row) => (
          <div className="space-y-0.5">
            <div className="font-medium">{row.title}</div>
            {row.content ? (
              <div className="text-muted-foreground line-clamp-2 text-xs">
                {row.content}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "link",
        header: "Link",
        cell: (row) =>
          row.actionUrl ? (
            <Link
              href={row.actionUrl}
              className="text-primary max-w-[260px] truncate text-sm underline"
              target="_blank"
              rel="noreferrer"
            >
              {row.actionUrl}
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "sinks",
        header: "Sinks",
        cell: (row) => <SinkIcons row={row} />,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => getStatusBadge(row.status),
      },
    ],
    [],
  );

  const handleToggle = async (eventKey: string, enabled: boolean) => {
    if (!orgId || !convexUserDoc?._id) return;
    const next: Record<string, boolean> = {
      ...(orgDefaults?.inAppDefaults ?? {}),
      [eventKey]: enabled,
    };
    setIsSaving(true);
    try {
      await setOrgDefaults({
        orgId,
        actorUserId: convexUserDoc._id,
        inAppDefaults: next,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!orgId || !convexUserDoc?._id) return;
    setIsTesting(true);
    try {
      const result = await sendTest({
        orgId,
        actorUserId: convexUserDoc._id,
        eventKey: testEventKey,
        title: testTitle,
        content: testContent,
        actionUrl: testActionUrl,
        mode: "forceAll",
      });
      if (result.errors.length > 0) {
        toast.error(`Test sent with errors: ${result.errors.join(" | ")}`);
      } else {
        toast.success("Test notification sent");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to send test");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!orgId || !convexUserDoc?._id) return;
    const sinkIds = Object.entries(broadcastSinkIds)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([sinkId]) => sinkId);
    if (sinkIds.length === 0) {
      toast.error("Select at least one sink");
      return;
    }
    setIsBroadcasting(true);
    try {
      await createBroadcast({
        orgId,
        actorUserId: convexUserDoc._id,
        title: broadcastTitle,
        content: broadcastContent || undefined,
        actionUrl: broadcastActionUrl || undefined,
        sinkIds,
      });
      toast.success("Broadcast scheduled");
      setBroadcastContent("");
      setBroadcastActionUrl("");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to schedule broadcast");
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="mx-auto space-y-6">
      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
          <TabsTrigger value="manual">Manual send</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-muted-foreground">
                Broadcast a manual notification to your organization’s members. Choose which delivery sinks to use.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Message</Label>
                  <Textarea
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    rows={4}
                    placeholder="Write your announcement…"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Link (optional)</Label>
                  <Input
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    placeholder="/course/... or https://..."
                  />
                </div>
              </div>

              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">Delivery sinks</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <div className="text-sm">In-app</div>
                    </div>
                    <Switch
                      checked={Boolean(broadcastSinkIds.inApp)}
                      onCheckedChange={(checked) =>
                        setBroadcastSinkIds((prev) => ({ ...prev, inApp: Boolean(checked) }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <div className="text-sm">Email</div>
                    </div>
                    <Switch
                      checked={Boolean(broadcastSinkIds.email)}
                      onCheckedChange={(checked) =>
                        setBroadcastSinkIds((prev) => ({ ...prev, email: Boolean(checked) }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <div className="text-sm">Discord announcements</div>
                    </div>
                    <Switch
                      checked={Boolean(broadcastSinkIds["discord.announcements"])}
                      onCheckedChange={(checked) =>
                        setBroadcastSinkIds((prev) => ({
                          ...prev,
                          "discord.announcements": Boolean(checked),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="text-muted-foreground mt-2 text-xs">
                  Note: per-user delivery still respects user overrides where applicable.
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => void handleSendBroadcast()}
                  disabled={!orgId || !convexUserDoc || isBroadcasting}
                >
                  {isBroadcasting ? "Scheduling..." : "Send broadcast"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-muted-foreground">
                Sends a single test notification to your current admin user. It will: create an in-app notification, send an email, and attempt to post to the configured Discord announcements channel.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Event key</div>
                  <Input
                    value={testEventKey}
                    onChange={(e) => setTestEventKey(e.target.value)}
                    list="notification-event-keys"
                    placeholder="e.g. lms.course.stepAdded"
                  />
                  <datalist id="notification-event-keys">
                    {catalogOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Action URL</div>
                  <Input
                    value={testActionUrl}
                    onChange={(e) => setTestActionUrl(e.target.value)}
                    placeholder="/course/..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm font-medium">Title</div>
                  <Input value={testTitle} onChange={(e) => setTestTitle(e.target.value)} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-sm font-medium">Content</div>
                  <Textarea
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => void handleSendTest()}
                  disabled={!orgId || !convexUserDoc || isTesting}
                >
                  {isTesting ? "Sending..." : "Send test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6 space-y-4">
          <EntityList<ManualBroadcastRow>
            title="Manual notification logs"
            description="Broadcasts sent from the admin panel, with per-sink status."
            data={broadcastRows ?? []}
            columns={columns}
            isLoading={!broadcastRows}
            enableSearch
            enableFooter={false}
            viewModes={["list"]}
            defaultViewMode="list"
          />
        </TabsContent>

        <TabsContent value="defaults" className="mt-6 space-y-6">
          <div className="flex items-center justify-end">
            <Button variant="outline" disabled>
              Saved automatically
            </Button>
          </div>

          {Object.entries(grouped).map(([category, items]) => {
            if (!items.length) return null;
            return (
              <Card key={category} className="mb-4">
                <CardHeader>
                  <CardTitle className="capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => {
                    const stored = orgDefaults?.inAppDefaults?.[item.eventKey];
                    const defaultValue = stored ?? item.defaultInAppEnabled ?? true;

                    return (
                      <div
                        key={item.eventKey}
                        className="flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="font-medium">{item.label}</div>
                          {item.description ? (
                            <div className="text-muted-foreground text-sm">
                              {item.description}
                            </div>
                          ) : null}
                          <div className="text-muted-foreground mt-1 text-xs">
                            {item.pluginName}
                          </div>
                        </div>
                        <Switch
                          checked={!!defaultValue}
                          disabled={!orgId || !convexUserDoc || isSaving}
                          onCheckedChange={(checked) =>
                            void handleToggle(item.eventKey, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
