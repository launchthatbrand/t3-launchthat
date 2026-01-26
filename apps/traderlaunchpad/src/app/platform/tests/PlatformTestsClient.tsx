"use client";

import React from "react";
import { useAction, useQuery } from "convex/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";

import { byTestId, platformTests } from "./_tests/registry";
import type { DangerLevel, TestOutput } from "./_tests/types";

const dangerBadgeVariant = (level: DangerLevel) => {
  if (level === "safe") return "secondary";
  if (level === "guarded") return "outline";
  return "destructive";
};

const requiredConfirmation = (level: DangerLevel, testId: string): string => {
  if (level === "safe") return "";
  if (level === "guarded") return "RUN";
  return `RUN ${testId}`;
};

const coerceOutput = (value: unknown): TestOutput | null => {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const kind = typeof v.kind === "string" ? v.kind : "";

  if (kind === "image") {
    const contentType = typeof v.contentType === "string" ? v.contentType : "image/png";
    const base64 = typeof v.base64 === "string" ? v.base64 : "";
    const filename = typeof v.filename === "string" ? v.filename : undefined;
    return { kind: "image", base64, contentType, filename, meta: v.meta };
  }

  if (kind === "text") {
    const text = typeof v.text === "string" ? v.text : "";
    return { kind: "text", text };
  }

  if (kind === "json") {
    return { kind: "json", data: v.data };
  }

  if (kind === "logs") {
    const logs = Array.isArray(v.logs) ? (v.logs as string[]) : [];
    return { kind: "logs", logs, data: v.data };
  }

  // Fallback: show as json.
  return { kind: "json", data: value };
};

const base64ToUint8Array = (b64: string): Uint8Array => {
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const useBlobUrl = (base64: string | null, contentType: string | null) => {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!base64 || !contentType) {
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const u8 = base64ToUint8Array(base64);
    const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: contentType });
    const next = URL.createObjectURL(blob);
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [base64, contentType]);

  return url;
};

