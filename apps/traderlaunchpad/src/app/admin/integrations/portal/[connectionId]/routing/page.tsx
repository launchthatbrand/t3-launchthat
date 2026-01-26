"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageSquare, Sparkles, Zap } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

export default function PortalRoutingMockPage() {
  const params = useParams<{ connectionId?: string | string[] }>();
  const raw = params?.connectionId;
  const connectionId = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  const [enabled, setEnabled] = React.useState(true);
  const [channelMentors, setChannelMentors] = React.useState("#mentors");
  const [channelMembers, setChannelMembers] = React.useState("#members");
  const [sendClosedIdeas, setSendClosedIdeas] = React.useState(true);
  const [sendOpenIdeas, setSendOpenIdeas] = React.useState(false);
  const [dailySummary, setDailySummary] = React.useState(false);

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Portal routing</div>
          <h1 className="text-3xl font-bold tracking-tight">Discord Routing Rules</h1>
          <div className="text-muted-foreground text-sm">
            Connection: <span className="font-mono">{connectionId || "—"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/integrations/portal/${encodeURIComponent(connectionId)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/sharing/preview">Preview</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal/test">Test</Link>
          </Button>
          <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700">
            Save (mock)
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Routing enabled</span>
            <Badge variant="outline">mock</Badge>
          </CardTitle>
          <CardDescription>
            Portal controls where TradeIdea events are posted in Discord.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Send events to Discord</div>
              <div className="text-muted-foreground text-sm">
                Turn on to allow Portal to publish updates.
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Channels
                </CardTitle>
                <CardDescription>
                  Map event types to channels. Later: per-symbol, per-setup, per-user.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mentors channel</Label>
                    <Input value={channelMentors} onChange={(e) => setChannelMentors(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Members channel</Label>
                    <Input value={channelMembers} onChange={(e) => setChannelMembers(e.target.value)} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Closed TradeIdeas
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Post when a TradeIdea closes (best for review + learning).
                      </div>
                    </div>
                    <Switch checked={sendClosedIdeas} onCheckedChange={setSendClosedIdeas} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Zap className="h-4 w-4 text-blue-500" />
                        Open TradeIdeas (optional)
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Post when a position opens (more noisy).
                      </div>
                    </div>
                    <Switch checked={sendOpenIdeas} onCheckedChange={setSendOpenIdeas} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Daily summary
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Post a daily performance summary at a fixed time.
                      </div>
                    </div>
                    <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>Example Discord message payload (mock).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border bg-black p-3 font-mono text-xs text-white/80">
                  {`[TradeIdea Closed]\nSymbol: AUDJPY\nP&L: +$450\nNotes: Needs review\nLink: https://app.traderlaunchpad.com/admin/tradeideas/...`}
                </div>
                <div className="text-muted-foreground text-xs">
                  Backend later: template editor, per-org channel mapping, retries.
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

