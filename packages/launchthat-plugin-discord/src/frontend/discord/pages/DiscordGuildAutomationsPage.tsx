"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui";

import type { DiscordGuildSettingsPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type AutomationRow = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: any;
  conditions?: any;
  action: any;
  updatedAt?: number;
};

const triggerLabel = (trigger: any): string => {
  const t = trigger?.type;
  const cfg = trigger?.config ?? {};
  if (t === "schedule") {
    const everyMinutes = typeof cfg?.everyMinutes === "number" ? cfg.everyMinutes : 60;
    if (everyMinutes % (24 * 60) === 0) return `Every ${Math.max(1, Math.floor(everyMinutes / (24 * 60)))} day(s)`;
    if (everyMinutes % 60 === 0) return `Every ${Math.max(1, Math.floor(everyMinutes / 60))} hour(s)`;
    return `Every ${Math.max(1, Math.floor(everyMinutes))} minute(s)`;
  }
  if (t === "event") {
    const sym =
      typeof cfg?.filter?.symbol === "string" ? String(cfg.filter.symbol).trim().toUpperCase() : "";
    return sym ? `Trade happens on ${sym}` : "Trade happens";
  }
  return "—";
};

const actionLabel = (action: any): string => {
  if (action?.type !== "send_message") return "—";
  const cfg = action?.config ?? {};
  const channelId = typeof cfg?.channelId === "string" ? cfg.channelId.trim() : "";
  return channelId ? "Send Discord message" : "Send Discord message (incomplete)";
};

export function DiscordGuildAutomationsPage({
  api,
  organizationId,
  guildId,
  basePath,
  className,
  ui,
}: DiscordGuildSettingsPageProps & { guildId: string }) {
  const automations = useQuery(api.queries.listAutomations ?? "skip", {
    ...(organizationId ? { organizationId } : {}),
    guildId,
  }) as AutomationRow[] | undefined;

  const createAutomation = useMutation(api.mutations.createAutomation ?? "skip");
  const updateAutomation = useMutation(api.mutations.updateAutomation ?? "skip");

  const goTo = (segments: string[]) => {
    const root = (basePath ?? "").replace(/\/$/, "");
    const url = `${root}/${segments.map(encodeURIComponent).join("/")}`;
    window.location.href = url;
  };

  const handleNew = async () => {
    if (!api.mutations.createAutomation) {
      toast.error("Automations are not enabled in this host app yet.");
      return;
    }
    try {
      const id = await createAutomation({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        name: "New automation",
        enabled: false,
        trigger: { type: "schedule", config: { kind: "interval", everyMinutes: 60 } },
        conditions: { marketOpen: true },
        action: { type: "send_message", config: {} },
      });
      goTo(["automations", String(id)]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create automation.");
    }
  };

  const handleToggleEnabled = async (row: AutomationRow, next: boolean) => {
    if (!api.mutations.updateAutomation) return;
    try {
      await updateAutomation({
        ...(organizationId ? { organizationId } : {}),
        automationId: row.id,
        enabled: next,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update automation.");
    }
  };

  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div className={cx("mb-6", ui?.headerClassName)}>
        <h2 className={cx("text-foreground text-2xl font-semibold", ui?.titleClassName)}>
          Automations
        </h2>
        <p className={cx("text-muted-foreground text-sm", ui?.descriptionClassName)}>
          Zapier-like rules: choose a trigger, add conditions, then configure an action.
        </p>
      </div>

      <Card className={ui?.cardClassName}>
        <CardHeader className={cx("flex-row items-center justify-between", ui?.cardHeaderClassName)}>
          <CardTitle className={ui?.cardTitleClassName}>Saved automations</CardTitle>
          <Button className={ui?.buttonClassName} onClick={() => void handleNew()}>
            New automation
          </Button>
        </CardHeader>
        <CardContent className={cx("space-y-4", ui?.cardContentClassName)}>
          <EntityList
            title=""
            description=""
            data={(automations ?? []) as AutomationRow[]}
            className={ui?.listClassName}
            columns={[
              {
                id: "name",
                header: "Automation",
                accessorKey: "name",
                cell: (row: AutomationRow) => (
                  <div>
                    <div className="text-foreground text-sm font-medium">
                      {row.name || "Untitled automation"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {triggerLabel(row.trigger)} • {actionLabel(row.action)}
                    </div>
                  </div>
                ),
              },
              {
                id: "enabled",
                header: "Enabled",
                accessorKey: "enabled",
                cell: (row: AutomationRow) => (
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant="secondary" className={ui?.badgeClassName}>
                      {row.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={Boolean(row.enabled)}
                      onCheckedChange={(v) => void handleToggleEnabled(row, Boolean(v))}
                    />
                  </div>
                ),
              },
            ]}
            enableSearch
            getRowId={(row: any) => String(row.id)}
            onRowClick={(row: any) => {
              const id = String((row as any)?.id ?? "");
              if (!id) return;
              goTo(["automations", id]);
            }}
            emptyState={
              <div className={cx("text-muted-foreground rounded-lg border border-dashed p-6 text-sm", ui?.emptyStateClassName)}>
                <div className="font-medium text-foreground mb-1">No automations yet</div>
                <div className="text-muted-foreground">Click “New automation” to create your first one.</div>
              </div>
            }
          />

          <div className="pt-2">
            <Label className="text-muted-foreground text-xs">
              Tip: disable an automation until its action is fully configured.
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

