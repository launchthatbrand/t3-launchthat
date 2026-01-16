"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

export function DiscordAuditPage({ className }: DiscordPageProps) {
  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Audit log</h2>
        <p className="text-sm text-muted-foreground">
          Review recent Discord API activity and delivery attempts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No audit entries yet. Activity will appear after the first sync.</p>
          <ul className="list-disc pl-5">
            <li>Trade idea messages posted</li>
            <li>Role sync operations</li>
            <li>Bot install events</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
