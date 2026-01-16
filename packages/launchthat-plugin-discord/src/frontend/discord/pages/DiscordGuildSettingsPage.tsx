"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

import type { DiscordGuildSettingsPageProps } from "../types";

type SettingsFormState = {
  supportAiEnabled: boolean;
  mentorTradesChannelId: string;
  memberTradesChannelId: string;
};

const defaultState: SettingsFormState = {
  supportAiEnabled: true,
  mentorTradesChannelId: "",
  memberTradesChannelId: "",
};

export function DiscordGuildSettingsPage({
  api,
  organizationId,
  guildId,
  className,
}: DiscordGuildSettingsPageProps) {
  const settings = useQuery(api.queries.getGuildSettings, {
    ...(organizationId ? { organizationId } : {}),
    guildId,
  });
  const upsertGuildSettings = useMutation(api.mutations.upsertGuildSettings);
  const [state, setState] = React.useState<SettingsFormState>(defaultState);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!settings) return;
    setState({
      supportAiEnabled: settings.supportAiEnabled ?? true,
      mentorTradesChannelId: settings.mentorTradesChannelId ?? "",
      memberTradesChannelId: settings.memberTradesChannelId ?? "",
    });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertGuildSettings({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        supportAiEnabled: state.supportAiEnabled,
        approvedMemberRoleId: settings?.approvedMemberRoleId ?? undefined,
        supportForumChannelId: settings?.supportForumChannelId ?? undefined,
        supportPrivateIntakeChannelId:
          settings?.supportPrivateIntakeChannelId ?? undefined,
        supportStaffRoleId: settings?.supportStaffRoleId ?? undefined,
        escalationKeywords: settings?.escalationKeywords ?? undefined,
        escalationConfidenceThreshold:
          settings?.escalationConfidenceThreshold ?? undefined,
        threadReplyCooldownMs: settings?.threadReplyCooldownMs ?? undefined,
        supportAiDisabledMessageEnabled:
          settings?.supportAiDisabledMessageEnabled ?? undefined,
        supportAiDisabledMessageText:
          settings?.supportAiDisabledMessageText ?? undefined,
        courseUpdatesChannelId: settings?.courseUpdatesChannelId ?? undefined,
        announcementChannelId: settings?.announcementChannelId ?? undefined,
        announcementEventKeys: settings?.announcementEventKeys ?? undefined,
        mentorTradesChannelId: state.mentorTradesChannelId || undefined,
        memberTradesChannelId: state.memberTradesChannelId || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Guild settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure trade routing and automation for this Discord guild.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trade feed routing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mentorTradesChannelId">
                Mentor trades channel ID
              </Label>
              <Input
                id="mentorTradesChannelId"
                value={state.mentorTradesChannelId}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    mentorTradesChannelId: event.target.value,
                  }))
                }
                placeholder="e.g. 1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberTradesChannelId">
                Member trades channel ID
              </Label>
              <Input
                id="memberTradesChannelId"
                value={state.memberTradesChannelId}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    memberTradesChannelId: event.target.value,
                  }))
                }
                placeholder="e.g. 9876543210"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  AI responses
                </p>
                <p className="text-xs text-muted-foreground">
                  Toggle automated replies in support threads.
                </p>
              </div>
              <Switch
                checked={state.supportAiEnabled}
                onCheckedChange={(checked) =>
                  setState((prev) => ({
                    ...prev,
                    supportAiEnabled: checked,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
