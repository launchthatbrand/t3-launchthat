"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui";

const msToHours = (ms: number) => Math.round((ms / (60 * 60 * 1000)) * 100) / 100;
const hoursToMs = (hours: number) => Math.round(hours * 60 * 60 * 1000);

const TIMEFRAME_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "m1", label: "M1" },
  { id: "m5", label: "M5" },
  { id: "m15", label: "M15" },
  { id: "h1", label: "H1" },
  { id: "h4", label: "H4" },
  { id: "d1", label: "D1" },
  { id: "custom", label: "Custom" },
];

export default function AdminSettingsJournalPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const current = useQuery(
    api.traderlaunchpad.queries.getMyTradeIdeaSettings,
    shouldQuery ? {} : "skip",
  ) as
    | {
      groupingWindowMs: number;
      splitOnDirectionFlip: boolean;
      defaultTimeframe: string;
    }
    | undefined;

  const save = useMutation(api.traderlaunchpad.mutations.upsertMyTradeIdeaSettings);

  const [groupingHours, setGroupingHours] = React.useState<number>(6);
  const [splitOnFlip, setSplitOnFlip] = React.useState<boolean>(true);
  const [defaultTimeframe, setDefaultTimeframe] = React.useState<string>("custom");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!current) return;
    setGroupingHours(msToHours(current.groupingWindowMs));
    setSplitOnFlip(Boolean(current.splitOnDirectionFlip));
    setDefaultTimeframe(current.defaultTimeframe || "custom");
  }, [current?.defaultTimeframe, current?.groupingWindowMs, current?.splitOnDirectionFlip]);

  const isReady = shouldQuery && current !== undefined;

  return (
    <div className="space-y-6">
      <Card className="border-border/10 bg-white/3 backdrop-blur-md">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Journal settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {!isReady ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="groupingHours">Trade idea grouping window (hours)</Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    id="groupingHours"
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    max={336}
                    step={0.25}
                    value={String(groupingHours)}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      setGroupingHours(n);
                    }}
                    className="md:w-48"
                  />
                  <div className="text-sm text-muted-foreground">
                    Positions on the same symbol will be grouped into one thesis if they start within this gap.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/20 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Split on direction flip</div>
                  <div className="text-sm text-muted-foreground">
                    If enabled, switching from long-bias to short-bias starts a new thesis idea.
                  </div>
                </div>
                <Switch checked={splitOnFlip} onCheckedChange={setSplitOnFlip} />
              </div>

              <div className="space-y-2">
                <Label>Default thesis timeframe</Label>
                <Select value={defaultTimeframe} onValueChange={setDefaultTimeframe}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  This is used when creating auto-grouped thesis ideas.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await save({
                        groupingWindowMs: hoursToMs(groupingHours),
                        splitOnDirectionFlip: splitOnFlip,
                        defaultTimeframe,
                      });
                      toast.success("Journal settings saved.");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Failed to save journal settings.",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-white/3 backdrop-blur-md">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-sm text-muted-foreground">
          These settings affect how new positions are grouped into shareable thesis ideas on sync.
          If you want to regroup existing data, use the backfill mutation after clearing prior assignments.
        </CardContent>
      </Card>
    </div>
  );
}

