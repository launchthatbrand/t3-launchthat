"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { PencilIcon } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Badge } from "@acme/ui/badge";
import { toast } from "@acme/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { MultiSelect } from "@acme/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";

import { DiscordChannelSelect } from "../components";
import type { DiscordChannelsPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type MatchStrategy = "first_match" | "multi_cast" | "priority";

type RuleDraft = {
  enabled: boolean;
  channelId: string;
  order: number;
  priority: number;
  actorRoles: string[];
  symbols: string[];
};

type AutomationRow = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: any;
  conditions?: any;
  action: any;
};

export function DiscordGuildChannelsPage(props: DiscordChannelsPageProps & { guildId: string }) {
  const ruleset = useQuery(props.api.queries.getRoutingRuleSet, {
    ...(props.organizationId ? { organizationId: props.organizationId } : {}),
    guildId: props.guildId,
    kind: "trade_feed",
  }) as { matchStrategy?: MatchStrategy } | null | undefined;

  const rules = useQuery(props.api.queries.listRoutingRules, {
    ...(props.organizationId ? { organizationId: props.organizationId } : {}),
    guildId: props.guildId,
    kind: "trade_feed",
  }) as
    | Array<{
        enabled: boolean;
        channelId: string;
        order: number;
        priority: number;
        conditions?: { actorRoles?: string[]; symbols?: string[] };
      }>
    | null
    | undefined;

  const symbolOptions = useQuery(
    props.api.queries.listSymbolOptions ?? "skip",
    props.api.queries.listSymbolOptions
      ? { ...(props.organizationId ? { organizationId: props.organizationId } : {}), limit: 500 }
      : "skip",
  ) as string[] | undefined;

  const upsertRoutingRuleSet = useMutation(props.api.mutations.upsertRoutingRuleSet);
  const replaceRoutingRules = useMutation(props.api.mutations.replaceRoutingRules);
  const listGuildChannels = useAction(props.api.actions.listGuildChannels);
  const sendTestDiscordMessage = useAction(props.api.actions.sendTestDiscordMessage);

  const [matchStrategy, setMatchStrategy] = React.useState<MatchStrategy>("first_match");
  const [draftRules, setDraftRules] = React.useState<RuleDraft[]>([]);
  const [channels, setChannels] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loadingChannels, setLoadingChannels] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testingRuleIdx, setTestingRuleIdx] = React.useState<number | null>(null);

  // Automations (Zapier-like)
  const automations = useQuery(
    props.api.queries.listAutomations ?? "skip",
    props.api.queries.listAutomations
      ? {
          ...(props.organizationId ? { organizationId: props.organizationId } : {}),
          guildId: props.guildId,
        }
      : "skip",
  ) as AutomationRow[] | undefined;
  const createAutomation = useMutation(props.api.mutations.createAutomation ?? "skip");
  const updateAutomation = useMutation(props.api.mutations.updateAutomation ?? "skip");
  const deleteAutomation = useMutation(props.api.mutations.deleteAutomation ?? "skip");

  const [automationId, setAutomationId] = React.useState<string | null>(null);
  const [automationName, setAutomationName] = React.useState("");
  const [automationEnabled, setAutomationEnabled] = React.useState(true);
  const [automationStep, setAutomationStep] = React.useState<"trigger" | "action">("trigger");
  const [triggerOption, setTriggerOption] = React.useState<"time_period" | "trade_symbol">(
    "time_period",
  );
  const [scheduleAmount, setScheduleAmount] = React.useState("60");
  const [scheduleUnit, setScheduleUnit] = React.useState<"minutes" | "hours" | "days">("minutes");
  const [tradeSymbol, setTradeSymbol] = React.useState("");
  const [conditionMarketOpen, setConditionMarketOpen] = React.useState(true);
  const [conditionOnlyOrgAdmin, setConditionOnlyOrgAdmin] = React.useState(false);
  const [targetChannelId, setTargetChannelId] = React.useState("");
  const [templateKind, setTemplateKind] = React.useState("tradeidea");
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [contextProviderKey, setContextProviderKey] = React.useState("");
  const [contextProviderParams, setContextProviderParams] = React.useState("{}");
  const [savingAutomation, setSavingAutomation] = React.useState(false);
  const [deletingAutomation, setDeletingAutomation] = React.useState(false);

  const templatesForAutomation = useQuery(
    props.api.queries.listTemplates ?? "skip",
    props.api.queries.listTemplates
      ? {
          ...(props.organizationId ? { organizationId: props.organizationId } : {}),
          guildId: props.guildId,
          kind: templateKind,
        }
      : "skip",
  ) as Array<{ _id: string; name?: string; scope?: "org" | "guild" }> | undefined;

  React.useEffect(() => {
    if (!Array.isArray(automations)) return;
    const selected = automations.find((a) => a.id === automationId);
    if (!selected) return;
    setAutomationName(selected.name ?? "");
    setAutomationEnabled(Boolean(selected.enabled));
    const t = selected.trigger as any;
    const cfg = t?.config as any;
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
      // Prefer clean unit display for common intervals.
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
    const cond = selected.conditions as any;
    setConditionMarketOpen(Boolean(cond?.marketOpen));
    setConditionOnlyOrgAdmin(cond?.actorRole === "admin");
    const a = selected.action as any;
    const acfg = a?.config as any;
    setTargetChannelId(typeof acfg?.channelId === "string" ? acfg.channelId : "");
    setTemplateKind(typeof acfg?.templateKind === "string" ? acfg.templateKind : "tradeidea");
    setTemplateId(typeof acfg?.templateId === "string" ? acfg.templateId : null);
    setContextProviderKey(typeof acfg?.contextProviderKey === "string" ? acfg.contextProviderKey : "");
    setContextProviderParams(
      typeof acfg?.contextProviderParams === "string" ? acfg.contextProviderParams : "{}",
    );
    const hasAction = Boolean(
      typeof acfg?.channelId === "string" &&
        String(acfg.channelId).trim() &&
        typeof acfg?.templateId === "string" &&
        String(acfg.templateId).trim(),
    );
    setAutomationStep(hasAction ? "action" : "trigger");
  }, [automationId, automations]);

  const computeEveryMinutes = () => {
    const amount = Math.max(1, Math.floor(Number(scheduleAmount) || 1));
    const unit = scheduleUnit;
    if (unit === "days") return amount * 24 * 60;
    if (unit === "hours") return amount * 60;
    return amount;
  };

  const getTriggerSummary = (): string => {
    if (triggerOption === "trade_symbol") {
      return tradeSymbol ? `Trade happens on ${tradeSymbol}` : "Trade happens on …";
    }
    const amount = Math.max(1, Math.floor(Number(scheduleAmount) || 1));
    const unitLabel = scheduleUnit === "days" ? "day" : scheduleUnit === "hours" ? "hour" : "minute";
    return `Every ${amount} ${unitLabel}${amount === 1 ? "" : "s"}`;
  };

  const isTriggerConfigured = (): boolean => {
    if (triggerOption === "trade_symbol") return Boolean(tradeSymbol.trim());
    return Number.isFinite(computeEveryMinutes()) && computeEveryMinutes() > 0;
  };

  const handleContinueToAction = () => {
    if (!isTriggerConfigured()) {
      toast.error(
        triggerOption === "trade_symbol" ? "Pick a symbol for the trigger." : "Set a time period.",
      );
      return;
    }
    setAutomationStep("action");
  };

  const handleNewAutomation = () => {
    setAutomationId(null);
    setAutomationName("Hourly BTC summary");
    setAutomationEnabled(true);
    setAutomationStep("trigger");
    setTriggerOption("time_period");
    setScheduleUnit("hours");
    setScheduleAmount("1");
    setTradeSymbol("BTCUSD");
    setConditionMarketOpen(true);
    setConditionOnlyOrgAdmin(false);
    setTargetChannelId("");
    setTemplateKind("tradeidea");
    setTemplateId(null);
    setContextProviderKey("traderlaunchpad.hourlyTradeSummary");
    setContextProviderParams(JSON.stringify({ symbol: "BTCUSD", includeSnapshot: true }, null, 2));
  };

  const handleSaveAutomation = async () => {
    if (!props.api.mutations.createAutomation || !props.api.mutations.updateAutomation) {
      toast.error("Automations are not enabled in this host app yet.");
      return;
    }
    if (!isTriggerConfigured()) {
      toast.error("Configure the trigger first.");
      setAutomationStep("trigger");
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

    const trig =
      triggerOption === "trade_symbol"
        ? {
            type: "event" as const,
            config: {
              eventKey: "trade.happened",
              filter: { symbol: tradeSymbol.trim().toUpperCase() },
            },
          }
        : {
            type: "schedule" as const,
            config: { kind: "interval" as const, everyMinutes: computeEveryMinutes() },
          };
    const conditions =
      triggerOption === "trade_symbol"
        ? {
            ...(conditionOnlyOrgAdmin ? { actorRole: "admin" } : {}),
          }
        : {
            ...(conditionMarketOpen ? { marketOpen: true } : {}),
          };
    const act = {
      type: "send_message" as const,
      config: {
        channelId: targetChannelId.trim(),
        templateKind: templateKind.trim(),
        templateId,
        contextProviderKey: contextProviderKey.trim() || undefined,
        contextProviderParams: contextProviderParams || undefined,
      },
    };

    setSavingAutomation(true);
    try {
      if (automationId) {
        await updateAutomation({
          ...(props.organizationId ? { organizationId: props.organizationId } : {}),
          automationId,
          name: automationName.trim() || "Untitled automation",
          enabled: automationEnabled,
          trigger: trig,
          conditions,
          action: act,
        });
        toast.success("Automation saved.");
      } else {
        const id = await createAutomation({
          ...(props.organizationId ? { organizationId: props.organizationId } : {}),
          guildId: props.guildId,
          name: automationName.trim() || "Untitled automation",
          enabled: automationEnabled,
          trigger: trig,
          conditions,
          action: act,
        });
        setAutomationId(String(id));
        toast.success("Automation created.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save automation.");
    } finally {
      setSavingAutomation(false);
    }
  };

  const handleDeleteAutomation = async () => {
    if (!automationId) return;
    if (!props.api.mutations.deleteAutomation) {
      toast.error("Automations are not enabled in this host app yet.");
      return;
    }
    setDeletingAutomation(true);
    try {
      await deleteAutomation({
        ...(props.organizationId ? { organizationId: props.organizationId } : {}),
        automationId,
      });
      setAutomationId(null);
      toast.success("Automation deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete automation.");
    } finally {
      setDeletingAutomation(false);
    }
  };

  const roleOptions = React.useMemo(
    () => [
      { label: "Owner", value: "owner" },
      { label: "Admin", value: "admin" },
      { label: "Editor", value: "editor" },
      { label: "Member", value: "member" },
    ],
    [],
  );

  const symbolSelectOptions = React.useMemo(
    () =>
      (symbolOptions ?? []).map((s) => ({
        label: s,
        value: s,
      })),
    [symbolOptions],
  );

  React.useEffect(() => {
    const s =
      ruleset?.matchStrategy === "multi_cast"
        ? "multi_cast"
        : ruleset?.matchStrategy === "priority"
          ? "priority"
          : "first_match";
    setMatchStrategy(s);
  }, [ruleset?.matchStrategy]);

  React.useEffect(() => {
    if (!Array.isArray(rules)) return;
    const next: RuleDraft[] = rules
      .slice()
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .map((r, idx) => ({
        enabled: Boolean(r.enabled),
        channelId: String(r.channelId ?? ""),
        order: typeof r.order === "number" ? r.order : idx,
        priority: typeof r.priority === "number" ? r.priority : 0,
        actorRoles: Array.isArray(r.conditions?.actorRoles)
          ? r.conditions!.actorRoles!.filter((x) => typeof x === "string")
          : [],
        symbols: Array.isArray(r.conditions?.symbols)
          ? r.conditions!.symbols!.filter((x) => typeof x === "string")
          : [],
      }));
    setDraftRules(next);
  }, [rules]);

  const refreshChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await listGuildChannels({
        ...(props.organizationId ? { organizationId: props.organizationId } : {}),
        guildId: props.guildId,
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
  }, [props.guildId, props.organizationId]);

  const normalizeOrders = (rules: RuleDraft[]) =>
    rules.map((r, idx) => ({ ...r, order: idx }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertRoutingRuleSet({
        ...(props.organizationId ? { organizationId: props.organizationId } : {}),
        guildId: props.guildId,
        kind: "trade_feed",
        matchStrategy,
      });

      const normalized = normalizeOrders(draftRules);
      setDraftRules(normalized);

      await replaceRoutingRules({
        ...(props.organizationId ? { organizationId: props.organizationId } : {}),
        guildId: props.guildId,
        kind: "trade_feed",
        rules: normalized.map((r) => ({
          enabled: r.enabled,
          channelId: r.channelId,
          order: r.order,
          priority: r.priority,
          conditions:
            r.actorRoles.length || r.symbols.length
              ? {
                  actorRoles: r.actorRoles.length ? r.actorRoles : undefined,
                  symbols: r.symbols.length ? r.symbols : undefined,
                }
              : undefined,
        })),
      });
    } finally {
      setSaving(false);
    }
  };

  const buildRuleTestMessage = (rule: RuleDraft, idx: number) => {
    const parts: string[] = [];
    parts.push("🧪 **Discord routing rule test**");
    parts.push(`Guild: \`${props.guildId}\``);
    parts.push(`Rule: #${idx + 1}`);
    parts.push(`Channel: \`${rule.channelId || "—"}\``);
    parts.push(`Enabled: \`${rule.enabled ? "true" : "false"}\``);
    parts.push(`Strategy: \`${matchStrategy}\``);
    if (rule.actorRoles.length) parts.push(`Roles: \`${rule.actorRoles.join(", ")}\``);
    if (rule.symbols.length) parts.push(`Symbols: \`${rule.symbols.join(", ")}\``);
    parts.push(`Sent: <t:${Math.floor(Date.now() / 1000)}:T>`);
    return parts.join("\n");
  };

  const handleTestRule = async (rule: RuleDraft, idx: number) => {
    const channelId = rule.channelId.trim();
    if (!channelId) {
      toast.error("Rule has no channel selected.");
      return;
    }

    setTestingRuleIdx(idx);
    try {
      const content = buildRuleTestMessage(rule, idx);
      await sendTestDiscordMessage({
        ...(props.organizationId ? { organizationId: props.organizationId } : {}),
        guildId: props.guildId,
        channelId,
        content,
      });
      toast.success("Test message sent to Discord.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test message.");
    } finally {
      setTestingRuleIdx(null);
    }
  };

  return (
    <div className={cx(props.className, props.ui?.pageClassName)}>
      <div className={cx("mb-6", props.ui?.headerClassName)}>
        <h2 className={cx("text-foreground text-2xl font-semibold", props.ui?.titleClassName)}>
          Channels
        </h2>
        <p className={cx("text-muted-foreground text-sm", props.ui?.descriptionClassName)}>
          Route trade feed events to Discord channels using rules (role, symbol, etc).
        </p>
      </div>

      <Card className={props.ui?.cardClassName}>
        <CardHeader className={props.ui?.cardHeaderClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className={props.ui?.cardTitleClassName}>
              Trade feed routing rules
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className={props.ui?.outlineButtonClassName}
                disabled={loadingChannels}
                onClick={() => void refreshChannels()}
              >
                {loadingChannels ? "Refreshing..." : "Refresh channels"}
              </Button>
              <Button
                className={props.ui?.buttonClassName}
                onClick={() =>
                  setDraftRules((prev) =>
                    normalizeOrders([
                      ...prev,
                      {
                        enabled: true,
                        channelId: "",
                        order: prev.length,
                        priority: 0,
                        actorRoles: [],
                        symbols: [],
                      },
                    ]),
                  )
                }
              >
                Add rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cx("space-y-6", props.ui?.cardContentClassName)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Match strategy</Label>
              <Select value={matchStrategy} onValueChange={(v) => setMatchStrategy(v as MatchStrategy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_match">First match wins</SelectItem>
                  <SelectItem value="multi_cast">Send to all matches</SelectItem>
                  <SelectItem value="priority">Highest priority wins</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Controls what happens when multiple rules match a trade event.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Available channels</Label>
              <div className="text-muted-foreground text-xs">
                {channels.length ? (
                  <span>
                    Loaded <span className="text-foreground font-medium">{channels.length}</span>{" "}
                    channels.
                  </span>
                ) : (
                  <span>No channels loaded yet.</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {draftRules.map((rule, idx) => (
              <Card key={idx} className={props.ui?.cardClassName}>
                <CardHeader className={cx("space-y-2", props.ui?.cardHeaderClassName)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.enabled ? "default" : "secondary"} className={props.ui?.badgeClassName}>
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <span className="text-muted-foreground text-xs">Rule #{idx + 1}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className={props.ui?.outlineButtonClassName}
                        disabled={idx === 0}
                        onClick={() =>
                          setDraftRules((prev) => {
                            const next = prev.slice();
                            const tmp = next[idx - 1]!;
                            next[idx - 1] = next[idx]!;
                            next[idx] = tmp;
                            return normalizeOrders(next);
                          })
                        }
                      >
                        Up
                      </Button>
                      <Button
                        variant="outline"
                        className={props.ui?.outlineButtonClassName}
                        disabled={idx === draftRules.length - 1}
                        onClick={() =>
                          setDraftRules((prev) => {
                            const next = prev.slice();
                            const tmp = next[idx + 1]!;
                            next[idx + 1] = next[idx]!;
                            next[idx] = tmp;
                            return normalizeOrders(next);
                          })
                        }
                      >
                        Down
                      </Button>
                      <Button
                        variant="outline"
                        className={props.ui?.outlineButtonClassName}
                        onClick={() =>
                          setDraftRules((prev) => normalizeOrders(prev.filter((_, i) => i !== idx)))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={cx("space-y-4", props.ui?.cardContentClassName)}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Target channel</Label>
                      <DiscordChannelSelect
                        value={rule.channelId}
                        onChange={(channelId) =>
                          setDraftRules((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, channelId } : r)),
                          )
                        }
                        options={channels}
                        placeholder="Pick a channel..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={String(rule.priority)}
                        onValueChange={(v) =>
                          setDraftRules((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, priority: Number(v) } : r,
                            ),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 5, 10].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Only used when match strategy is set to “Highest priority wins”.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Actor roles</Label>
                      <MultiSelect
                        options={roleOptions}
                        defaultValue={rule.actorRoles}
                        onValueChange={(value) =>
                          setDraftRules((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, actorRoles: value } : r)),
                          )
                        }
                        placeholder="Any role"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Symbols</Label>
                      <MultiSelect
                        options={symbolSelectOptions}
                        defaultValue={rule.symbols}
                        onValueChange={(value) =>
                          setDraftRules((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, symbols: value } : r)),
                          )
                        }
                        placeholder="Any symbol"
                      />
                      {!symbolSelectOptions.length ? (
                        <p className="text-muted-foreground text-xs">
                          No symbol options available yet. This list comes from the host app.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      className={props.ui?.outlineButtonClassName}
                      onClick={() =>
                        setDraftRules((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, enabled: !r.enabled } : r)),
                        )
                      }
                    >
                      {rule.enabled ? "Disable" : "Enable"}
                    </Button>

                    <Button
                      variant="outline"
                      className={props.ui?.outlineButtonClassName}
                      disabled={testingRuleIdx === idx}
                      onClick={() => void handleTestRule(rule, idx)}
                    >
                      {testingRuleIdx === idx ? "Testing..." : "Test → Send message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {draftRules.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No rules yet. Click “Add rule” to create your first routing rule.
              </div>
            ) : null}
          </div>

          <div className="pt-2">
            <Button onClick={() => void handleSave()} disabled={saving} className={props.ui?.buttonClassName}>
              {saving ? "Saving..." : "Save rules"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={cx("mt-6", props.ui?.cardClassName)}>
        <CardHeader className={props.ui?.cardHeaderClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className={props.ui?.cardTitleClassName}>Automations</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className={props.ui?.outlineButtonClassName}
                onClick={handleNewAutomation}
              >
                New automation
              </Button>
              <Button
                variant="outline"
                className={props.ui?.outlineButtonClassName}
                disabled={!automationId || deletingAutomation}
                onClick={() => void handleDeleteAutomation()}
              >
                {deletingAutomation ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Zapier-like rules: set a trigger, then configure an action.
          </p>
        </CardHeader>
        <CardContent className={cx("space-y-4", props.ui?.cardContentClassName)}>
          {!props.api.queries.listAutomations ? (
            <p className="text-muted-foreground text-sm">
              Automations are not enabled in this host app yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                <Label>Existing automations</Label>
                <Select
                  value={automationId ?? ""}
                  onValueChange={(v) => setAutomationId(v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an automation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(automations ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {automationId ? (
                  <div className="pt-1">
                    <Badge className={props.ui?.badgeClassName} variant="outline">
                      {automationEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={automationName}
                      onChange={(e) => setAutomationName(e.target.value)}
                      placeholder="e.g. Hourly BTC summary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Enabled</Label>
                    <Select
                      value={automationEnabled ? "true" : "false"}
                      onValueChange={(v) => setAutomationEnabled(v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">STEP 1</div>
                      <div className="text-sm font-semibold">Trigger</div>
                      {automationStep === "action" ? (
                        <div className="text-muted-foreground text-sm">{getTriggerSummary()}</div>
                      ) : null}
                    </div>
                    {automationStep === "action" ? (
                      <Button
                        variant="outline"
                        className={props.ui?.outlineButtonClassName}
                        onClick={() => setAutomationStep("trigger")}
                      >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Edit trigger
                      </Button>
                    ) : null}
                  </div>

                  <div
                    className={cx(
                      "space-y-4",
                      automationStep === "action" && "pointer-events-none opacity-60",
                    )}
                  >
                    <div className="space-y-2">
                      <Label>Choose a trigger</Label>
                      <Select
                        value={triggerOption}
                        onValueChange={(v) => setTriggerOption(v as any)}
                      >
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
                          <Input
                            value={scheduleAmount}
                            onChange={(e) => setScheduleAmount(e.target.value)}
                            placeholder="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Select
                            value={scheduleUnit}
                            onValueChange={(v) => setScheduleUnit(v as any)}
                          >
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
                        <Select
                          value={tradeSymbol}
                          onValueChange={(v) => setTradeSymbol(v)}
                        >
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
                          <p className="text-muted-foreground text-xs">
                            No symbol options available yet. This list comes from the host app.
                          </p>
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
                              Forex is closed on weekends; crypto stays open. (Heuristic-based)
                            </div>
                          </div>
                          <Switch checked={conditionMarketOpen} onCheckedChange={setConditionMarketOpen} />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Only if actor is org admin</div>
                            <div className="text-muted-foreground text-xs">
                              Applied when the trigger is event-driven (trade happened).
                            </div>
                          </div>
                          <Switch checked={conditionOnlyOrgAdmin} onCheckedChange={setConditionOnlyOrgAdmin} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <Button
                        className={props.ui?.buttonClassName}
                        disabled={!isTriggerConfigured()}
                        onClick={handleContinueToAction}
                      >
                        Continue →
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">STEP 2</div>
                    <div className="text-sm font-semibold">Action</div>
                    <div className="text-muted-foreground text-sm">
                      Send Discord message (using a template)
                    </div>
                  </div>

                  {automationStep !== "action" ? (
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
                          placeholder="Pick a channel..."
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Template kind</Label>
                          <Input
                            value={templateKind}
                            onChange={(e) => setTemplateKind(e.target.value)}
                            placeholder="tradeidea"
                          />
                          <p className="text-muted-foreground text-xs">
                            This controls which templates are shown.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Template</Label>
                          <Select
                            value={templateId ?? ""}
                            onValueChange={(v) => setTemplateId(v || null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(templatesForAutomation ?? []).map((t) => (
                                <SelectItem key={t._id} value={t._id}>
                                  {(t.scope === "guild" ? "Guild" : "Org") +
                                    ": " +
                                    (t.name ?? t._id)}
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
                            placeholder='{"symbol":"BTCUSD"}'
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-muted-foreground text-xs">
                          Trigger: <span className="font-medium">{getTriggerSummary()}</span>
                        </div>
                        <Button
                          className={props.ui?.buttonClassName}
                          disabled={savingAutomation}
                          onClick={() => void handleSaveAutomation()}
                        >
                          {savingAutomation ? "Saving..." : automationId ? "Save automation" : "Create automation"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {props.api.actions.runAutomationDryRun ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className={props.ui?.outlineButtonClassName}
                      onClick={() => toast.message("Run-now wiring comes from host app runner.")}
                    >
                      Run now (dry run)
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