export const PlatformTestsClient = () => {
  const previewTest = useAction(api.platform.test.mutations.previewTest);
  const runTest = useAction(api.platform.test.mutations.runTest);

  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [selectedTestId, setSelectedTestId] = React.useState<string>(
    platformTests[0]?.id ?? "",
  );

  const selectedTest = byTestId(selectedTestId);

  const [busy, setBusy] = React.useState<"preview" | "run" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [rawResult, setRawResult] = React.useState<unknown>(null);
  const [confirm, setConfirm] = React.useState("");

  const output = React.useMemo(() => coerceOutput(rawResult), [rawResult]);
  const imageUrl = useBlobUrl(
    output?.kind === "image" ? output.base64 : null,
    output?.kind === "image" ? output.contentType : null,
  );

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    for (const t of platformTests) cats.add(t.category);
    return ["All", ...Array.from(cats).sort()];
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return platformTests.filter((t) => {
      if (activeCategory !== "All" && t.category !== activeCategory) return false;
      if (!q) return true;
      const hay = `${t.title} ${t.description} ${t.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, search]);

  React.useEffect(() => {
    setError(null);
    setRawResult(null);
    setConfirm("");
  }, [selectedTestId]);

  if (!selectedTest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Tests</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No tests registered.
        </CardContent>
      </Card>
    );
  }

  const required = requiredConfirmation(selectedTest.dangerLevel, selectedTest.id);
  const canRun =
    selectedTest.dangerLevel === "safe" ||
    (!!required && confirm.trim().toUpperCase() === required.toUpperCase());

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search tests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={cat === activeCategory ? "default" : "outline"}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            {filtered.map((t) => {
              const active = t.id === selectedTestId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTestId(t.id)}
                  className={[
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-orange-500/40 bg-orange-500/10"
                      : "border-border hover:bg-muted/40",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium leading-tight">{t.title}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {t.id}
                      </div>
                    </div>
                    <Badge variant={dangerBadgeVariant(t.dangerLevel)}>
                      {t.dangerLevel}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 text-sm">
                    {t.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TestRunner
        testId={selectedTest.id}
        dangerLevel={selectedTest.dangerLevel}
        title={selectedTest.title}
        description={selectedTest.description}
        defaults={selectedTest.defaults}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        schema={selectedTest.paramSchema}
        requiredConfirm={required}
        confirm={confirm}
        setConfirm={setConfirm}
        canRun={canRun}
        busy={busy}
        error={error}
        output={output}
        imageUrl={imageUrl}
        onPreview={async (params) => {
          setBusy("preview");
          setError(null);
          setRawResult(null);
          try {
            const res: unknown = await previewTest({ testId: selectedTest.id, params });
            setRawResult(res);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(null);
          }
        }}
        onRun={async (params) => {
          setBusy("run");
          setError(null);
          setRawResult(null);
          try {
            const res: unknown = await runTest({ testId: selectedTest.id, params });
            setRawResult(res);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(null);
          }
        }}
      />
    </div>
  );
};

const TestRunner = (props: {
  testId: string;
  dangerLevel: DangerLevel;
  title: string;
  description: string;
  defaults: Record<string, unknown>;
  schema: any;
  requiredConfirm: string;
  confirm: string;
  setConfirm: (v: string) => void;
  canRun: boolean;
  busy: "preview" | "run" | null;
  error: string | null;
  output: TestOutput | null;
  imageUrl: string | null;
  onPreview: (params: any) => Promise<void>;
  onRun: (params: any) => Promise<void>;
}) => {
  const guilds = useQuery(
    api.platform.test.queries.listDiscordGuildsForPlatformTests,
    props.testId === "png.snapshot.send_discord" ? {} : "skip",
  );
  const fetchGuildChannels = useAction(
    api.platform.test.mutations.fetchDiscordGuildChannelsForPlatformTests,
  );

  const form = useForm({
    resolver: zodResolver(props.schema),
    defaultValues: props.defaults,
    mode: "onChange",
  });

  const [channelOptions, setChannelOptions] = React.useState<
    Array<{ id: string; name: string; type: number }>
  >([]);
  const [channelsBusy, setChannelsBusy] = React.useState(false);
  const watchedGuildId =
    props.testId === "png.snapshot.send_discord"
      ? String(form.watch("guildId" as any) ?? "")
      : "";

  React.useEffect(() => {
    if (props.testId !== "png.snapshot.send_discord") return;
    const guildId = String(watchedGuildId ?? "").trim();
    if (!guildId) {
      setChannelOptions([]);
      form.setValue("channelId" as any, "");
      return;
    }

    let cancelled = false;
    setChannelsBusy(true);
    void fetchGuildChannels({ guildId })
      .then((res: any) => {
        if (cancelled) return;
        const channels = Array.isArray(res?.channels) ? (res.channels as any[]) : [];
        const mapped = channels
          .map((c) => ({
            id: typeof c?.id === "string" ? String(c.id) : "",
            name: typeof c?.name === "string" ? String(c.name) : "",
            type: typeof c?.type === "number" ? Number(c.type) : -1,
          }))
          .filter((c) => c.id && c.name);
        setChannelOptions(mapped);

        const current = String(form.getValues("channelId" as any) ?? "").trim();
        if (current && !mapped.some((c) => c.id === current)) {
          form.setValue("channelId" as any, "");
        }
      })
      .finally(() => {
        if (!cancelled) setChannelsBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchGuildChannels, form, props.testId, watchedGuildId]);

  const fields = React.useMemo(() => Object.keys(props.defaults), [props.defaults]);

  const handlePreview = form.handleSubmit(async (values) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    await props.onPreview(values);
  });

  const handleRun = form.handleSubmit(async (values) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    await props.onRun(values);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{props.title}</CardTitle>
              <div className="text-muted-foreground mt-1 text-sm">
                {props.description}
              </div>
              <div className="text-muted-foreground mt-2 text-xs font-mono">
                {props.testId}
              </div>
            </div>
            <Badge variant={dangerBadgeVariant(props.dangerLevel)}>
              {props.dangerLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form className="space-y-3">
              {fields.map((name) => {
                const isLongText = name === "body" || name === "message";
                const isDiscordSend = props.testId === "png.snapshot.send_discord";
                const isGuildSelect = isDiscordSend && name === "guildId";
                const isChannelSelect = isDiscordSend && name === "channelId";
                return (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs">{name}</FormLabel>
                        <FormControl>
                          {isGuildSelect ? (
                            <Select
                              value={String(field.value ?? "")}
                              onValueChange={(v) => field.onChange(v)}
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue placeholder="Select guild…" />
                              </SelectTrigger>
                              <SelectContent className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]">
                                {(Array.isArray(guilds) ? guilds : []).map((g: any) => {
                                  const guildId = typeof g?.guildId === "string" ? String(g.guildId) : "";
                                  if (!guildId) return null;
                                  const label = typeof g?.guildName === "string" && g.guildName.trim()
                                    ? `${g.guildName} (${guildId})`
                                    : guildId;
                                  return (
                                    <SelectItem key={guildId} value={guildId}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : isChannelSelect ? (
                            <Select
                              value={String(field.value ?? "")}
                              onValueChange={(v) => field.onChange(v)}
                              disabled={!watchedGuildId.trim() || channelsBusy}
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue
                                  placeholder={
                                    !watchedGuildId.trim()
                                      ? "Select guild first…"
                                      : channelsBusy
                                        ? "Loading channels…"
                                        : "Select channel…"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]">
                                {channelOptions.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    #{c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : isLongText ? (
                            <Textarea
                              {...field}
                              value={String(field.value ?? "")}
                              rows={6}
                            />
                          ) : (
                            <Input
                              {...field}
                              value={String(field.value ?? "")}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}

              {props.dangerLevel !== "safe" ? (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <div className="text-sm font-medium">Confirmation required</div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    Type{" "}
                    <span className="font-mono font-semibold">{props.requiredConfirm}</span>{" "}
                    to enable Run.
                  </div>
                  <div className="mt-2">
                    <Input
                      placeholder={props.requiredConfirm}
                      value={props.confirm}
                      onChange={(e) => props.setConfirm(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  disabled={props.busy !== null}
                  onClick={() => void handlePreview()}
                >
                  {props.busy === "preview" ? "Previewing..." : "Preview"}
                </Button>
                <Button
                  type="button"
                  className="h-9 border-0 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                  disabled={props.busy !== null || !props.canRun}
                  onClick={() => void handleRun()}
                >
                  {props.busy === "run" ? "Running..." : "Run"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {props.error ? (
        <Card className="border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-500">{props.error}</CardContent>
        </Card>
      ) : null}

      {props.output ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {props.output.kind === "image" ? (
              <div className="space-y-2">
                {props.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.imageUrl}
                    alt="Preview"
                    className="w-full max-w-[900px] rounded-xl border border-white/10 bg-black/40"
                  />
                ) : null}
                {props.imageUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild type="button" variant="outline" className="h-9">
                      <a
                        href={props.imageUrl}
                        download={props.output.filename ?? "snapshot.png"}
                      >
                        Download PNG
                      </a>
                    </Button>
                    <div className="text-muted-foreground text-xs">
                      {props.output.contentType} · {props.output.base64.length} b64 chars
                    </div>
                  </div>
                ) : null}
                {props.output.meta !== undefined ? (
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                    {JSON.stringify(props.output.meta, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}

            {props.output.kind === "logs" ? (
              <div className="space-y-2">
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[12px] text-white/80">
                  {props.output.logs.join("\n")}
                </pre>
                {props.output.data !== undefined ? (
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                    {JSON.stringify(props.output.data, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}

            {props.output.kind === "text" ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[12px] text-white/80">
                {props.output.text}
              </pre>
            ) : null}

            {props.output.kind === "json" ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {JSON.stringify(props.output.data, null, 2)}
              </pre>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

