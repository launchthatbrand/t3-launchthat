"use client";

import "tdrlp-widgets";

import * as React from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@acme/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { MultiSelect } from "@acme/ui/multi-select";
import { Textarea } from "@acme/ui/textarea";

export default function ForexEconomicCalendarPage() {
  // Avoid hydration mismatch: keep initial SSR + client render identical,
  // then update to the real origin after mount.
  const [newsBase, setNewsBase] = React.useState("https://traderlaunchpad.com");

  const [widgetStyle, setWidgetStyle] = React.useState<Record<string, string>>(() => ({
    "--tdrlp-bg": "#ffffff",
    "--tdrlp-fg": "#0f172a",
    "--tdrlp-muted": "#475569",
    "--tdrlp-border": "#e2e8f0",
    "--tdrlp-accent": "#2563eb",
    "--tdrlp-radius": "12px",
    "--tdrlp-font":
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  }));

  React.useEffect(() => {
    setNewsBase(window.location.origin);

    const root = document.documentElement;

    const computeWidgetStyleFromTheme = () => {
      const cs = getComputedStyle(root);
      const colorFromVar = (varName: string, fallback: string) => {
        const v = cs.getPropertyValue(varName).trim();
        if (!v) return fallback;
        // Tailwind themes may store colors as raw HSL components ("0 0% 100%")
        // OR as a full color function ("oklch(...)", "lab(...)", "rgb(...)") or hex.
        if (v.includes("(") || v.startsWith("#")) return v;
        return `hsl(${v})`;
      };
      const pxOr = (varName: string, fallback: string) => {
        const v = cs.getPropertyValue(varName).trim();
        return v || fallback;
      };

      setWidgetStyle({
        "--tdrlp-bg": colorFromVar("--background", "#ffffff"),
        "--tdrlp-fg": colorFromVar("--foreground", "#0f172a"),
        "--tdrlp-muted": colorFromVar("--muted-foreground", "#475569"),
        "--tdrlp-border": colorFromVar("--border", "#e2e8f0"),
        "--tdrlp-accent": colorFromVar("--primary", "#2563eb"),
        "--tdrlp-radius": pxOr("--radius", "12px"),
        "--tdrlp-font":
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      });
    };

    // Initial compute (after mount).
    computeWidgetStyleFromTheme();

    // Recompute when theme toggles (typically `html.classList` changes to include/remove `dark`).
    let raf = 0;
    const schedule = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        computeWidgetStyleFromTheme();
      });
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          schedule();
          return;
        }
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const [embedOpen, setEmbedOpen] = React.useState(false);
  const [widgetHost, setWidgetHost] = React.useState("https://traderlaunchpad.com");
  const [apiBase, setApiBase] = React.useState("https://different-trout-684.convex.site");

  const [embedBg, setEmbedBg] = React.useState("#ffffff");
  const [embedFg, setEmbedFg] = React.useState("#0f172a");
  const [embedMuted, setEmbedMuted] = React.useState("#475569");
  const [embedBorder, setEmbedBorder] = React.useState("#e2e8f0");
  const [embedAccent, setEmbedAccent] = React.useState("#2563eb");
  const [embedRadius, setEmbedRadius] = React.useState("12px");

  const [currencyOptions, setCurrencyOptions] = React.useState<{ label: string; value: string }[]>(
    () => [
      { label: "USD", value: "USD" },
      { label: "EUR", value: "EUR" },
      { label: "GBP", value: "GBP" },
      { label: "JPY", value: "JPY" },
      { label: "AUD", value: "AUD" },
      { label: "NZD", value: "NZD" },
      { label: "CAD", value: "CAD" },
      { label: "CHF", value: "CHF" },
    ],
  );
  const [selectedCurrencies, setSelectedCurrencies] = React.useState<string[]>([]);

  React.useEffect(() => {
    setWidgetHost(window.location.origin);

    // Seed embed defaults from the page theme once it has loaded.
    // If the theme values aren't convertible to hex, we fall back to safe defaults.
    const normalizeHex = (v: string, fallback: string) => {
      const s = String(v).trim();
      if (s.startsWith("#")) return s;
      return fallback;
    };
    setEmbedBg(normalizeHex(widgetStyle["--tdrlp-bg"] ?? "", "#ffffff"));
    setEmbedFg(normalizeHex(widgetStyle["--tdrlp-fg"] ?? "", "#0f172a"));
    setEmbedMuted(normalizeHex(widgetStyle["--tdrlp-muted"] ?? "", "#475569"));
    setEmbedBorder(normalizeHex(widgetStyle["--tdrlp-border"] ?? "", "#e2e8f0"));
    setEmbedAccent(normalizeHex(widgetStyle["--tdrlp-accent"] ?? "", "#2563eb"));
    setEmbedRadius(String(widgetStyle["--tdrlp-radius"] ?? "12px"));
  }, [widgetStyle]);

  React.useEffect(() => {
    if (!embedOpen) return;
    let cancelled = false;
    const run = async () => {
      try {
        const apiBaseClean = apiBase.trim().replace(/\/+$/, "").replace(/\/api$/, "");

        // Pull currency universe from the actual widget API for the current week.
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const url = new URL(`${apiBaseClean}/widgets/economic-calendar`);
        url.searchParams.set("fromMs", String(start.getTime()));
        url.searchParams.set("toMs", String(end.getTime()));
        url.searchParams.set("limit", "500");
        const res = await fetch(url.toString(), { method: "GET" });
        if (!res.ok) return;
        const json: unknown = await res.json();
        if (!json || typeof json !== "object") return;
        const rowsUnknown = (json as { rows?: unknown }).rows;
        if (!Array.isArray(rowsUnknown)) return;
        const set = new Set<string>();
        for (const r of rowsUnknown) {
          if (!r || typeof r !== "object") continue;
          const currency = (r as { currency?: unknown }).currency;
          const c = typeof currency === "string" ? currency.trim().toUpperCase() : "";
          if (c) set.add(c);
        }
        const list = Array.from(set)
          .sort()
          .map((c) => ({ label: c, value: c }));
        if (!cancelled && list.length > 0) setCurrencyOptions(list);
      } catch {
        // ignore
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [apiBase, embedOpen]);

  const [embedKind, setEmbedKind] = React.useState<"html" | "react">("html");
  const [copied, setCopied] = React.useState<null | "html" | "react">(null);

  const embedConfig = React.useMemo(() => {
    const cleanBaseUrl = (raw: string) => {
      // Users often paste a Convex deployment root (good) but sometimes include `/api` (bad for httpActions).
      const trimmed = raw.trim().replace(/\/+$/, "");
      return trimmed.endsWith("/api") ? trimmed.slice(0, -"/api".length) : trimmed;
    };

    const widgetHostBase = cleanBaseUrl(widgetHost);
    const apiBaseClean = cleanBaseUrl(apiBase);
    const newsBaseClean = cleanBaseUrl(newsBase);

    const scriptBase = `${widgetHostBase}/widgets/tdrlp-widgets.es.js`;
    // Dev-friendly cache busting (prevents stale bundles in local embed testing).
    const scriptSrc =
      widgetHostBase.includes("localhost") || widgetHostBase.includes("127.0.0.1")
        ? `${scriptBase}?v=dev`
        : scriptBase;

    const currenciesCsv = selectedCurrencies.join(",");
    const hasCurrencies = selectedCurrencies.length > 0;
    const styleCss = [
      `--tdrlp-bg: ${embedBg}`,
      `--tdrlp-fg: ${embedFg}`,
      `--tdrlp-muted: ${embedMuted}`,
      `--tdrlp-border: ${embedBorder}`,
      `--tdrlp-accent: ${embedAccent}`,
      `--tdrlp-radius: ${embedRadius}`,
      `--tdrlp-font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`,
    ].join("; ");

    return {
      apiBase: apiBaseClean,
      newsBase: newsBaseClean,
      scriptSrc,
      styleCss,
      currenciesCsv,
      hasCurrencies,
    };
  }, [
    apiBase,
    embedAccent,
    embedBg,
    embedBorder,
    embedFg,
    embedMuted,
    embedRadius,
    selectedCurrencies,
    newsBase,
    widgetHost,
  ]);

  const embedSnippetHtml = React.useMemo(() => {
    const currenciesAttr = embedConfig.hasCurrencies ? ` currencies="${embedConfig.currenciesCsv}"` : "";
    return [
      `<script type="module" src="${embedConfig.scriptSrc}"></script>`,
      `<tdrlp-economic-calendar`,
      `  api-base="${embedConfig.apiBase}"`,
      `  news-base="${embedConfig.newsBase}"`,
      `  preset="thisWeek"${currenciesAttr}`,
      `  style="${embedConfig.styleCss}"`,
      `></tdrlp-economic-calendar>`,
    ].join("\n");
  }, [embedConfig]);

  const embedSnippetReact = React.useMemo(() => {
    const currenciesLine = embedConfig.hasCurrencies
      ? `        currencies="${embedConfig.currenciesCsv}"`
      : "";
    return [
      `import * as React from "react";`,
      ``,
      `export function EmbeddedEconomicCalendar() {`,
      `  React.useEffect(() => {`,
      `    const s = document.createElement("script");`,
      `    s.type = "module";`,
      `    s.src = "${embedConfig.scriptSrc}";`,
      `    document.head.appendChild(s);`,
      `    return () => {`,
      `      s.remove();`,
      `    };`,
      `  }, []);`,
      ``,
      `  return (`,
      `    // @ts-expect-error - custom element`,
      `    <tdrlp-economic-calendar`,
      `      api-base="${embedConfig.apiBase}"`,
      `      news-base="${embedConfig.newsBase}"`,
      `      preset="thisWeek"`,
      currenciesLine,
      `      style={{`,
      `        ["--tdrlp-bg" as any]: "${embedBg}",`,
      `        ["--tdrlp-fg" as any]: "${embedFg}",`,
      `        ["--tdrlp-muted" as any]: "${embedMuted}",`,
      `        ["--tdrlp-border" as any]: "${embedBorder}",`,
      `        ["--tdrlp-accent" as any]: "${embedAccent}",`,
      `        ["--tdrlp-radius" as any]: "${embedRadius}",`,
      `        ["--tdrlp-font" as any]: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",`,
      `      }}`,
      `    />`,
      `  );`,
      `}`,
      ``,
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    embedAccent,
    embedBg,
    embedBorder,
    embedConfig,
    embedFg,
    embedMuted,
    embedRadius,
  ]);

  const snippetForCurrentTab = embedKind === "react" ? embedSnippetReact : embedSnippetHtml;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">Forex economic calendar</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Economic events ingested into TraderLaunchpad.{" "}
          <Link href="/news" className="underline underline-offset-4 hover:text-foreground">
            View news feed
          </Link>
          .
        </div>
      </div>

      <div className="mb-3 flex items-center justify-end">
        <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              Embed Me
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Embed this calendar</DialogTitle>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Widget host (script src)</Label>
                  <Input value={widgetHost} onChange={(e) => setWidgetHost(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>API base (Convex HTTP)</Label>
                  <Input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Currencies (leave empty = all)</Label>
                <MultiSelect
                  options={currencyOptions}
                  defaultValue={selectedCurrencies}
                  onValueChange={(v) => setSelectedCurrencies(v)}
                  placeholder="All currencies"
                  maxCount={6}
                />
              </div>

              <div className="grid gap-3">
                <div className="text-sm font-medium">Colors</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Background</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={embedBg} onChange={(e) => setEmbedBg(e.target.value)} className="h-9 w-14 p-1" />
                      <Input value={embedBg} onChange={(e) => setEmbedBg(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Foreground</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={embedFg} onChange={(e) => setEmbedFg(e.target.value)} className="h-9 w-14 p-1" />
                      <Input value={embedFg} onChange={(e) => setEmbedFg(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Muted</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={embedMuted} onChange={(e) => setEmbedMuted(e.target.value)} className="h-9 w-14 p-1" />
                      <Input value={embedMuted} onChange={(e) => setEmbedMuted(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Border</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={embedBorder} onChange={(e) => setEmbedBorder(e.target.value)} className="h-9 w-14 p-1" />
                      <Input value={embedBorder} onChange={(e) => setEmbedBorder(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Accent</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={embedAccent} onChange={(e) => setEmbedAccent(e.target.value)} className="h-9 w-14 p-1" />
                      <Input value={embedAccent} onChange={(e) => setEmbedAccent(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Radius</Label>
                    <Input value={embedRadius} onChange={(e) => setEmbedRadius(e.target.value)} placeholder="12px" />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Embed code</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={copied === embedKind ? "secondary" : "default"}
                    onClick={async () => {
                      await navigator.clipboard.writeText(snippetForCurrentTab);
                      setCopied(embedKind);
                      window.setTimeout(() => {
                        setCopied((prev) => (prev === embedKind ? null : prev));
                      }, 1200);
                    }}
                  >
                    {copied === embedKind ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Tabs value={embedKind} onValueChange={(v) => setEmbedKind(v as "html" | "react")}>
                  <TabsList>
                    <TabsTrigger value="html">Generate for HTML</TabsTrigger>
                    <TabsTrigger value="react">Generate for React</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html">
                    <Textarea value={embedSnippetHtml} readOnly className="min-h-40 font-mono text-xs" />
                  </TabsContent>
                  <TabsContent value="react">
                    <Textarea value={embedSnippetReact} readOnly className="min-h-40 font-mono text-xs" />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* @ts-expect-error - custom element */}
      <tdrlp-economic-calendar
        api-base="https://different-trout-684.convex.site"
        news-base={newsBase}
        preset="thisWeek"
        style={widgetStyle}
      />
    </div>
  );
}

