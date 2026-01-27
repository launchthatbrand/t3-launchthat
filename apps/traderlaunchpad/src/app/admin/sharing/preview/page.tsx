"use client";

import { ArrowLeft, Copy, ExternalLink, MessageSquare } from "lucide-react";
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

const EXAMPLE = {
  symbol: "AUDJPY",
  direction: "long",
  pnl: "+$450",
  reviewStatus: "todo",
  url: "https://app.traderlaunchpad.com/admin/tradeideas/mock-1",
};

export default function AdminSharingPreviewPage() {
  const [copied, setCopied] = React.useState(false);
  const text = `[TradeIdea Closed]\n${EXAMPLE.symbol} • ${EXAMPLE.direction.toUpperCase()}\nP&L: ${EXAMPLE.pnl}\nReview: ${EXAMPLE.reviewStatus}\n${EXAMPLE.url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-muted-foreground text-sm">Sharing</div>
          <h1 className="text-3xl font-bold tracking-tight">Preview</h1>
          <p className="text-muted-foreground mt-1">
            See exactly what gets posted (mock template + payload).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">mock</Badge>
          <Button variant="outline" asChild>
            <Link href="/admin/sharing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Discord message (mock)
            </CardTitle>
            <CardDescription>
              Backend later: rich embeds, chart thumbnail, and per-channel templates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-lg border bg-black p-4 font-mono text-xs text-white/80">
              {text}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" asChild>
                <Link href={EXAMPLE.url}>
                  Open TradeIdea <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
                <Link href="/admin/integrations/portal/test">
                  Send test <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Separator />

            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">Payload (mock)</div>
              <div className="text-muted-foreground mt-2 font-mono text-xs">
                {JSON.stringify(
                  {
                    type: "tradeidea.closed",
                    symbol: EXAMPLE.symbol,
                    direction: EXAMPLE.direction,
                    pnl: EXAMPLE.pnl,
                    reviewStatus: EXAMPLE.reviewStatus,
                    url: EXAMPLE.url,
                  },
                  null,
                  2,
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Template variables</CardTitle>
            <CardDescription>What the backend will fill in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm">
            <div className="rounded-lg border bg-muted/20 p-3 font-mono text-xs">
              {"{{symbol}} {{direction}} {{pnl}} {{reviewStatus}} {{url}}"}
            </div>
            <div className="text-muted-foreground text-xs">
              Next: per-setup tags, session, duration, and 1 “insight” line.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

