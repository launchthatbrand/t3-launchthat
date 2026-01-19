"use client";

import React from "react";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";

type ProbeResult = {
  path: string;
  status: number;
  ok: boolean;
  textPreview: string;
};

type ProbeResponse =
  | {
      ok: true;
      environment: "demo" | "live";
      baseUrl: string;
      results: ProbeResult[];
    }
  | {
      ok: false;
      error: string;
    };

export function TradeLockerDeveloperKeyTest() {
  const [env, setEnv] = React.useState<"demo" | "live">("demo");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<ProbeResponse | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/tradelocker/devkey-test?env=${env}`, {
        method: "GET",
      });
      const json = (await res.json()) as ProbeResponse;
      setData(json);
    } catch (e) {
      setData({ ok: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Developer key market-data probe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-white/60">
          This attempts TradeLocker endpoints using <span className="font-mono">TRADELOCKER_DEVELOPER_API_KEY</span>{" "}
          only (no user JWT). If TradeLocker requires a user token, you’ll see 401/403 responses — that’s still useful
          because it proves the key alone can’t fetch pricing.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={env === "demo" ? "secondary" : "outline"}
            className="h-9"
            onClick={() => setEnv("demo")}
          >
            Demo
          </Button>
          <Button
            type="button"
            variant={env === "live" ? "secondary" : "outline"}
            className="h-9"
            onClick={() => setEnv("live")}
          >
            Live
          </Button>

          <Button
            type="button"
            className="h-9 border-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? "Running..." : "Run probe"}
          </Button>
        </div>

        {data ? (
          data.ok ? (
            <div className="space-y-2">
              <div className="text-xs text-white/60">
                Base URL: <span className="font-mono text-white/80">{data.baseUrl}</span>
              </div>
              {data.results.map((r) => (
                <div
                  key={r.path}
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-sm text-white/90">{r.path}</div>
                    <Badge
                      variant="outline"
                      className={
                        r.ok
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/15 bg-white/5 text-white/70"
                      }
                    >
                      {r.status || "ERR"}
                    </Badge>
                  </div>
                  {r.textPreview ? (
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-2 text-[11px] text-white/70">
                      {r.textPreview}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/70">
              {data.error}
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

