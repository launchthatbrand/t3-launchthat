"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { PencilIcon } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { DiscordChannelSelect } from "../components";
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
};

export function DiscordGuildAutomationPage({
  api,
  organizationId,
  guildId,
  basePath,
  className,
  ui,
  automationId,
}: DiscordGuildSettingsPageProps & { guildId: string; automationId: string }) {
  const automations = useQuery(api.queries.listAutomations ?? "skip", {
    ...(organizationId ? { organizationId } : {}),
    guildId,
  }) as AutomationRow[] | undefined;

  const row = React.useMemo(
    () => (automations ?? []).find((a) => a.id === automationId) ?? null,
    [automationId, automations],
  );

  const listGuildChannels = useAction(api.actions.listGuildChannels);
  const [channels, setChannels] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loadingChannels, setLoadingChannels] = React.useState(false);

  const symbolOptions = useQuery(
    api.queries.listSymbolOptions ?? "skip",
    api.queries.listSymbolOptions
      ? { ...(organizationId ? { organizationId } : {}), limit: 500 }
      : "skip",
  ) as string[] | undefined;

  const refreshChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await listGuildChannels({
        ...(organizationId ? { organizationId } : {}),
        guildId,
      });
      const rows = Array.isArray(res) ? (res as any[]) : [];
      setChannels(
        rows
          .map((c) => ({ id: String(c?.id ?? ""), name: String(c?.name ?? "") }))
          .filter((c) => c.id && c.name),
      );
    } finally {
      setLoadingChannels(false);
    }
  };

  React.useEffect(() => {
    void refreshChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, organizationId]);

  const updateAutomation = useMutation(api.mutations.updateAutomation ?? "skip");

  const [step, setStep] = React.useState<"trigger" | "action">("trigger");

  const [name, setName] = React.useState("");
  const [enabled, setEnabled] = React.useState(false);

  const [triggerOption, setTriggerOption] = React.useState<"time_period" | "trade_symbol">(
    "time_period",
  );
  const [scheduleAmount, setScheduleAmount] = React.useState("1");
  const [scheduleUnit, setScheduleUnit] = React.useState<"minutes" | "hours" | "days">("hours");
  const [tradeSymbol, setTradeSymbol] = React.useState("");

  const [conditionOption, setConditionOption] = React.useState<"none" | "market_open" | "actor_org_admin">("none");

  const [targetChannelId, setTargetChannelId] = React.useState("");
  const [templateKind, setTemplateKind] = React.useState("tradeidea");
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [snapshotSymbol, setSnapshotSymbol] = React.useState("");
  const [contextProviderKey, setContextProviderKey] = React.useState("");
  const [contextProviderParams, setContextProviderParams] = React.useState("{}");

  const templatesForAutomation = useQuery(
    api.queries.listTemplates ?? "skip",
    api.queries.listTemplates
      ? {
          ...(organizationId ? { organizationId } : {}),
          guildId,
          kind: templateKind,
        }
      : "skip",
  ) as Array<{ _id: string; name?: string; scope?: "org" | "guild"; templateJson?: string }> | undefined;

  React.useEffect(() => {
    if (!row) return;
    setName(row.name ?? "");
    setEnabled(Boolean(row.enabled));

    const t = row.trigger as any;
    const cfg = t?.config ?? {};
    if (t?.type === "event") {
      setTriggerOption("trade_symbol");
      const sym =
        typeof cfg?.filter?.symbol === "string"
          ? String(cfg.filter.symbol).trim().toUpperCase()
          : "";
      setTradeSymbol(sym);
    } else {
      setTriggerOption("time_period");
      const everyMinutesNum = typeof cfg?.everyMinutes === "number" ? cfg.everyMinutes : 60;
      const m = Math.max(1, Math.floor(Number(everyMinutesNum) || 60));
      if (m % (24 * 60) === 0) {
        setScheduleUnit("days");
        setScheduleAmount(String(Math.max(1, Math.floor(m / (24 * 60)))));
      } else if (m % 60 === 0) {
        setScheduleUnit("hours");
        setScheduleAmount(String(Math.max(1, Math.floor(m / 60))));
      } else {
        setScheduleUnit("minutes");
        setScheduleAmount(String(m));
      }
    }

    const cond = row.conditions as any;
    if (cond?.marketOpen) setConditionOption("market_open");
    else if (cond?.actorRole === "admin") setConditionOption("actor_org_admin");
    else setConditionOption("none");

    const a = row.action as any;
    const acfg = a?.config ?? {};
    setTargetChannelId(typeof acfg?.channelId === "string" ? acfg.channelId : "");
    setTemplateKind(typeof acfg?.templateKind === "string" ? acfg.templateKind : "tradeidea");
    setTemplateId(typeof acfg?.templateId === "string" ? acfg.templateId : null);
    setSnapshotSymbol(typeof acfg?.snapshotSymbol === "string" ? acfg.snapshotSymbol : "");
    setContextProviderKey(typeof acfg?.contextProviderKey === "string" ? acfg.contextProviderKey : "");
    setContextProviderParams(typeof acfg?.contextProviderParams === "string" ? acfg.contextProviderParams : "{}");

    const hasAction = Boolean(
      typeof acfg?.channelId === "string" &&
        String(acfg.channelId).trim() &&
        typeof acfg?.templateId === "string" &&
        String(acfg.templateId).trim(),
    );
    setStep(hasAction ? "action" : "trigger");
  }, [row]);

  const computeEveryMinutes = () => {
    const amount = Math.max(1, Math.floor(Number(scheduleAmount) || 1));
    if (scheduleUnit === "days") return amount * 24 * 60;
    if (scheduleUnit === "hours") return amount * 60;
    return amount;
  };

  const isTriggerConfigured = (): boolean => {
    if (triggerOption === "trade_symbol") return Boolean(tradeSymbol.trim());
    return Number.isFinite(computeEveryMinutes()) && computeEveryMinutes() > 0;
  };

  const triggerSummary = (): string => {
    if (triggerOption === "trade_symbol") {
      return tradeSymbol ? `Trade happens on ${tradeSymbol}` : "Trade happens on …";
    }
    const amount = Math.max(1, Math.floor(Number(scheduleAmount) || 1));
    const unitLabel = scheduleUnit === "days" ? "day" : scheduleUnit === "hours" ? "hour" : "minute";
    return `Every ${amount} ${unitLabel}${amount === 1 ? "" : "s"}`;
  };

  const buildConditions = () => {
    if (conditionOption === "market_open") return { marketOpen: true };
    if (conditionOption === "actor_org_admin") return { actorRole: "admin" };
    return {};
  };

  const buildTrigger = () => {
    if (triggerOption === "trade_symbol") {
      return {
        type: "event" as const,
        config: {
          eventKey: "trade.happened",
          filter: { symbol: tradeSymbol.trim().toUpperCase() },
        },
      };
    }
    return {
      type: "schedule" as const,
      config: { kind: "interval" as const, everyMinutes: computeEveryMinutes() },
    };
  };

  const buildAction = () => ({
    type: "send_message" as const,
    config: {
      channelId: targetChannelId.trim(),
      templateKind: templateKind.trim(),
      templateId,
      snapshotSymbol: snapshotSymbol.trim() || undefined,
      contextProviderKey: contextProviderKey.trim() || undefined,
      contextProviderParams: contextProviderParams || undefined,
    },
  });

  const handleContinue = () => {
    if (!isTriggerConfigured()) {
      toast.error(
        triggerOption === "trade_symbol" ? "Pick a symbol for the trigger." : "Set a time period.",
      );
      return;
    }
    setStep("action");
  };

  const handleSave = async () => {
    if (!api.mutations.updateAutomation) {
      toast.error("Automations are not enabled in this host app yet.");
      return;
    }
    if (!isTriggerConfigured()) {
      toast.error("Configure the trigger first.");
      setStep("trigger");
      return;
    }
    if (!targetChannelId.trim()) {
      toast.error("Select a target channel.");
      return;
    }
    if (!templateId) {
      toast.error("Select a template.");
      return;
    }
    const selectedTemplate = (templatesForAutomation ?? []).find((t) => t._id === templateId);
    const templateJson = typeof selectedTemplate?.templateJson === "string" ? selectedTemplate.templateJson : "";
    const templateHasSnapshot = (() => {
      if (!templateJson) return false;
      try {
        const parsed = JSON.parse(templateJson) as any;
        const attachments = Array.isArray(parsed?.attachments) ? parsed.attachments : [];
        return attachments.some((a: any) => a?.type === "snapshot_png");
      } catch {
        return false;
      }
    })();
    if (templateHasSnapshot && !snapshotSymbol.trim()) {
      toast.error("Select a snapshot symbol for this template.");
      return;
    }

    try {
      await updateAutomation({
        ...(organizationId ? { organizationId } : {}),
        automationId,
        name: name.trim() || "Untitled automation",
        enabled,
        trigger: buildTrigger(),
        conditions: buildConditions(),
        action: buildAction(),
      });
      toast.success("Automation saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save automation.");
    }
  };

  const goBackToList = () => {
    const root = (basePath ?? "").replace(/\/$/, "");
    window.location.href = `${root}/automations`;
  };

  if (!row) {
    return (
      <div className={cx(className, ui?.pageClassName)}>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h2 className={cx("text-foreground text-2xl font-semibold", ui?.titleClassName)}>
              Automation
            </h2>
            <p className={cx("text-muted-foreground text-sm", ui?.descriptionClassName)}>
              This automation could not be found.
            </p>
          </div>
          <Button variant="outline" className={ui?.outlineButtonClassName} onClick={goBackToList}>
            Back to automations
          </Button>
        </div>
      </div>
    );
  }

  const conditionChoices =
    triggerOption === "time_period"
      ? [
          { value: "none", label: "No conditions" },
          { value: "market_open", label: "Only when market is open" },
        ]
      : [
          { value: "none", label: "No conditions" },
          { value: "actor_org_admin", label: "Only if actor is org admin" },
        ];

  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={cx("text-foreground text-2xl font-semibold", ui?.titleClassName)}>
            Automation
          </h2>
          <p className={cx("text-muted-foreground text-sm", ui?.descriptionClassName)}>
            Configure the trigger, conditions, and action.
          </p>
        </div>
        <Button variant="outline" className={ui?.outlineButtonClassName} onClick={goBackToList}>
          Back to automations
        </Button>
      </div>

      <Card className={ui?.cardClassName}>
        <CardHeader className={ui?.cardHeaderClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className={ui?.cardTitleClassName}>{name || "Untitled automation"}</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Enabled</Label>
              <Select value={enabled ? "true" : "false"} onValueChange={(v) => setEnabled(v === "true")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cx("space-y-4", ui?.cardContentClassName)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Automation name" />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">STEP 1</div>
                <div className="text-sm font-semibold">Trigger</div>
                {step === "action" ? (
                  <div className="text-muted-foreground text-sm">{triggerSummary()}</div>
                ) : null}
              </div>
              {step === "action" ? (
                <Button
                  variant="outline"
                  className={ui?.outlineButtonClassName}
                  onClick={() => setStep("trigger")}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit trigger
                </Button>
              ) : null}
            </div>

            <div className={cx("space-y-4", step === "action" && "pointer-events-none opacity-60")}>
              <div className="space-y-2">
                <Label>Choose a trigger</Label>
                <Select value={triggerOption} onValueChange={(v) => setTriggerOption(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trigger..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_period">Time period</SelectItem>
                    <SelectItem value="trade_symbol">When a trade happens on…</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerOption === "time_period" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Every</Label>
                    <Input value={scheduleAmount} onChange={(e) => setScheduleAmount(e.target.value)} placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={scheduleUnit} onValueChange={(v) => setScheduleUnit(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Symbol</Label>
                  <Select value={tradeSymbol} onValueChange={(v) => setTradeSymbol(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a symbol..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(symbolOptions ?? []).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!symbolOptions?.length ? (
                    <div className="text-muted-foreground text-xs">
                      No symbol options available yet. This list comes from the host app.
                    </div>
                  ) : null}
                </div>
              )}

              <div className="space-y-2">
                <Label>Conditions</Label>
                <Select
                  value={conditionOption}
                  onValueChange={(v) => setConditionOption(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a condition..." />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionChoices.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end">
                <Button className={ui?.buttonClassName} disabled={!isTriggerConfigured()} onClick={handleContinue}>
                  Continue →
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">STEP 2</div>
              <div className="text-sm font-semibold">Action</div>
              <div className="text-muted-foreground text-sm">Send Discord message (using a template)</div>
            </div>

            {step !== "action" ? (
              <div className="text-muted-foreground text-sm">
                Configure a trigger first to unlock action settings.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Target channel</Label>
                  <DiscordChannelSelect
                    value={targetChannelId}
                    onChange={(channelId) => setTargetChannelId(channelId)}
                    options={channels}
                    placeholder={loadingChannels ? "Loading..." : "Pick a channel..."}
                    disabled={loadingChannels}
                  />
                  <Button
                    variant="outline"
                    className={ui?.outlineButtonClassName}
                    disabled={loadingChannels}
                    onClick={() => void refreshChannels()}
                  >
                    {loadingChannels ? "Refreshing..." : "Refresh channels"}
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Template kind</Label>
                    <Input value={templateKind} onChange={(e) => setTemplateKind(e.target.value)} placeholder="tradeidea" />
                  </div>
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={templateId ?? ""} onValueChange={(v) => setTemplateId(v || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(templatesForAutomation ?? []).map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {(t.scope === "guild" ? "Guild" : "Org") + ": " + (t.name ?? t._id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Context provider key (optional)</Label>
                    <Input
                      value={contextProviderKey}
                      onChange={(e) => setContextProviderKey(e.target.value)}
                      placeholder="e.g. traderlaunchpad.hourlyTradeSummary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Context provider params (JSON)</Label>
                    <Input
                      value={contextProviderParams}
                      onChange={(e) => setContextProviderParams(e.target.value)}
                      placeholder='{"symbol":"BTCUSD","includeSnapshot":true}'
                    />
                  </div>
                </div>

                {(() => {
                  const selectedTemplate = (templatesForAutomation ?? []).find((t) => t._id === templateId);
                  const templateJson = typeof selectedTemplate?.templateJson === "string" ? selectedTemplate.templateJson : "";
                  let hasSnapshot = false;
                  try {
                    const parsed = templateJson ? (JSON.parse(templateJson) as any) : null;
                    const attachments = Array.isArray(parsed?.attachments) ? parsed.attachments : [];
                    hasSnapshot = attachments.some((a: any) => a?.type === "snapshot_png");
                  } catch {
                    hasSnapshot = false;
                  }

                  if (!hasSnapshot) return null;
                  return (
                    <div className="space-y-2">
                      <Label>Snapshot symbol</Label>
                      <Select value={snapshotSymbol} onValueChange={(v) => setSnapshotSymbol(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a symbol..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(symbolOptions ?? []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!symbolOptions?.length ? (
                        <div className="text-muted-foreground text-xs">
                          No symbol options available yet. This list comes from the host app.
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between gap-2">
                  <div className="text-muted-foreground text-xs">
                    Trigger: <span className="font-medium">{triggerSummary()}</span>
                  </div>
                  <Button className={ui?.buttonClassName} onClick={() => void handleSave()}>
                    Save automation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

