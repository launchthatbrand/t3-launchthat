"use client";

import React from "react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

interface ViewerSettings {
  isSignedIn: boolean;
  isAdmin: boolean;
  dataMode: "demo" | "live";
}

interface TLGlobal {
  __tlPush?: {
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
  };
}

interface SendTestPushArgs {
  title?: string;
  body?: string;
  url?: string;
}

interface SendTestPushResult {
  ok: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

export default function AdminSettingsNotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const viewerSettings = useQuery(
    api.viewer.queries.getViewerSettings,
    shouldQuery ? {} : "skip",
  ) as ViewerSettings | undefined;

  const sendTestPush = useAction(api.pushSubscriptions.actions.sendTestPushToMe) as (
    args: SendTestPushArgs,
  ) => Promise<SendTestPushResult>;

  const [status, setStatus] = React.useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Push notifications</CardTitle>
          <CardDescription>
            Enable browser push notifications and send a test notification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-muted-foreground text-sm">
            Permission:{" "}
            {typeof Notification !== "undefined"
              ? Notification.permission
              : "unsupported"}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setStatus("");
                try {
                  const tl = globalThis as unknown as TLGlobal;
                  const ok = await tl.__tlPush?.subscribe();
                  setStatus(ok ? "Subscribed." : "Subscription not granted.");
                } catch {
                  setStatus("Failed to subscribe.");
                }
              }}
            >
              Enable notifications
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setStatus("");
                try {
                  const tl = globalThis as unknown as TLGlobal;
                  const ok = await tl.__tlPush?.unsubscribe();
                  setStatus(ok ? "Unsubscribed." : "Unsubscribe failed.");
                } catch {
                  setStatus("Failed to unsubscribe.");
                }
              }}
            >
              Disable notifications
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!viewerSettings?.isAdmin}
              onClick={async () => {
                setStatus("");
                try {
                  const res = await sendTestPush({
                    title: "Trader Launchpad",
                    body: "Test notification",
                    url: "/admin/settings/notifications",
                  });
                  setStatus(`Sent ${res.sent}, failed ${res.failed}.`);
                } catch {
                  setStatus(
                    "Failed to send test notification (check Convex env vars).",
                  );
                }
              }}
            >
              Send test notification (admin)
            </Button>
          </div>

          {status ? (
            <div className="text-muted-foreground text-sm">{status}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

