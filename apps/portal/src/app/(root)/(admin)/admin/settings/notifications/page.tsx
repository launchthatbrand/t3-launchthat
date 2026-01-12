"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { LogEntityList } from "launchthat-plugin-logs/admin";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import { useTenant } from "~/context/TenantContext";
import { useConvexUser } from "~/hooks/useConvexUser";
import {
  buildNotificationEventCatalog,
  groupCatalogByCategory,
} from "~/lib/notifications/notificationCatalog";

export default function AdminNotificationSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user: convexUser } = useConvexUser();
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;

  const convexUserDoc = convexUser as Doc<"users"> | null | undefined;

  const searchParamsString = searchParams.toString();
  const activeTab = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const requested = params.get("tab") ?? "manual";
    if (
      requested !== "defaults" &&
      requested !== "manual" &&
      requested !== "logs"
    ) {
      return "manual";
    }
    return requested;
  }, [searchParamsString]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParamsString);
      if (!value || value === "manual") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      router.replace(
        params.toString()
          ? `/admin/settings/notifications?${params.toString()}`
          : "/admin/settings/notifications",
      );
    },
    [router, searchParamsString],
  );

  const catalog = useMemo(() => buildNotificationEventCatalog(), []);
  const grouped = useMemo(() => groupCatalogByCategory(catalog), [catalog]);

  const orgDefaults = useQuery(
    api.core.notifications.settings.getOrgDefaults,
    orgId ? { orgId } : "skip",
  ) as
    | {
        inAppDefaults?: Record<string, boolean>;
        emailDefaults?: Record<string, boolean>;
      }
    | null
    | undefined;

  const setOrgDefaults = useMutation(
    api.core.notifications.settings.setOrgDefaults,
  );
  const sendTest = useAction(
    api.core.notifications.test.sendTestNotificationToUser,
  );
  const createBroadcast = useMutation(
    api.core.notifications.broadcasts.createManualBroadcast,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const catalogOptions = useMemo(
    () => catalog.map((c) => ({ key: c.eventKey, label: c.label })),
    [catalog],
  );
  const [testEventKey, setTestEventKey] = useState<string>(
    "lms.course.stepAdded",
  );
  const [testTitle, setTestTitle] = useState<string>("Test notification");
  const [testContent, setTestContent] = useState<string>("This is a test.");
  const [testActionUrl, setTestActionUrl] = useState<string>(
    "/account?tab=notifications",
  );

  const [broadcastTitle, setBroadcastTitle] = useState<string>("Announcement");
  const [broadcastContent, setBroadcastContent] = useState<string>("");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState<string>("");
  const [broadcastSinkIds, setBroadcastSinkIds] = useState<
    Record<string, boolean>
  >({
    inApp: true,
    email: true,
    "discord.announcements": false,
  });

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
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to schedule broadcast",
      );
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                Broadcast a manual notification to your organization’s members.
                Choose which delivery sinks to use.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
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
                        setBroadcastSinkIds((prev) => ({
                          ...prev,
                          inApp: Boolean(checked),
                        }))
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
                        setBroadcastSinkIds((prev) => ({
                          ...prev,
                          email: Boolean(checked),
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <div className="text-sm">Discord announcements</div>
                    </div>
                    <Switch
                      checked={Boolean(
                        broadcastSinkIds["discord.announcements"],
                      )}
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
                  Note: per-user delivery still respects user overrides where
                  applicable.
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
                Sends a single test notification to your current admin user. It
                will: create an in-app notification, send an email, and attempt
                to post to the configured Discord announcements channel.
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
                  <Input
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                  />
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
          {orgId && convexUserDoc?._id ? (
            <LogEntityList
              orgId={orgId}
              actorUserId={convexUserDoc._id}
              listLogsQuery={api.core.logs.queries.listLogsForOrg}
              listEmailSuggestionsQuery={
                api.core.logs.queries.listEmailSuggestionsForOrg
              }
              title="Notification logs"
              description="Unified notifications delivery logs (manual / test / automated)."
              limit={200}
              initialPluginKey="notifications"
              hidePluginFilter
            />
          ) : null}
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
                    const defaultValue =
                      stored ?? item.defaultInAppEnabled ?? true;

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
