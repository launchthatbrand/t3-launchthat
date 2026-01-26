"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import type {
  DiscordTemplateContext,
  DiscordTemplatesPageProps,
} from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useAction, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@acme/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@acme/ui/drawer";
import { Switch } from "@acme/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { useIsMobile } from "@acme/ui/hooks/use-mobile";
import React from "react";
import { Textarea } from "@acme/ui/textarea";
import { DiscordChannelSelect } from "../components";
import { CandlestickChart, Palette, X } from "lucide-react";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type TemplateRow = {
  _id: string;
  name?: string;
  description?: string;
  scope?: "org" | "guild";
  updatedAt?: number;
  template?: string;
  templateJson?: string;
};

const fallbackContext: DiscordTemplateContext = {
  kind: "tradeidea",
  label: "Trade idea",
  description: "Messages that summarize a trade idea.",
  defaultTemplate: [
    "**{{symbol}}** — **{{direction}}** — **{{status}}**",
    "Qty: `{{netQty}}`{{avgEntryPrice}}",
    "{{realizedPnl}}",
    "{{fees}}",
    "{{openedAt}}",
    "{{closedAt}}",
  ]
    .filter(Boolean)
    .join("\n"),
  fields: [
    { key: "symbol", label: "Symbol" },
    { key: "direction", label: "Direction" },
    { key: "status", label: "Status" },
    { key: "netQty", label: "Net quantity" },
    { key: "avgEntryPrice", label: "Avg entry price" },
    { key: "realizedPnl", label: "Realized PnL" },
    { key: "fees", label: "Fees" },
    { key: "openedAt", label: "Opened at" },
    { key: "closedAt", label: "Closed at" },
  ],
};

