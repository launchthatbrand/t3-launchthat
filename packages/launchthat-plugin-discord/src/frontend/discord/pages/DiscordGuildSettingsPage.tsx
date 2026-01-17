"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

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

import type { DiscordGuildSettingsPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type SettingsFormState = {
  supportAiEnabled: boolean;
  mentorTradesChannelId: string;
  memberTradesChannelId: string;
  mentorTradesTemplateId: string;
  memberTradesTemplateId: string;
};

const defaultState: SettingsFormState = {
  supportAiEnabled: true,
  mentorTradesChannelId: "",
  memberTradesChannelId: "",
  mentorTradesTemplateId: "",
  memberTradesTemplateId: "",
};

export function DiscordGuildSettingsPage({
  api,
  organizationId,
  guildId,
  className,
  ui,
}: DiscordGuildSettingsPageProps) {
  const settings = useQuery(api.queries.getGuildSettings, {
    ...(organizationId ? { organizationId } : {}),
    guildId,
  });
  const templates = useQuery(api.queries.listTemplates, {
    ...(organizationId ? { organizationId } : {}),
    guildId,
    kind: "tradeidea",
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
      mentorTradesTemplateId: settings.mentorTradesTemplateId ?? "",
      memberTradesTemplateId: settings.memberTradesTemplateId ?? "",
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
        mentorTradesTemplateId: state.mentorTradesTemplateId || undefined,
        memberTradesTemplateId: state.memberTradesTemplateId || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div className="mb-6">
        <h2
          className={cx(
            "text-foreground text-2xl font-semibold",
            ui?.titleClassName,
          )}
        >
          Guild settings
        </h2>
        <p
          className={cx(
            "text-muted-foreground text-sm",
            ui?.descriptionClassName,
          )}
        >
          Configure trade routing and automation for this Discord guild.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={ui?.cardClassName}>
          <CardHeader className={ui?.cardHeaderClassName}>
            <CardTitle className={ui?.cardTitleClassName}>
              Trade feed routing
            </CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-4", ui?.cardContentClassName)}>
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
            <div className="space-y-2">
              <Label>Mentor trades template</Label>
              <Select
                value={state.mentorTradesTemplateId || "default"}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    mentorTradesTemplateId: value === "default" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use default</SelectItem>
                  {(templates ?? []).map((template: any) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name ?? "Untitled template"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member trades template</Label>
              <Select
                value={state.memberTradesTemplateId || "default"}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    memberTradesTemplateId: value === "default" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use default</SelectItem>
                  {(templates ?? []).map((template: any) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name ?? "Untitled template"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className={ui?.cardClassName}>
          <CardHeader className={ui?.cardHeaderClassName}>
            <CardTitle className={ui?.cardTitleClassName}>Support AI</CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-4", ui?.cardContentClassName)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-medium">
                  AI responses
                </p>
                <p className="text-muted-foreground text-xs">
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
        <Button
          onClick={handleSave}
          disabled={saving}
          className={ui?.buttonClassName}
        >
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
