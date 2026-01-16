"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Textarea } from "@acme/ui/textarea";

import type { DiscordTemplatesPageProps } from "../types";

const defaultTemplate = [
  "**{{symbol}}** — **{{direction}}** — **{{status}}**",
  "Qty: `{{netQty}}`{{avgEntryPrice}}",
  "{{realizedPnl}}",
  "{{fees}}",
  "{{openedAt}}",
  "{{closedAt}}",
]
  .filter(Boolean)
  .join("\n");

export function DiscordTemplatesPage({
  api,
  organizationId,
  guildId,
  className,
}: DiscordTemplatesPageProps) {
  const templateRow = useQuery(api.queries.getTemplate, {
    ...(organizationId ? { organizationId } : {}),
    guildId,
    kind: "tradeidea",
  });
  const upsertTemplate = useMutation(api.mutations.upsertTemplate);
  const [value, setValue] = React.useState(defaultTemplate);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (templateRow?.template) {
      setValue(templateRow.template);
    }
  }, [templateRow?.template]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertTemplate({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        kind: "tradeidea",
        template: value,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Message templates
        </h2>
        <p className="text-sm text-muted-foreground">
          Customize how trade ideas appear in Discord.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade idea template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={8}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Tokens: {"{{symbol}}"} {"{{direction}}"} {"{{status}}"}{" "}
              {"{{netQty}}"}
            </span>
            <span>Last updated: {templateRow?.updatedAt ?? "—"}</span>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save template"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
