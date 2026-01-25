"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import type { DiscordChannelsPageProps, DiscordChannelField } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

const defaultFields: DiscordChannelField[] = [
  {
    key: "announcementChannelId",
    label: "Announcements channel ID",
    description: "Where org announcements are posted in this guild.",
    placeholder: "e.g. 1234567890",
  },
  {
    key: "mentorTradesChannelId",
    label: "Mentor trades channel ID",
    description: "Trade feed for mentors (or premium members).",
    placeholder: "e.g. 1234567890",
  },
  {
    key: "memberTradesChannelId",
    label: "Member trades channel ID",
    description: "Trade feed for members (general).",
    placeholder: "e.g. 1234567890",
  },
  {
    key: "supportForumChannelId",
    label: "Support forum channel ID",
    description: "Forum channel used for support threads (if enabled).",
    placeholder: "e.g. 1234567890",
  },
];

export function DiscordGuildChannelsPage(props: DiscordChannelsPageProps & { guildId: string }) {
  const fields = React.useMemo(() => {
    if (Array.isArray(props.channelFields) && props.channelFields.length > 0) {
      return props.channelFields;
    }
    return defaultFields;
  }, [props.channelFields]);

  const settings = useQuery(props.api.queries.getGuildSettings, {
    ...(props.organizationId ? { organizationId: props.organizationId } : {}),
    guildId: props.guildId,
  });
  const upsertGuildSettings = useMutation(props.api.mutations.upsertGuildSettings);

  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const raw = (settings as any)?.[field.key];
      next[field.key] = typeof raw === "string" ? raw : "";
    }
    setValues(next);
  }, [fields, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist via guildSettings (plugin-owned) so every app can reuse the same storage.
      // We preserve all existing fields and only override the ones we’re editing here.
      await upsertGuildSettings({
        ...(props.organizationId ? { organizationId: props.organizationId } : {}),
        guildId: props.guildId,
        inviteUrl: (settings as any)?.inviteUrl ?? undefined,
        approvedMemberRoleId: (settings as any)?.approvedMemberRoleId ?? undefined,
        supportAiEnabled: Boolean((settings as any)?.supportAiEnabled ?? true),
        supportForumChannelId: (settings as any)?.supportForumChannelId ?? undefined,
        supportPrivateIntakeChannelId: (settings as any)?.supportPrivateIntakeChannelId ?? undefined,
        supportStaffRoleId: (settings as any)?.supportStaffRoleId ?? undefined,
        escalationKeywords: (settings as any)?.escalationKeywords ?? undefined,
        escalationConfidenceThreshold:
          (settings as any)?.escalationConfidenceThreshold ?? undefined,
        threadReplyCooldownMs: (settings as any)?.threadReplyCooldownMs ?? undefined,
        supportAiDisabledMessageEnabled:
          (settings as any)?.supportAiDisabledMessageEnabled ?? undefined,
        supportAiDisabledMessageText: (settings as any)?.supportAiDisabledMessageText ?? undefined,
        courseUpdatesChannelId: (settings as any)?.courseUpdatesChannelId ?? undefined,
        announcementChannelId: (settings as any)?.announcementChannelId ?? undefined,
        announcementEventKeys: (settings as any)?.announcementEventKeys ?? undefined,
        mentorTradesChannelId: (settings as any)?.mentorTradesChannelId ?? undefined,
        memberTradesChannelId: (settings as any)?.memberTradesChannelId ?? undefined,
        mentorTradesTemplateId: (settings as any)?.mentorTradesTemplateId ?? undefined,
        memberTradesTemplateId: (settings as any)?.memberTradesTemplateId ?? undefined,
        ...Object.fromEntries(
          fields.map((field) => [
            field.key,
            values[field.key]?.trim() ? values[field.key].trim() : undefined,
          ]),
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cx(props.className, props.ui?.pageClassName)}>
      <div className={cx("mb-6", props.ui?.headerClassName)}>
        <h2 className={cx("text-foreground text-2xl font-semibold", props.ui?.titleClassName)}>
          Channels
        </h2>
        <p className={cx("text-muted-foreground text-sm", props.ui?.descriptionClassName)}>
          Map app events (trade feed, announcements, support) to specific Discord channels in this
          guild.
        </p>
      </div>

      <Card className={props.ui?.cardClassName}>
        <CardHeader className={props.ui?.cardHeaderClassName}>
          <CardTitle className={props.ui?.cardTitleClassName}>Channel mapping</CardTitle>
        </CardHeader>
        <CardContent className={cx("space-y-4", props.ui?.cardContentClassName)}>
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.description ? (
                <p className="text-muted-foreground text-xs">{field.description}</p>
              ) : null}
              <Input
                id={field.key}
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                placeholder={field.placeholder ?? "e.g. 1234567890"}
              />
            </div>
          ))}

          <div className="pt-2">
            <Button onClick={() => void handleSave()} disabled={saving} className={props.ui?.buttonClassName}>
              {saving ? "Saving..." : "Save channel mapping"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

