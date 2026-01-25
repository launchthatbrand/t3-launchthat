"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export type NotificationsAnalyticsSummary = {
  fromCreatedAt: number;
  sent: {
    notifications: number;
    byEventKey: Array<{ eventKey: string; count: number }>;
  };
  interactions: {
    events: number;
    uniqueNotifications: number;
    uniqueUsers: number;
    byEventKey: Array<{ eventKey: string; count: number }>;
    byChannelAndType: Array<{ channel: string; eventType: string; count: number }>;
  };
};

const formatDateTime = (ms: number) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(ms));
  } catch {
    return "";
  }
};

export const NotificationsAnalytics = (props: {
  summary: NotificationsAnalyticsSummary | null | undefined;
  daysBack: number;
}) => {
  const summary = props.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Notifications analytics</h2>
        <p className="text-muted-foreground text-sm">
          Showing the last {props.daysBack} days{" "}
          {summary ? `(since ${formatDateTime(summary.fromCreatedAt)})` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.sent.notifications.toLocaleString() : "—"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.interactions.events.toLocaleString() : "—"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.interactions.uniqueUsers.toLocaleString() : "—"}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top event keys (sent)</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary || summary.sent.byEventKey.length === 0 ? (
              <div className="text-muted-foreground text-sm">No events yet.</div>
            ) : (
              <div className="divide-border divide-y">
                {summary.sent.byEventKey.map((row) => (
                  <div key={row.eventKey} className="flex items-center justify-between py-2">
                    <div className="font-mono text-sm">{row.eventKey}</div>
                    <div className="text-sm font-medium">{row.count.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top event keys (interactions)</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary || summary.interactions.byEventKey.length === 0 ? (
              <div className="text-muted-foreground text-sm">No events yet.</div>
            ) : (
              <div className="divide-border divide-y">
                {summary.interactions.byEventKey.map((row) => (
                  <div
                    key={row.eventKey}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="font-mono text-sm">{row.eventKey}</div>
                    <div className="text-sm font-medium">{row.count.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By channel + event type</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary || summary.interactions.byChannelAndType.length === 0 ? (
            <div className="text-muted-foreground text-sm">No events yet.</div>
          ) : (
            <div className="divide-border divide-y">
              {summary.interactions.byChannelAndType.map((row) => (
                <div
                  key={`${row.channel}:${row.eventType}`}
                  className="flex items-center justify-between py-2"
                >
                  <div className="text-sm">
                    <span className="font-mono">{row.channel || "—"}</span>{" "}
                    <span className="text-muted-foreground">/</span>{" "}
                    <span className="font-mono">{row.eventType || "—"}</span>
                  </div>
                  <div className="text-sm font-medium">{row.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

