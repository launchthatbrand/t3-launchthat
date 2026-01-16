"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export default function PortalOAuthCallbackMockPage() {
  const params = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  const [isDone, setIsDone] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setIsDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  const ok = !error && Boolean(code);

  return (
    <div className="animate-in fade-in mx-auto max-w-2xl space-y-6 duration-500">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Connecting Portal…</span>
            <Badge variant="outline">mock</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!isDone ? (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Creating connection and issuing tokens…
            </div>
          ) : ok ? (
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Connected! (mock) You can now configure routing and view logs.
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              Connection failed: {error ?? "missing code"}
            </div>
          )}

          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="text-muted-foreground text-xs">OAuth callback params</div>
            <div className="mt-2 space-y-1">
              <div>
                <span className="text-muted-foreground">code:</span>{" "}
                <span className="font-mono">{code ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">state:</span>{" "}
                <span className="font-mono">{state ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/admin/integrations/portal">Back to Portal</Link>
            </Button>
            <Button
              className="border-0 bg-blue-600 text-white hover:bg-blue-700"
              asChild
              disabled={!isDone || !ok}
            >
              <Link href="/admin/integrations/portal/pc_mock_001">Open connection</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

