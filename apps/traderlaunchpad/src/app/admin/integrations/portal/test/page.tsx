"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";

type Status = "idle" | "sending" | "success" | "failed";

export default function AdminPortalTestDeliveryPage() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [lastRun, setLastRun] = React.useState<string | null>(null);

  const handleSend = async () => {
    setStatus("sending");
    setLastRun(null);
    await new Promise((r) => setTimeout(r, 900));
    // mock: 85% success
    const ok = Math.random() > 0.15;
    setStatus(ok ? "success" : "failed");
    setLastRun(new Date().toLocaleString());
  };

  const statusBadge =
    status === "success"
      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
      : status === "failed"
        ? "bg-red-500/10 text-red-500 hover:bg-red-500/10"
        : status === "sending"
          ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/10"
          : "bg-muted text-muted-foreground hover:bg-muted";

  return (
    <div className="mx-auto max-w-4xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-muted-foreground text-sm">Portal integration</div>
          <h1 className="text-3xl font-bold tracking-tight">Test delivery</h1>
          <p className="text-muted-foreground mt-1">
            Send a single “Closed TradeIdea” message through the full pipeline (mock).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">mock</Badge>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal/setup">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to setup
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Send test event</CardTitle>
            <CardDescription>
              Backend later: record a test run, delivery trace, and retry outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">Payload preview (mock)</div>
                <Badge className={statusBadge}>{status}</Badge>
              </div>
              <div className="mt-3 rounded-lg border bg-black p-3 font-mono text-xs text-white/80">
                {`type=tradeidea.closed\nsymbol=AUDJPY\npnl=+$450\nreviewStatus=todo\nurl=https://app.traderlaunchpad.com/admin/tradeideas/...`}
              </div>
              {lastRun ? (
                <div className="text-muted-foreground mt-2 text-xs">
                  Last run: {lastRun}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="border-0 bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleSend}
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send test
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/sharing/preview">
                  Preview templates <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 text-sm">
                <div className="text-muted-foreground text-xs">Step 1</div>
                <div className="mt-1 font-semibold">Portal pulls events</div>
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm">
                <div className="text-muted-foreground text-xs">Step 2</div>
                <div className="mt-1 font-semibold">Portal routes to Discord</div>
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm">
                <div className="text-muted-foreground text-xs">Step 3</div>
                <div className="mt-1 font-semibold">Delivery confirmation</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Latest result</CardTitle>
            <CardDescription>Readable explanation for traders (mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6 text-sm">
            {status === "success" ? (
              <div className="flex items-start gap-2 rounded-lg border bg-emerald-500/5 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <div className="font-semibold">Delivered</div>
                  <div className="text-muted-foreground">
                    Message posted to <span className="font-mono">#mentors</span>.
                  </div>
                </div>
              </div>
            ) : status === "failed" ? (
              <div className="flex items-start gap-2 rounded-lg border bg-red-500/5 p-3">
                <XCircle className="mt-0.5 h-4 w-4 text-red-500" />
                <div>
                  <div className="font-semibold">Failed</div>
                  <div className="text-muted-foreground">
                    Discord rate limited (mock). Retry scheduled in 10s.
                  </div>
                </div>
              </div>
            ) : status === "sending" ? (
              <div className="flex items-start gap-2 rounded-lg border bg-blue-500/5 p-3">
                <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-blue-500" />
                <div>
                  <div className="font-semibold">Sending…</div>
                  <div className="text-muted-foreground">Tracing delivery pipeline.</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-semibold">Not run yet</div>
                  <div className="text-muted-foreground">
                    Click “Send test” to generate a delivery trace.
                  </div>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/integrations/portal/pc_mock_001/logs">
                View logs <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