export function DiscordTemplatesPage({
  api,
  organizationId,
  guildId,
  templateContexts,
  defaultTemplateKind,
  className,
  ui,
}: DiscordTemplatesPageProps) {
  const contexts = React.useMemo(
    () =>
      Array.isArray(templateContexts) && templateContexts.length > 0
        ? templateContexts
        : [fallbackContext],
    [templateContexts],
  );
  const [kind, setKind] = React.useState(
    defaultTemplateKind ?? contexts[0]?.kind ?? "tradeidea",
  );
  const activeContext =
    contexts.find((context) => context.kind === kind) ?? contexts[0];
  const templates = useQuery(api.queries.listTemplates, {
    ...(organizationId ? { organizationId } : {}),
    guildId,
    kind,
  });
  const createTemplate = useMutation(api.mutations.createTemplate);
  const updateTemplate = useMutation(api.mutations.updateTemplate);
  const deleteTemplate = useMutation(api.mutations.deleteTemplate);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [value, setValue] = React.useState(
    activeContext?.defaultTemplate ?? "",
  );
  const [templateJson, setTemplateJson] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Preview / send-test (optional host-app actions)
  const listGuildChannels = useAction(api.actions.listGuildChannels);
  const previewTemplate = useAction(api.actions.previewTemplate ?? "skip");
  const sendTemplateTest = useAction(api.actions.sendTemplateTest ?? "skip");

  const [channels, setChannels] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loadingChannels, setLoadingChannels] = React.useState(false);
  const [testChannelId, setTestChannelId] = React.useState("");
  const [sampleValues, setSampleValues] = React.useState<Record<string, string>>({});
  const [previewing, setPreviewing] = React.useState(false);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState<string>("");
  const [previewImageBase64, setPreviewImageBase64] = React.useState<string | null>(null);
  const [autoPreview, setAutoPreview] = React.useState(true);
  const [isPreviewStale, setIsPreviewStale] = React.useState(false);
  const isMobile = useIsMobile();
  const [designPanel, setDesignPanel] = React.useState<null | "appearance" | "candles">(
    null,
  );

  // Template-owned snapshot attachment state (stored in templateJson).
  const [attachmentsEnabled, setAttachmentsEnabled] = React.useState(false);
  const [useChartImage, setUseChartImage] = React.useState(false);
  const [snapshotLookbackDays, setSnapshotLookbackDays] = React.useState("3");
  const [snapshotShowBadge, setSnapshotShowBadge] = React.useState(true);
  const [snapshotThemeMode, setSnapshotThemeMode] = React.useState<
    "dark" | "light" | "custom"
  >("dark");
  const [snapshotBgColor, setSnapshotBgColor] = React.useState<string>("#000000");
  const [snapshotGridOpacityPct, setSnapshotGridOpacityPct] = React.useState<number>(8);
  const [snapshotGridOpacityPctDraft, setSnapshotGridOpacityPctDraft] =
    React.useState<number>(8);
  const [snapshotGridColorMode, setSnapshotGridColorMode] = React.useState<
    "auto" | "custom"
  >("auto");
  const [snapshotGridColor, setSnapshotGridColor] = React.useState<string>("#FFFFFF");
  const [snapshotCandleSpacingPct, setSnapshotCandleSpacingPct] =
    React.useState<number>(15);
  const [snapshotCandleSpacingPctDraft, setSnapshotCandleSpacingPctDraft] =
    React.useState<number>(15);
  const [snapshotCandleColorsMode, setSnapshotCandleColorsMode] = React.useState<
    "auto" | "custom"
  >("auto");
  const [snapshotCandleColorsModeUi, setSnapshotCandleColorsModeUi] = React.useState<
    "auto" | "custom"
  >("auto");
  const [snapshotCandleUpColor, setSnapshotCandleUpColor] =
    React.useState<string>("#22C55E");
  const [snapshotCandleDownColor, setSnapshotCandleDownColor] =
    React.useState<string>("#EF4444");
  const [snapshotTradeIndicatorShape, setSnapshotTradeIndicatorShape] = React.useState<
    "circle" | "triangle"
  >("circle");

  const normalizeHexColor = React.useCallback((raw: string): string | null => {
    const s = String(raw ?? "").trim();
    if (!s) return null;
    const m = /^#([0-9a-fA-F]{6})$/.exec(s);
    if (!m) return null;
    return `#${(m[1] ?? "").toUpperCase()}`;
  }, []);

  const isDarkHexColor = React.useCallback(
    (raw: string): boolean => {
      const hex = normalizeHexColor(raw);
      if (!hex) return true;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const toLin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const l = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
      return l < 0.5;
    },
    [normalizeHexColor],
  );

  const buildTemplateJson = React.useCallback(() => {
    if (!attachmentsEnabled) return "";
    if (!useChartImage) return "";
    const lookbackDays = Math.max(1, Math.min(30, Math.floor(Number(snapshotLookbackDays) || 3)));
    const bgColor = normalizeHexColor(snapshotBgColor) ?? "#000000";
    const gridOpacity = Math.max(0, Math.min(0.25, snapshotGridOpacityPct / 100));
    const gridColor =
      snapshotGridColorMode === "custom"
        ? normalizeHexColor(snapshotGridColor) ?? undefined
        : undefined;
    const candleSpacingPct = Math.max(0, Math.min(80, Math.round(snapshotCandleSpacingPct)));
    const candleUpColor =
      snapshotCandleColorsMode === "custom"
        ? normalizeHexColor(snapshotCandleUpColor) ?? undefined
        : undefined;
    const candleDownColor =
      snapshotCandleColorsMode === "custom"
        ? normalizeHexColor(snapshotCandleDownColor) ?? undefined
        : undefined;
    const payload = {
      attachments: [
        {
          type: "snapshot_png",
          providerKey: "traderlaunchpad.snapshot",
          params: {
            lookbackDays,
            showSentimentBadge: snapshotShowBadge,
            themeMode: snapshotThemeMode,
            bgColor,
            gridOpacity,
            gridColor,
            candleSpacingPct,
            candleUpColor,
            candleDownColor,
            tradeIndicatorShape: snapshotTradeIndicatorShape,
          },
        },
      ],
    };
    return JSON.stringify(payload);
  }, [
    attachmentsEnabled,
    useChartImage,
    snapshotLookbackDays,
    snapshotShowBadge,
    snapshotThemeMode,
    snapshotBgColor,
    snapshotGridOpacityPct,
    snapshotGridColorMode,
    snapshotGridColor,
    snapshotCandleSpacingPct,
    snapshotCandleColorsMode,
    snapshotCandleColorsModeUi,
    snapshotCandleUpColor,
    snapshotCandleDownColor,
    snapshotTradeIndicatorShape,
    normalizeHexColor,
  ]);

  const previewTemplateJson = React.useMemo(() => buildTemplateJson(), [buildTemplateJson]);

  const refreshChannels = async () => {
    if (!guildId) return;
    setLoadingChannels(true);
    try {
      const res = await listGuildChannels({
        ...(organizationId ? { organizationId } : {}),
        guildId,
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
  }, [guildId, organizationId]);

  React.useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const f of activeContext?.fields ?? []) {
      defaults[f.key] = defaults[f.key] ?? "";
    }
    setSampleValues((prev) => ({ ...defaults, ...prev, symbol: prev.symbol || "BTCUSD" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext?.kind]);

  React.useEffect(() => {
    if (!Array.isArray(templates)) return;
    if (templates.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId && templates.some((row) => row._id === selectedId)) return;
    if (isCreatingNew) return;
    setSelectedId(templates[0]?._id ?? null);
  }, [templates, selectedId, isCreatingNew]);

  React.useEffect(() => {
    const selected = Array.isArray(templates)
      ? templates.find((row) => row._id === selectedId)
      : undefined;
    if (selected) {
      setName(selected.name ?? "");
      setDescription(selected.description ?? "");
      setValue(selected.template ?? "");
      const tj = typeof (selected as any).templateJson === "string" ? String((selected as any).templateJson) : "";
      setTemplateJson(tj);
      // Parse snapshot attachment config.
      let hasSnapshot = false;
      let lookbackDays = 3;
      let showBadge = true;
      let themeMode: "dark" | "light" | "custom" = "dark";
      let bgColor = "#000000";
      let gridOpacityPct = 8;
      let gridColorMode: "auto" | "custom" = "auto";
      let gridColor = "#FFFFFF";
      let candleSpacingPct = 15;
      let candleColorsMode: "auto" | "custom" = "auto";
      let candleUpColor = "#22C55E";
      let candleDownColor = "#EF4444";
      let tradeIndicatorShape: "circle" | "triangle" = "circle";
      try {
        const parsed = tj ? JSON.parse(tj) : null;
        const attachments = Array.isArray(parsed?.attachments) ? parsed.attachments : [];
        const snap = attachments.find((a: any) => a?.type === "snapshot_png") ?? null;
        if (snap) {
          hasSnapshot = true;
          lookbackDays = Math.max(1, Math.min(30, Math.floor(Number(snap?.params?.lookbackDays ?? 3))));
          showBadge =
            typeof snap?.params?.showSentimentBadge === "boolean" ? Boolean(snap.params.showSentimentBadge) : true;

          const themeModeRaw =
            typeof snap?.params?.themeMode === "string"
              ? String(snap.params.themeMode).trim().toLowerCase()
              : "";
          themeMode = themeModeRaw === "light" ? "light" : themeModeRaw === "custom" ? "custom" : "dark";

          const bgRaw =
            typeof snap?.params?.bgColor === "string" ? String(snap.params.bgColor).trim() : "";
          bgColor = normalizeHexColor(bgRaw) ?? "#000000";

          // Back-compat: old "theme" field maps to dark/light/system(default dark).
          const legacyTheme =
            typeof snap?.params?.theme === "string" ? String(snap.params.theme).trim().toLowerCase() : "";
          if (!themeModeRaw && legacyTheme) {
            themeMode = legacyTheme === "light" ? "light" : "dark";
            bgColor = themeMode === "light" ? "#FFFFFF" : "#000000";
          }

          // Keep mode + bg in sync (black/white snap to dark/light; otherwise custom).
          if (bgColor === "#000000") themeMode = "dark";
          else if (bgColor === "#FFFFFF") themeMode = "light";
          else themeMode = "custom";

          const gridOpacityRaw = Number(snap?.params?.gridOpacity ?? NaN);
          if (Number.isFinite(gridOpacityRaw)) {
            gridOpacityPct = Math.max(0, Math.min(25, Math.round(gridOpacityRaw * 100)));
          } else {
            gridOpacityPct = 8;
          }
          const gridColorRaw =
            typeof snap?.params?.gridColor === "string" ? String(snap.params.gridColor).trim() : "";
          const gridColorNorm = normalizeHexColor(gridColorRaw);
          if (gridColorNorm) {
            gridColorMode = "custom";
            gridColor = gridColorNorm;
          } else {
            gridColorMode = "auto";
            gridColor = isDarkHexColor(bgColor) ? "#FFFFFF" : "#020617";
          }

          const candleSpacingRaw = Number(snap?.params?.candleSpacingPct ?? NaN);
          if (Number.isFinite(candleSpacingRaw)) {
            candleSpacingPct = Math.max(0, Math.min(80, Math.round(candleSpacingRaw)));
          }

          const upRaw =
            typeof snap?.params?.candleUpColor === "string"
              ? String(snap.params.candleUpColor).trim()
              : "";
          const downRaw =
            typeof snap?.params?.candleDownColor === "string"
              ? String(snap.params.candleDownColor).trim()
              : "";
          const upNorm = normalizeHexColor(upRaw);
          const downNorm = normalizeHexColor(downRaw);
          if (upNorm || downNorm) {
            candleColorsMode = "custom";
            candleUpColor = upNorm ?? "#22C55E";
            candleDownColor = downNorm ?? "#EF4444";
          } else {
            candleColorsMode = "auto";
            candleUpColor = "#22C55E";
            candleDownColor = "#EF4444";
          }

          const shapeRaw =
            typeof snap?.params?.tradeIndicatorShape === "string"
              ? String(snap.params.tradeIndicatorShape).trim().toLowerCase()
              : "";
          tradeIndicatorShape = shapeRaw === "triangle" ? "triangle" : "circle";
        }
      } catch {
        hasSnapshot = false;
      }
      setAttachmentsEnabled(hasSnapshot);
      setUseChartImage(hasSnapshot);
      setSnapshotLookbackDays(String(lookbackDays));
      setSnapshotShowBadge(showBadge);
      setSnapshotThemeMode(themeMode);
      setSnapshotBgColor(bgColor);
      setSnapshotGridOpacityPct(gridOpacityPct);
      setSnapshotGridOpacityPctDraft(gridOpacityPct);
      setSnapshotGridColorMode(gridColorMode);
      setSnapshotGridColor(gridColor);
      setSnapshotCandleSpacingPct(candleSpacingPct);
      setSnapshotCandleSpacingPctDraft(candleSpacingPct);
      setSnapshotCandleColorsMode(candleColorsMode);
      setSnapshotCandleColorsModeUi(candleColorsMode);
      setSnapshotCandleUpColor(candleUpColor);
      setSnapshotCandleDownColor(candleDownColor);
      setSnapshotTradeIndicatorShape(tradeIndicatorShape);
      return;
    }
    setName("");
    setDescription("");
    setValue(activeContext?.defaultTemplate ?? "");
    setTemplateJson("");
    setAttachmentsEnabled(false);
    setUseChartImage(false);
    setSnapshotLookbackDays("3");
    setSnapshotShowBadge(true);
    setSnapshotThemeMode("dark");
    setSnapshotBgColor("#000000");
    setSnapshotGridOpacityPct(8);
    setSnapshotGridOpacityPctDraft(8);
    setSnapshotGridColorMode("auto");
    setSnapshotGridColor("#FFFFFF");
    setSnapshotCandleSpacingPct(15);
    setSnapshotCandleSpacingPctDraft(15);
    setSnapshotCandleColorsMode("auto");
    setSnapshotCandleColorsModeUi("auto");
    setSnapshotCandleUpColor("#22C55E");
    setSnapshotCandleDownColor("#EF4444");
    setSnapshotTradeIndicatorShape("circle");
  }, [selectedId, templates, activeContext?.defaultTemplate]);

  React.useEffect(() => {
    if (!contexts.some((context) => context.kind === kind)) {
      setKind(contexts[0]?.kind ?? "tradeidea");
    }
  }, [contexts, kind]);

  React.useEffect(() => {
    if (selectedId) {
      setShowEditor(true);
      setIsCreatingNew(false);
    }
  }, [selectedId]);

  const handleCreate = async () => {
    if (!activeContext) return;
    setCreating(true);
    try {
      const templateId = await createTemplate({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        kind: activeContext.kind,
        name: name.trim() || `New ${activeContext.label} template`,
        description: (description.trim() || activeContext.description) ?? "",
        template: value || activeContext.defaultTemplate || "",
        templateJson: previewTemplateJson || undefined,
      });
      setSelectedId(templateId);
      setIsCreatingNew(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) {
      await handleCreate();
      return;
    }
    setSaving(true);
    try {
      await updateTemplate({
        ...(organizationId ? { organizationId } : {}),
        templateId: selectedId,
        name: name.trim() || "Untitled template",
        description: description.trim() || undefined,
        template: value,
        templateJson: previewTemplateJson || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await deleteTemplate({
        ...(organizationId ? { organizationId } : {}),
        templateId: selectedId,
      });
      setSelectedId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleNewTemplate = () => {
    setSelectedId(null);
    setIsCreatingNew(true);
    setShowEditor(true);
    setName("");
    setDescription("");
    setValue(activeContext?.defaultTemplate ?? "");
    setAttachmentsEnabled(false);
    setUseChartImage(false);
    setSnapshotLookbackDays("3");
    setSnapshotShowBadge(true);
    setSnapshotThemeMode("dark");
    setSnapshotBgColor("#000000");
    setSnapshotGridOpacityPct(8);
    setSnapshotGridOpacityPctDraft(8);
    setSnapshotGridColorMode("auto");
    setSnapshotGridColor("#FFFFFF");
    setSnapshotCandleSpacingPct(15);
    setSnapshotCandleSpacingPctDraft(15);
    setSnapshotCandleColorsMode("auto");
    setSnapshotCandleColorsModeUi("auto");
    setSnapshotCandleUpColor("#22C55E");
    setSnapshotCandleDownColor("#EF4444");
    setSnapshotTradeIndicatorShape("circle");
    setPreviewContent("");
    setPreviewImageBase64(null);
  };

  const handleInsertToken = (token: string) => {
    const placeholder = `{{${token}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setValue((prev) => `${prev}${placeholder}`);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = value.slice(0, start) + placeholder + value.slice(end);
    setValue(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + placeholder.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleGeneratePreview = async () => {
    if (!api.actions.previewTemplate) return;
    if (!selectedId && !value) return;
    setPreviewing(true);
    try {
      const res = await previewTemplate({
        ...(organizationId ? { organizationId } : {}),
        templateId: selectedId ?? undefined,
        template: value,
        templateJson: previewTemplateJson || undefined,
        values: sampleValues,
        snapshotSymbol: "BTCUSD",
      });
      setPreviewContent(String((res as any)?.content ?? ""));
      setPreviewImageBase64(
        typeof (res as any)?.imageBase64 === "string" ? (res as any).imageBase64 : null,
      );
      setIsPreviewStale(false);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSendTest = async () => {
    if (!api.actions.sendTemplateTest) return;
    if (!selectedId && !value) return;
    if (!guildId) return;
    if (!testChannelId.trim()) return;
    setSendingTest(true);
    try {
      await sendTemplateTest({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        channelId: testChannelId,
        templateId: selectedId ?? undefined,
        template: value,
        templateJson: previewTemplateJson || undefined,
        values: sampleValues,
        snapshotSymbol: "BTCUSD",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Dynamic preview (debounced) when chart snapshot settings change.
  React.useEffect(() => {
    if (!api.actions.previewTemplate) return;
    if (!showEditor) return;
    if (!attachmentsEnabled || !useChartImage) return;
    setIsPreviewStale(true);
    if (!autoPreview) return;
    const t = window.setTimeout(() => {
      void handleGeneratePreview();
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewTemplateJson,
    autoPreview,
  ]);

  // Immediate preview when enabling chart image.
  React.useEffect(() => {
    if (!api.actions.previewTemplate) return;
    if (!showEditor) return;
    if (!attachmentsEnabled || !useChartImage) return;
    void handleGeneratePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useChartImage]);

  const resetAppearance = React.useCallback(() => {
    setSnapshotThemeMode("dark");
    setSnapshotBgColor("#000000");
    setSnapshotGridOpacityPct(8);
    setSnapshotGridOpacityPctDraft(8);
    setSnapshotGridColorMode("auto");
    setSnapshotGridColor("#FFFFFF");
    setSnapshotCandleColorsMode("auto");
    setSnapshotCandleColorsModeUi("auto");
    setSnapshotCandleUpColor("#22C55E");
    setSnapshotCandleDownColor("#EF4444");
  }, []);

  const resetCandles = React.useCallback(() => {
    setSnapshotCandleSpacingPct(15);
    setSnapshotCandleSpacingPctDraft(15);
    setSnapshotCandleColorsMode("auto");
    setSnapshotCandleColorsModeUi("auto");
    setSnapshotCandleUpColor("#22C55E");
    setSnapshotCandleDownColor("#EF4444");
    setSnapshotTradeIndicatorShape("circle");
  }, []);

  const appearanceControlsBody = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Theme</Label>
        <Select
          value={snapshotThemeMode}
          onValueChange={(v) => {
            const mode = v === "light" ? "light" : v === "custom" ? "custom" : "dark";
            setSnapshotThemeMode(mode);
            if (mode === "dark") setSnapshotBgColor("#000000");
            if (mode === "light") setSnapshotBgColor("#FFFFFF");
            if (mode === "dark" || mode === "light") {
              setSnapshotCandleColorsMode("auto");
              setSnapshotCandleColorsModeUi("auto");
              setSnapshotCandleUpColor("#22C55E");
              setSnapshotCandleDownColor("#EF4444");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Background color</Label>
        <div className="flex items-center gap-2">
          <Input
            value={snapshotBgColor}
            onChange={(e) => {
              const next = String(e.target.value ?? "").trim();
              setSnapshotBgColor(next);
              const n = normalizeHexColor(next);
              if (n === "#000000") {
                setSnapshotThemeMode("dark");
                setSnapshotCandleColorsMode("auto");
                setSnapshotCandleColorsModeUi("auto");
                setSnapshotCandleUpColor("#22C55E");
                setSnapshotCandleDownColor("#EF4444");
              } else if (n === "#FFFFFF") {
                setSnapshotThemeMode("light");
                setSnapshotCandleColorsMode("auto");
                setSnapshotCandleColorsModeUi("auto");
                setSnapshotCandleUpColor("#22C55E");
                setSnapshotCandleDownColor("#EF4444");
              } else if (n) setSnapshotThemeMode("custom");
            }}
            onBlur={() => {
              const n = normalizeHexColor(snapshotBgColor);
              if (n) setSnapshotBgColor(n);
            }}
            placeholder="#000000"
          />
          <input
            aria-label="Pick background color"
            type="color"
            className="h-10 w-12 rounded-md border border-border bg-transparent p-1"
            value={normalizeHexColor(snapshotBgColor) ?? "#000000"}
            onChange={(e) => {
              const next = normalizeHexColor(e.target.value) ?? "#000000";
              setSnapshotBgColor(next);
              if (next === "#000000") {
                setSnapshotThemeMode("dark");
                setSnapshotCandleColorsMode("auto");
                setSnapshotCandleColorsModeUi("auto");
                setSnapshotCandleUpColor("#22C55E");
                setSnapshotCandleDownColor("#EF4444");
              } else if (next === "#FFFFFF") {
                setSnapshotThemeMode("light");
                setSnapshotCandleColorsMode("auto");
                setSnapshotCandleColorsModeUi("auto");
                setSnapshotCandleUpColor("#22C55E");
                setSnapshotCandleDownColor("#EF4444");
              } else setSnapshotThemeMode("custom");
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Dark → black, Light → white. Any other color sets Theme to Custom.
        </p>
      </div>

      <div className="border-t border-border/60 pt-4">
        <div className="space-y-2">
          <Label>Grid line opacity</Label>
          <div className="flex items-center gap-3">
            <input
              aria-label="Grid line opacity"
              type="range"
              min={0}
              max={25}
              step={1}
              className="w-full"
              value={snapshotGridOpacityPctDraft}
              onChange={(e) => {
                setSnapshotGridOpacityPctDraft(
                  Math.max(0, Math.min(25, Number(e.target.value) || 0)),
                );
              }}
              onPointerUp={() => setSnapshotGridOpacityPct(snapshotGridOpacityPctDraft)}
              onMouseUp={() => setSnapshotGridOpacityPct(snapshotGridOpacityPctDraft)}
              onTouchEnd={() => setSnapshotGridOpacityPct(snapshotGridOpacityPctDraft)}
            />
            <Input
              type="number"
              className="w-20"
              value={snapshotGridOpacityPctDraft}
              min={0}
              max={25}
              onChange={(e) => {
                const n = Math.max(0, Math.min(25, Number(e.target.value) || 0));
                setSnapshotGridOpacityPctDraft(n);
                setSnapshotGridOpacityPct(n);
              }}
            />
          </div>
          <p className="text-muted-foreground text-xs">Applied to chart grid lines only.</p>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Grid line color</Label>
          <Select
            value={snapshotGridColorMode}
            onValueChange={(v) => {
              const mode = v === "custom" ? "custom" : "auto";
              setSnapshotGridColorMode(mode);
              if (mode === "custom") {
                const bgIsDark = isDarkHexColor(snapshotBgColor);
                setSnapshotGridColor(bgIsDark ? "#FFFFFF" : "#020617");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (reactive)</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {snapshotGridColorMode === "custom" ? (
            <div className="flex items-center gap-2">
              <Input
                value={snapshotGridColor}
                onChange={(e) => setSnapshotGridColor(String(e.target.value ?? "").trim())}
                onBlur={() => {
                  const n = normalizeHexColor(snapshotGridColor);
                  if (n) setSnapshotGridColor(n);
                }}
                placeholder="#FFFFFF"
              />
              <input
                aria-label="Pick grid line color"
                type="color"
                className="h-10 w-12 rounded-md border border-border bg-transparent p-1"
                value={normalizeHexColor(snapshotGridColor) ?? "#FFFFFF"}
                onChange={(e) =>
                  setSnapshotGridColor(normalizeHexColor(e.target.value) ?? "#FFFFFF")
                }
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Auto picks white-on-dark / black-on-light based on background.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const candlesControlsBody = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Candle spacing</Label>
        <div className="flex items-center gap-3">
          <input
            aria-label="Candle spacing"
            type="range"
            min={0}
            max={80}
            step={1}
            className="w-full"
            value={snapshotCandleSpacingPctDraft}
            onChange={(e) => {
              setSnapshotCandleSpacingPctDraft(
                Math.max(0, Math.min(80, Number(e.target.value) || 0)),
              );
            }}
            onPointerUp={() => setSnapshotCandleSpacingPct(snapshotCandleSpacingPctDraft)}
            onMouseUp={() => setSnapshotCandleSpacingPct(snapshotCandleSpacingPctDraft)}
            onTouchEnd={() => setSnapshotCandleSpacingPct(snapshotCandleSpacingPctDraft)}
          />
          <Input
            type="number"
            className="w-20"
            value={snapshotCandleSpacingPctDraft}
            min={0}
            max={80}
            onChange={(e) => {
              const n = Math.max(0, Math.min(80, Number(e.target.value) || 0));
              setSnapshotCandleSpacingPctDraft(n);
              setSnapshotCandleSpacingPct(n);
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Higher = thinner candles with more space between.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Candle colors</Label>
        <Select
          value={snapshotCandleColorsModeUi}
          onValueChange={(v) => {
            const mode = v === "custom" ? "custom" : "auto";
            setSnapshotCandleColorsModeUi(mode);
            if (mode === "auto") {
              // Commit immediately when switching back to auto.
              setSnapshotCandleColorsMode("auto");
              setSnapshotCandleUpColor("#22C55E");
              setSnapshotCandleDownColor("#EF4444");
            }
            // If switching to custom, do NOT commit yet—wait until a color changes.
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (default)</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {snapshotCandleColorsModeUi === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bullish (up)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={snapshotCandleUpColor}
                  onChange={(e) => {
                    const next = String(e.target.value ?? "").trim();
                    setSnapshotCandleUpColor(next);
                    if (normalizeHexColor(next)) {
                      setSnapshotCandleColorsModeUi("custom");
                      setSnapshotCandleColorsMode("custom");
                    }
                  }}
                  onBlur={() => {
                    const n = normalizeHexColor(snapshotCandleUpColor);
                    if (n) {
                      setSnapshotCandleUpColor(n);
                      setSnapshotCandleColorsModeUi("custom");
                      setSnapshotCandleColorsMode("custom");
                    }
                  }}
                  placeholder="#22C55E"
                />
                <input
                  aria-label="Pick bullish candle color"
                  type="color"
                  className="h-10 w-12 rounded-md border border-border bg-transparent p-1"
                  value={normalizeHexColor(snapshotCandleUpColor) ?? "#22C55E"}
                  onChange={(e) => {
                    const next = normalizeHexColor(e.target.value) ?? "#22C55E";
                    setSnapshotCandleUpColor(next);
                    setSnapshotCandleColorsModeUi("custom");
                    setSnapshotCandleColorsMode("custom");
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bearish (down)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={snapshotCandleDownColor}
                  onChange={(e) => {
                    const next = String(e.target.value ?? "").trim();
                    setSnapshotCandleDownColor(next);
                    if (normalizeHexColor(next)) {
                      setSnapshotCandleColorsModeUi("custom");
                      setSnapshotCandleColorsMode("custom");
                    }
                  }}
                  onBlur={() => {
                    const n = normalizeHexColor(snapshotCandleDownColor);
                    if (n) {
                      setSnapshotCandleDownColor(n);
                      setSnapshotCandleColorsModeUi("custom");
                      setSnapshotCandleColorsMode("custom");
                    }
                  }}
                  placeholder="#EF4444"
                />
                <input
                  aria-label="Pick bearish candle color"
                  type="color"
                  className="h-10 w-12 rounded-md border border-border bg-transparent p-1"
                  value={normalizeHexColor(snapshotCandleDownColor) ?? "#EF4444"}
                  onChange={(e) => {
                    const next = normalizeHexColor(e.target.value) ?? "#EF4444";
                    setSnapshotCandleDownColor(next);
                    setSnapshotCandleColorsModeUi("custom");
                    setSnapshotCandleColorsMode("custom");
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Trade indicator shape</Label>
        <Select
          value={snapshotTradeIndicatorShape}
          onValueChange={(v) =>
            setSnapshotTradeIndicatorShape(v === "triangle" ? "triangle" : "circle")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="triangle">Triangle</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Triangle points toward the candle (up for buys below bars, down for sells above).
        </p>
      </div>
    </div>
  );

  const appearanceControlsPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Appearance</div>
        <Button type="button" variant="ghost" size="sm" onClick={resetAppearance}>
          Reset
        </Button>
      </div>
      {appearanceControlsBody}
    </div>
  );

  const candlesControlsPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Candles</div>
        <Button type="button" variant="ghost" size="sm" onClick={resetCandles}>
          Reset
        </Button>
      </div>
      {candlesControlsBody}
    </div>
  );

  return (
    <div className={cx(className, ui?.pageClassName)}>


      <div className="space-y-6">
        <EntityList
          title="Template library"
          description="Create and manage templates per message type."
          data={(templates ?? []) as TemplateRow[]}
          className={ui?.listClassName}
          columns={[
            {
              id: "name",
              header: "Template",
              accessorKey: "name",
              cell: (row: TemplateRow) => (
                <div>
                  <div className="text-foreground text-sm font-medium">
                    {row.name ?? "Untitled template"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {row.description ?? "—"}
                  </div>
                </div>
              ),
            },
            {
              id: "scope",
              header: "Scope",
              accessorKey: "scope",
              cell: (row: TemplateRow) => (
                <Badge variant="secondary" className={ui?.badgeClassName}>
                  {row.scope === "guild" ? "Guild" : "Org"}
                </Badge>
              ),
            },
            {
              id: "updatedAt",
              header: "Updated",
              accessorKey: "updatedAt",
              cell: (row: TemplateRow) =>
                row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—",
            },
          ]}
          enableSearch
          selectedId={selectedId}
          getRowId={(row: any) => String(row._id)}
          onRowClick={(row: any) => {
            setSelectedId(String(row._id));
            setShowEditor(true);
            setIsCreatingNew(false);
          }}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {contexts.length > 1 ? (
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contexts.map((context) => (
                      <SelectItem key={context.kind} value={context.kind}>
                        {context.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Button
                onClick={handleNewTemplate}
                disabled={creating}
                className={ui?.buttonClassName}
              >
                {creating ? "Creating..." : "New template"}
              </Button>
            </div>
          }
          emptyState={
            <div
              className={cx(
                "text-muted-foreground rounded-lg border border-dashed p-6 text-sm",
                ui?.emptyStateClassName,
              )}
            >
              No templates yet. Click “New template” to create your first one.
            </div>
          }
        />

        {showEditor ? (
          <Card className={ui?.cardClassName}>
            <CardHeader className={cx("space-y-2", ui?.cardHeaderClassName)}>
              <CardTitle className={ui?.cardTitleClassName}>
                Template editor
              </CardTitle>
              <CardDescription className={ui?.cardDescriptionClassName}>
                {activeContext?.description ??
                  "Define the message body and insert available fields."}
              </CardDescription>
            </CardHeader>
            <CardContent className={cx("space-y-5", ui?.cardContentClassName)}>
              {!selectedId && (templates?.length ?? 0) === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  Fill out the form and click “Create template”.
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template name</Label>
                  <Input
                    id="templateName"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Trade idea recap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Input
                    id="templateDescription"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Used for mentor trade feed posts"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateBody">Message body</Label>
                <Textarea
                  ref={textareaRef}
                  id="templateBody"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  rows={10}
                  placeholder="Write your Discord message..."
                />
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-4">
                <div className="text-sm font-semibold">Attachments</div>

                <div className="space-y-2">
                  <Label>Enable attachments</Label>
                  <Select
                    value={attachmentsEnabled ? "true" : "false"}
                    onValueChange={(v) => setAttachmentsEnabled(v === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Disabled</SelectItem>
                      <SelectItem value="true">Enabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {attachmentsEnabled ? (
                  <>
                    <div className="space-y-2">
                      <Label>Use Chart Image</Label>
                      <Select
                        value={useChartImage ? "true" : "false"}
                        onValueChange={(v) => setUseChartImage(v === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {useChartImage ? (
                      <>
                        <div className="mt-2 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">Snapshot basics</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSnapshotLookbackDays("3");
                                setSnapshotShowBadge(true);
                              }}
                            >
                              Reset
                            </Button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Lookback days</Label>
                              <Select
                                value={snapshotLookbackDays}
                                onValueChange={(v) => setSnapshotLookbackDays(v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 30 }).map((_, i) => {
                                    const n = String(i + 1);
                                    return (
                                      <SelectItem key={n} value={n}>
                                        {n}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Show market sentiment badge</Label>
                              <Select
                                value={snapshotShowBadge ? "true" : "false"}
                                onValueChange={(v) => setSnapshotShowBadge(v === "true")}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground text-xs">
                          Preview/test uses <span className="font-medium">BTCUSD</span>. Saved on the template for automations too.
                        </p>

                        {api.actions.previewTemplate ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Label>Chart preview</Label>
                                {isPreviewStale ? (
                                  <Badge variant="secondary" className="text-xs">
                                    Preview out of date
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-muted-foreground text-xs">Auto preview</Label>
                                  <Switch
                                    checked={autoPreview}
                                    onCheckedChange={(v) => setAutoPreview(Boolean(v))}
                                  />
                                </div>
                                {isMobile ? (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className={ui?.outlineButtonClassName}
                                          aria-label="Open candle styling"
                                          onClick={() => setDesignPanel("candles")}
                                        >
                                          <CandlestickChart className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent sideOffset={6}>Candles</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className={ui?.outlineButtonClassName}
                                          aria-label="Open background and grid styling"
                                          onClick={() => setDesignPanel("appearance")}
                                        >
                                          <Palette className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent sideOffset={6}>Appearance</TooltipContent>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className={ui?.outlineButtonClassName}
                                          aria-label="Open candle styling"
                                        >
                                          <CandlestickChart className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align="end"
                                        className="w-[380px] max-w-[calc(100vw-2rem)]"
                                      >
                                        {candlesControlsPanel}
                                      </PopoverContent>
                                    </Popover>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className={ui?.outlineButtonClassName}
                                          aria-label="Open background and grid styling"
                                        >
                                          <Palette className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align="end"
                                        className="w-[380px] max-w-[calc(100vw-2rem)]"
                                      >
                                        {appearanceControlsPanel}
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  className={ui?.outlineButtonClassName}
                                  disabled={previewing}
                                  onClick={() => void handleGeneratePreview()}
                                >
                                  {previewing ? "Rendering..." : "Refresh preview"}
                                </Button>
                              </div>
                            </div>
                            {isMobile ? (
                              <Drawer
                                open={designPanel !== null}
                                onOpenChange={(open) => {
                                  if (!open) setDesignPanel(null);
                                }}
                              >
                                <DrawerContent className="p-0">
                                  <DrawerHeader className="relative">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-3 top-3 h-9 w-9"
                                      onClick={() => setDesignPanel(null)}
                                      aria-label="Close"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <DrawerTitle>
                                      {designPanel === "candles"
                                        ? "Candles"
                                        : designPanel === "appearance"
                                          ? "Appearance"
                                          : "Design"}
                                    </DrawerTitle>
                                    <DrawerDescription>
                                      Adjust snapshot styling used for previews, tests, and automations.
                                    </DrawerDescription>
                                  </DrawerHeader>
                                  <div className="max-h-[60vh] overflow-auto px-4 pb-4">
                                    <div className="flex items-center justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (designPanel === "candles") resetCandles();
                                          if (designPanel === "appearance") resetAppearance();
                                        }}
                                        disabled={designPanel === null}
                                      >
                                        Reset
                                      </Button>
                                    </div>
                                    {designPanel === "candles"
                                      ? candlesControlsBody
                                      : designPanel === "appearance"
                                        ? appearanceControlsBody
                                        : null}
                                  </div>
                                </DrawerContent>
                              </Drawer>
                            ) : null}
                            {previewImageBase64 ? (
                              <img
                                alt="Template chart preview"
                                className="max-w-full rounded-md border border-border/60"
                                src={`data:image/png;base64,${previewImageBase64}`}
                              />
                            ) : (
                              <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                                Enable “Use Chart Image” to render a preview.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                            Preview pipeline not enabled in this host app yet.
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    When disabled, attachment settings are hidden and nothing is attached.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Available fields</Label>
                <div className="flex flex-wrap gap-2">
                  {(activeContext?.fields ?? []).map((field) => (
                    <Button
                      key={field.key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleInsertToken(field.key)}
                    >
                      {`{{${field.key}}}`}
                    </Button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Click a field to insert the placeholder into the message.
                </p>
              </div>

              {guildId ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Test channel</Label>
                    <DiscordChannelSelect
                      value={testChannelId}
                      onChange={setTestChannelId}
                      options={channels}
                      placeholder={loadingChannels ? "Loading..." : "Pick a channel..."}
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <Button
                      variant="outline"
                      className={ui?.outlineButtonClassName}
                      disabled={loadingChannels}
                      onClick={() => void refreshChannels()}
                    >
                      {loadingChannels ? "Refreshing..." : "Refresh channels"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || creating}
                  className={ui?.buttonClassName}
                >
                  {saving || creating
                    ? "Saving..."
                    : selectedId
                      ? "Save changes"
                      : "Create template"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={!selectedId || deleting}
                  className={ui?.outlineButtonClassName}
                >
                  {deleting ? "Deleting..." : "Delete template"}
                </Button>
                {guildId ? (
                  <Button
                    variant="outline"
                    className={ui?.outlineButtonClassName}
                    disabled={
                      !api.actions.sendTemplateTest ||
                      !testChannelId ||
                      sendingTest ||
                      previewing ||
                      creating
                    }
                    onClick={() => void handleSendTest()}
                  >
                    {sendingTest ? "Testing..." : "Test"}
                  </Button>
                ) : null}
              </div>

              {previewContent ? (
                <div className="space-y-2">
                  <Label>Rendered content</Label>
                  <pre className="bg-muted/40 border border-border/60 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {previewContent}
                  </pre>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

      </div>
    </div>
  );
}
