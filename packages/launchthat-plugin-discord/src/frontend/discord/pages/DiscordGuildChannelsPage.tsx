"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Badge } from "@acme/ui/badge";
import { toast } from "@acme/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import { MultiSelect } from "@acme/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

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
    </div>
  );
}

