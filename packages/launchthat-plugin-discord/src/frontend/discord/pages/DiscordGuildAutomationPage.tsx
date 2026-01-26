"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { PencilIcon } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Badge } from "@acme/ui/badge";
import { Switch } from "@acme/ui/switch";
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

const safeJsonParse = (raw: unknown): unknown => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const safeJsonStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
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
  const runAutomationDryRun = useAction(api.actions.runAutomationDryRun ?? "skip");

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
  const [templateKind] = React.useState("tradeidea");
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [snapshotSymbol, setSnapshotSymbol] = React.useState("");
  const [contextProviderKey, setContextProviderKey] = React.useState("");
  const [contextProviderParams, setContextProviderParams] = React.useState("{}");

  const [conditionMarketOpen, setConditionMarketOpen] = React.useState(false);
  const [dryRunPreviewing, setDryRunPreviewing] = React.useState(false);
  const [dryRunText, setDryRunText] = React.useState("");
  const [dryRunImageBase64, setDryRunImageBase64] = React.useState<string | null>(null);
  const [dryRunFilename, setDryRunFilename] = React.useState<string | null>(null);
  const [dryRunStale, setDryRunStale] = React.useState(false);

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
    setConditionMarketOpen(Boolean(cond?.marketOpen));
    if (cond?.actorRole === "admin") setConditionOption("actor_org_admin");
    else setConditionOption("none");

    const a = row.action as any;
    const acfg = a?.config ?? {};
    setTargetChannelId(typeof acfg?.channelId === "string" ? acfg.channelId : "");
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
    if (triggerOption === "time_period") return conditionMarketOpen ? { marketOpen: true } : {};
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

  const getChannelLabel = (id: string): string => {
    const row = (channels ?? []).find((c) => c.id === id);
    return row ? `#${row.name}` : id ? "Selected channel" : "Select channel";
  };

  const getTemplateLabel = (id: string | null): string => {
    if (!id) return "Select template";
    const row = (templatesForAutomation ?? []).find((t) => t._id === id);
    return row ? (row.name ?? row._id) : id;
  };

  const reportSymbol = React.useMemo(() => {
    const parsed = safeJsonParse(contextProviderParams);
    const sym =
      typeof (parsed as any)?.symbol === "string" ? String((parsed as any).symbol).trim().toUpperCase() : "";
    return sym || "BTCUSD";
  }, [contextProviderParams]);

  const selectedTemplateHasSnapshot = React.useMemo((): boolean => {
    const selectedTemplate = (templatesForAutomation ?? []).find((t) => t._id === templateId);
    const templateJson =
      typeof selectedTemplate?.templateJson === "string" ? selectedTemplate.templateJson : "";
    if (!templateJson) return false;
    try {
      const parsed = JSON.parse(templateJson) as any;
      const attachments = Array.isArray(parsed?.attachments) ? parsed.attachments : [];
      return attachments.some((a: any) => a?.type === "snapshot_png");
    } catch {
      return false;
    }
  }, [templateId, templatesForAutomation]);

  React.useEffect(() => {
    if (!selectedTemplateHasSnapshot) return;
    const next = reportSymbol.trim().toUpperCase();
    if (!next) return;
    if (!snapshotSymbol.trim()) {
      setSnapshotSymbol(next);
      return;
    }
  }, [reportSymbol, selectedTemplateHasSnapshot, snapshotSymbol]);

  const setReportSymbol = (next: string) => {
    const parsed = safeJsonParse(contextProviderParams);
    const obj = typeof parsed === "object" && parsed !== null ? { ...(parsed as any) } : {};
    obj.symbol = next;
    setContextProviderParams(safeJsonStringify(obj));
    // If the selected template attaches a snapshot, keep snapshotSymbol in sync.
    if (selectedTemplateHasSnapshot && (!snapshotSymbol.trim() || snapshotSymbol.trim().toUpperCase() !== next)) {
      setSnapshotSymbol(next);
    }
  };

  const applyHourlySummaryPreset = () => {
    setTriggerOption("time_period");
    setScheduleAmount("1");
    setScheduleUnit("hours");
    setConditionMarketOpen(true);
    setContextProviderKey("traderlaunchpad.hourlyTradeSummary");
    setContextProviderParams(safeJsonStringify({ symbol: reportSymbol || "BTCUSD" }));
    if (!name.trim()) setName(`Hourly ${reportSymbol || "BTCUSD"} summary`);
    setStep("action");
  };

  const buildDryRunKey = React.useMemo(
    () =>
      JSON.stringify({
        templateId,
        contextProviderKey,
        contextProviderParams,
        snapshotSymbol,
      }),
    [contextProviderKey, contextProviderParams, snapshotSymbol, templateId],
  );

  React.useEffect(() => {
    if (!api.actions.runAutomationDryRun) return;
    if (!organizationId) return;
    if (!templateId) return;
    if (!contextProviderKey.trim()) return;
    setDryRunStale(true);
  }, [api.actions.runAutomationDryRun, contextProviderKey, contextProviderParams, organizationId, templateId]);

  React.useEffect(() => {
    if (!api.actions.runAutomationDryRun) return;
    if (!organizationId) return;
    if (!templateId) return;
    if (!contextProviderKey.trim()) return;
    const t = window.setTimeout(() => {
      void (async () => {
        setDryRunPreviewing(true);
        try {
          const res = await runAutomationDryRun({
            organizationId,
            templateId,
            contextProviderKey,
            contextProviderParams,
            snapshotSymbol: snapshotSymbol.trim() || undefined,
          });
          setDryRunText(String((res as any)?.content ?? ""));
          setDryRunImageBase64(
            typeof (res as any)?.imageBase64 === "string" ? (res as any).imageBase64 : null,
          );
          setDryRunFilename(
            typeof (res as any)?.filename === "string" ? (res as any).filename : null,
          );
          setDryRunStale(false);
        } finally {
          setDryRunPreviewing(false);
        }
      })();
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildDryRunKey, api.actions.runAutomationDryRun, organizationId]);

  return row ? (
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
              {triggerOption === "time_period" ? (
                <div className="rounded-md border border-border/60 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Quick setup</div>
                      <div className="text-muted-foreground text-xs">
                        One-click preset for the common “hourly BTC summary to a channel” workflow.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className={ui?.outlineButtonClassName}
                      onClick={applyHourlySummaryPreset}
                    >
                      Use hourly summary preset
                    </Button>
                  </div>
                </div>
              ) : null}

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
                {triggerOption === "time_period" ? (
                  <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Only when market is open</div>
                      <div className="text-muted-foreground text-xs">
                        Uses the selected report symbol. Crypto is treated as always open; forex closed on weekends.
                      </div>
                    </div>
                    <Switch checked={conditionMarketOpen} onCheckedChange={setConditionMarketOpen} />
                  </div>
                ) : (
                  <Select value={conditionOption} onValueChange={(v) => setConditionOption(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a condition..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No conditions</SelectItem>
                      <SelectItem value="actor_org_admin">Only if actor is org admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                <div className="rounded-md border border-border/60 bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Summary</div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{triggerSummary()}</span>
                    {" — send "}
                    <span className="font-medium">cumulative {reportSymbol} trade summary</span>
                    {" to "}
                    <span className="font-medium">{getChannelLabel(targetChannelId)}</span>
                    {" using "}
                    <span className="font-medium">{getTemplateLabel(templateId)}</span>
                    {triggerOption === "time_period" && conditionMarketOpen ? (
                      <>
                        {" "}
                        <span className="text-muted-foreground">(only if market open)</span>
                      </>
                    ) : null}
                  </div>
                </div>

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
                    <Label>Report type</Label>
                    <Select
                      value={contextProviderKey === "traderlaunchpad.hourlyTradeSummary" ? "hourly" : "custom"}
                      onValueChange={(v) => {
                        if (v === "hourly") {
                          setContextProviderKey("traderlaunchpad.hourlyTradeSummary");
                          setContextProviderParams(
                            safeJsonStringify({ symbol: reportSymbol || "BTCUSD" }),
                          );
                        } else {
                          setContextProviderKey("");
                          setContextProviderParams("{}");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Cumulative hourly trades summary</SelectItem>
                        <SelectItem value="custom">Custom (advanced)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                      The summary provider populates template variables like{" "}
                      <span className="font-mono">{"{{symbol}}"}</span>,{" "}
                      <span className="font-mono">{"{{openPositions}}"}</span>,{" "}
                      <span className="font-mono">{"{{sentiment}}"}</span>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Select value={reportSymbol} onValueChange={setReportSymbol}>
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

                {contextProviderKey !== "traderlaunchpad.hourlyTradeSummary" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Context provider key (advanced)</Label>
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
                        placeholder='{"symbol":"BTCUSD"}'
                      />
                    </div>
                  </div>
                ) : null}

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

                {api.actions.runAutomationDryRun ? (
                  <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">Preview</div>
                        {dryRunStale ? (
                          <Badge variant="secondary" className="text-xs">
                            Preview out of date
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        className={ui?.outlineButtonClassName}
                        disabled={dryRunPreviewing || !templateId || !contextProviderKey.trim()}
                        onClick={() => {
                          // Force rerun by toggling stale and letting effect run quickly.
                          setDryRunStale(true);
                        }}
                      >
                        {dryRunPreviewing ? "Rendering..." : "Refresh preview"}
                      </Button>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-border/60">
                      <div className="bg-[#0B0D12] p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[15px] font-semibold text-white">
                                Trader Launchpad
                              </div>
                              <span className="rounded-md border border-blue-400/30 bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-200">
                                APP
                              </span>
                              <div className="text-xs text-white/50">Now</div>
                            </div>

                            <div className="mt-2 max-w-[560px] overflow-hidden rounded-md border-l-4 border-l-[#ED4245] bg-white/5 p-3">
                              <div className="whitespace-pre-wrap text-[14px] leading-5 text-white/90">
                                {dryRunText?.trim()
                                  ? dryRunText
                                  : "Select a template and report type to preview the message."}
                              </div>

                              {dryRunImageBase64 ? (
                                <img
                                  alt={dryRunFilename ?? "Discord embed image preview"}
                                  className="mt-3 max-w-full rounded-md border border-white/10"
                                  src={`data:image/png;base64,${dryRunImageBase64}`}
                                />
                              ) : (
                                <div className="mt-3 rounded-md border border-dashed border-white/15 p-3 text-sm text-white/60">
                                  No image attached (or template has no attachment).
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
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

