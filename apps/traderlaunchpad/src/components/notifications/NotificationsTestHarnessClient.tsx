"use client";

import * as React from "react";

import { useMutation } from "convex/react";
import { useConvexAuth, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@convex-config/_generated/api";

import {
  buildTraderLaunchpadNotificationCatalog,
  type TraderLaunchpadNotificationEventDefinition,
  type TraderLaunchpadNotificationSinkId,
} from "~/lib/notifications/notificationCatalog";

type HarnessResult = {
  inAppInserted: boolean;
  emailAttempted: boolean;
  emailSucceeded: boolean;
  discordAttempted: boolean;
  discordSucceeded: boolean;
  errors: Array<string>;
};

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

interface TenantSessionUser {
  organizationId?: string | null;
}

interface TenantMeResponse {
  user: TenantSessionUser | null;
}

export function NotificationsTestHarnessClient() {
  return <NotificationsTestHarnessClientInner />;
}

function NotificationsTestHarnessClientInner() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const sendTest = useMutation(api.notifications.test.sendTestNotificationToUser);
  const ensureUser = useMutation(api.coreTenant.mutations.createOrGetUser as any);

  React.useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    void ensureUser({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const [me, setMe] = React.useState<TenantMeResponse | null>(null);
  const [isMeLoading, setIsMeLoading] = React.useState(true);
  const inFlightRef = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          headers: { "content-type": "application/json", "cache-control": "no-store" },
          cache: "no-store",
        });
        if (!res.ok) {
          setMe({ user: null });
          return;
        }
        const json: unknown = await res.json();
        if (json && typeof json === "object" && "user" in json) {
          setMe(json as TenantMeResponse);
        } else {
          setMe({ user: null });
        }
      } catch {
        setMe({ user: null });
      } finally {
        setIsMeLoading(false);
        inFlightRef.current = false;
      }
    })();
  }, [isAuthenticated, authLoading]);

  const orgId = React.useMemo(() => {
    const org = me?.user?.organizationId;
    return typeof org === "string" ? org : null;
  }, [me]);

  const emailSettings = useQuery(
    api.email.queries.getEmailSettings,
    orgId ? { orgId } : "skip",
  ) as unknown;
  const emailDomain = useQuery(
    api.email.queries.getEmailDomain,
    orgId ? { orgId } : "skip",
  ) as unknown;

  const emailAvailable = React.useMemo(() => {
    if (!isRecord(emailSettings)) return false;
    if (emailSettings.enabled !== true) return false;
    const fromMode = emailSettings.fromMode;
    if (fromMode === "portal") return true;
    if (fromMode !== "custom") return false;
    if (!isRecord(emailDomain)) return false;
    return emailDomain.status === "verified";
  }, [emailSettings, emailDomain]);

  const catalog = React.useMemo(() => buildTraderLaunchpadNotificationCatalog(), []);
  const catalogByKey = React.useMemo(() => {
    const byKey = new Map<string, TraderLaunchpadNotificationEventDefinition>();
    for (const item of catalog) byKey.set(item.eventKey, item);
    return byKey;
  }, [catalog]);

  const [eventKey, setEventKey] = React.useState<string>(
    catalog[0]?.eventKey ?? "traderlaunchpad.system.test",
  );
  const selected = catalogByKey.get(eventKey) ?? null;

  const [title, setTitle] = React.useState(selected?.defaultTitle ?? "Test notification");
  const [content, setContent] = React.useState(selected?.defaultContent ?? "This is a test.");
  const [actionUrl, setActionUrl] = React.useState(selected?.defaultActionUrl ?? "/platform");
  const [respectPreferences, setRespectPreferences] = React.useState(false);
  const [sinkIds, setSinkIds] = React.useState<TraderLaunchpadNotificationSinkId[]>(
    selected?.defaultSinkIds ?? ["inApp", "email"],
  );

  const [isSending, setIsSending] = React.useState(false);
  const [result, setResult] = React.useState<HarnessResult | null>(null);

  React.useEffect(() => {
    // If email becomes unavailable, remove it from selection.
    if (!emailAvailable) {
      setSinkIds((prev) => prev.filter((s) => s !== "email"));
    } else {
      setSinkIds((prev) => (prev.includes("email") ? prev : [...prev, "email"]));
    }
  }, [emailAvailable]);

  React.useEffect(() => {
    // When changing the selected event, reset the prefill fields to the catalog defaults.
    if (!selected) return;
    setTitle(selected.defaultTitle);
    setContent(selected.defaultContent ?? "");
    setActionUrl(selected.defaultActionUrl ?? "");
    setSinkIds(selected.defaultSinkIds);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKey]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = (await sendTest({
        eventKey,
        title,
        content: content.trim() ? content : undefined,
        actionUrl: actionUrl.trim() ? actionUrl : undefined,
        mode: respectPreferences ? "respectPreferences" : "forceAll",
        sinkIds,
      })) as HarnessResult;
      setResult(res);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Send test notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!shouldQuery ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !orgId ? (
            <div className="text-sm text-muted-foreground">
              No active organization found for your user.
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="eventKey">Event key</Label>
              <Select value={eventKey} onValueChange={setEventKey}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select event..." />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((ev) => (
                    <SelectItem key={ev.eventKey} value={ev.eventKey}>
                      {ev.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected?.description ? (
                <div className="text-muted-foreground text-xs">{selected.description}</div>
              ) : null}
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test notification"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="This is a test."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="actionUrl">Link (optional)</Label>
              <Input
                id="actionUrl"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/platform/settings/notifications"
              />
            </div>
          </div>

          <Card className="border-dashed">
            <CardHeader className="py-4">
              <CardTitle className="text-base">Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">In-app</div>
                  <div className="text-muted-foreground text-xs">
                    Always available for signed-in users.
                  </div>
                </div>
                <Switch
                  checked={sinkIds.includes("inApp")}
                  onCheckedChange={(checked) =>
                    setSinkIds((prev) =>
                      checked ? Array.from(new Set([...prev, "inApp"])) : prev.filter((s) => s !== "inApp"),
                    )
                  }
                  aria-label="Toggle in-app sink"
                />
              </div>

              {emailAvailable ? (
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-muted-foreground text-xs">
                      Available because email settings are configured for this organization.
                    </div>
                  </div>
                  <Switch
                    checked={sinkIds.includes("email")}
                    onCheckedChange={(checked) =>
                      setSinkIds((prev) =>
                        checked
                          ? Array.from(new Set([...prev, "email"]))
                          : prev.filter((s) => s !== "email"),
                      )
                    }
                    aria-label="Toggle email sink"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Respect preferences</div>
              <div className="text-muted-foreground text-xs">
                If enabled, email may be skipped when preferences are unknown.
              </div>
            </div>
            <Switch
              checked={respectPreferences}
              onCheckedChange={setRespectPreferences}
              aria-label="Respect preferences"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !shouldQuery || !orgId || sinkIds.length === 0}
            >
              {isSending ? "Sending..." : "Send test to me"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <span className="font-medium">In-app inserted:</span>{" "}
                {String(result.inAppInserted)}
              </div>
              <div>
                <span className="font-medium">Email attempted:</span>{" "}
                {String(result.emailAttempted)}
              </div>
              <div>
                <span className="font-medium">Email succeeded:</span>{" "}
                {String(result.emailSucceeded)}
              </div>
            </div>
            {result.errors.length > 0 ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
                <div className="mb-1 font-medium">Errors</div>
                <ul className="list-disc pl-5">
                  {result.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-muted-foreground">No errors reported.</div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

