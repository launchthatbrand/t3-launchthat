"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
import Konva from "konva";
import { FileText } from "lucide-react";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui/toast";

import type { SignatureFieldElement } from "../components/builder/SignatureInspector";
import { SignatureInspector } from "../components/builder/SignatureInspector";
import { SignaturePalette } from "../components/builder/SignaturePalette";

type BuilderFieldKind = "signature";

type DisclaimerBuilderFieldV1 = {
  id: string;
  kind: BuilderFieldKind;
  pageIndex: number; // 0-based
  xPct: number; // 0..1 from left
  yPct: number; // 0..1 from top
  wPct: number; // 0..1
  hPct: number; // 0..1
  required: boolean;
  label?: string;
};

type DisclaimerTemplateV1 = {
  version: 1;
  fields: DisclaimerBuilderFieldV1[];
};

const apiAny = api as any;

const safeParseTemplate = (value: unknown): DisclaimerTemplateV1 | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(value) as DisclaimerTemplateV1;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.fields)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const randomId = () => Math.random().toString(36).slice(2, 10);

const normalizeField = (
  field: DisclaimerBuilderFieldV1,
): DisclaimerBuilderFieldV1 => ({
  ...field,
  xPct: clamp01(field.xPct),
  yPct: clamp01(field.yPct),
  wPct: clamp01(field.wPct),
  hPct: clamp01(field.hPct),
});

type PdfJsModule = typeof import("pdfjs-dist");

const loadPdfJs = async (): Promise<PdfJsModule> => {
  const mod = (await import("pdfjs-dist")) as PdfJsModule;
  // Configure worker (Next bundler-friendly).
  try {
    const candidates = [
      "pdfjs-dist/build/pdf.worker.min.mjs",
      "pdfjs-dist/build/pdf.worker.min.js",
      "pdfjs-dist/build/pdf.worker.js",
    ];
    for (const candidate of candidates) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (mod as any).GlobalWorkerOptions.workerSrc = new URL(
          candidate,
          import.meta.url,
        ).toString();
        break;
      } catch {
        // Try next candidate.
      }
    }
  } catch {
    // If worker config fails, pdf.js may still work in some environments,
    // but rendering might be slower.
  }
  return mod;
};

const fmt = (v: unknown) => {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const debugLog = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.log("[disclaimers.builder]", ...args.map(fmt));
};

type BuilderContext =
  | {
      pdfUrl: string;
      pdfVersion: number;
      builderTemplateJson?: string | null;
      title?: string | null;
    }
  | null
  | undefined;

export const DisclaimerTemplateBuilderScreen = ({
  templatePostId,
  organizationId,
}: {
  templatePostId: string;
  organizationId?: string;
}) => {
  const ctx = useQuery(
    apiAny.plugins.disclaimers.queries.getTemplateBuilderContext,
    templatePostId
      ? { templatePostId, organizationId: organizationId ?? undefined }
      : "skip",
  ) as BuilderContext;

  const pdfUrl = typeof ctx?.pdfUrl === "string" ? ctx.pdfUrl : "";
  const pdfVersion = typeof ctx?.pdfVersion === "number" ? ctx.pdfVersion : 0;
  const storedTemplate = useMemo(
    () => safeParseTemplate(ctx?.builderTemplateJson ?? null),
    [ctx?.builderTemplateJson],
  );

  const [draft, setDraft] = useState<DisclaimerTemplateV1>({
    version: 1,
    fields: [],
  });
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (storedTemplate) {
      setDraft(storedTemplate);
      initializedRef.current = true;
      return;
    }
    initializedRef.current = true;
  }, [storedTemplate]);

  const [pageCount, setPageCount] = useState<number>(1);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [metaBoxStates, setMetaBoxStates] = useState<Record<string, boolean>>({
    inspector: true,
    document: true,
    fields: true,
  });

  // Immediate preview: selecting/uploading a PDF should update the canvas
  // immediately (even before the Disclaimers component finishes importing it).
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const effectivePdfUrl = previewPdfUrl ?? (pdfUrl.length > 0 ? pdfUrl : null);
  const effectivePdfJsUrl = useMemo(() => {
    if (!effectivePdfUrl) return null;
    // pdf.js fetches the PDF using XHR/fetch and is sensitive to CORS/range behavior.
    // In dev, Convex storage URLs are cross-origin, so proxy them through the portal
    // origin to make pdf.js reliable across refreshes.
    try {
      const u = new URL(effectivePdfUrl);
      if (typeof window !== "undefined") {
        const sameOrigin = u.origin === window.location.origin;
        if (!sameOrigin) {
          return `/api/pdf-proxy?url=${encodeURIComponent(u.toString())}`;
        }
      }
      return u.toString();
    } catch {
      return effectivePdfUrl;
    }
  }, [effectivePdfUrl]);

  // If the user navigates to a different template (new `post_id`), reset all
  // builder-local state so we don't accidentally reuse preview/canvas state.
  useEffect(() => {
    debugLog("template:change", { templatePostId });
    setPreviewPdfUrl(null);
    setPageCanvases([]);
    setPageSizes([]);
    setPageCount(1);
    setActivePageIndex(0);
    setActiveFieldId(null);
  }, [templatePostId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!effectivePdfJsUrl) return;
      try {
        debugLog("pdfjs:getDocument:start", {
          effectivePdfUrl,
          effectivePdfJsUrl,
        });
        const pdfjs = await loadPdfJs();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const loadingTask = (pdfjs as any).getDocument({
          url: effectivePdfJsUrl,
          disableRange: true,
          disableStream: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const doc = (await (loadingTask as any).promise) as any;
        const count =
          typeof doc?.numPages === "number" && doc.numPages > 0
            ? doc.numPages
            : 1;
        debugLog("pdfjs:getDocument:success", { numPages: count });
        if (!cancelled) {
          setPageCount(Math.max(1, count));
          setActivePageIndex((prev) => Math.min(prev, Math.max(0, count - 1)));
        }
      } catch (error) {
        debugLog("pdfjs:getDocument:error", error);
        // Ignore; builder still usable with pageCount=1.
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [effectivePdfJsUrl, effectivePdfUrl, pdfVersion]);

  const activeField = useMemo(() => {
    if (!activeFieldId) return null;
    return draft.fields.find((f) => f.id === activeFieldId) ?? null;
  }, [activeFieldId, draft.fields]);

  const updateTemplateMeta = useMutation(
    (apiAny.plugins.disclaimers.mutations as any).upsertDisclaimerTemplateMeta,
  ) as (args: {
    postId: string;
    organizationId?: string;
    builderTemplateJson?: string;
  }) => Promise<string>;

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 612,
    height: 792,
  });

  const handleAddSignatureField = useCallback(() => {
    const id = `sig_${randomId()}`;
    const defaultW = 200;
    const defaultH = 50;
    const wPct = clamp01(defaultW / pageSize.width);
    const hPct = clamp01(defaultH / pageSize.height);
    setDraft((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id,
          kind: "signature",
          pageIndex: activePageIndex,
          xPct: 0.6,
          yPct: 0.75,
          wPct,
          hPct,
          required: true,
          label: `Signature ${prev.fields.filter((f) => f.kind === "signature").length + 1}`,
        },
      ],
    }));
    setActiveFieldId(id);
  }, [activePageIndex, pageSize.height, pageSize.width]);

  const handleRemoveActiveField = useCallback(() => {
    if (!activeFieldId) return;
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== activeFieldId),
    }));
    setActiveFieldId(null);
  }, [activeFieldId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateTemplateMeta({
        postId: templatePostId,
        organizationId: organizationId ?? undefined,
        builderTemplateJson: JSON.stringify(draft),
      });
      toast.success("Builder layout saved.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save builder layout.");
    } finally {
      setIsSaving(false);
    }
  }, [draft, organizationId, templatePostId, updateTemplateMeta]);

  // Document upload/select (mirror the existing Template PDF meta box behavior).
  type MediaRow = {
    _id: string;
    storageId?: string | null;
    url?: string | null;
    title?: string | null;
    status?: "draft" | "published" | null;
    mimeType?: string | null;
  };
  const isPdfCandidate = (item: MediaRow) => {
    const title = (item.title ?? "").toLowerCase();
    const url = (item.url ?? "").toLowerCase();
    const mime = (item.mimeType ?? "").toLowerCase();
    return (
      mime.includes("pdf") ||
      title.endsWith(".pdf") ||
      url.includes(".pdf") ||
      title.includes("pdf")
    );
  };

  const [search, setSearch] = useState("");
  const [isWorkingPdf, setIsWorkingPdf] = useState(false);
  const generateUploadUrl = useMutation(
    apiAny.core.media.mutations.generateUploadUrl,
  ) as () => Promise<string>;
  const saveMedia = useMutation(apiAny.core.media.mutations.saveMedia) as any;
  const importTemplatePdfAndAttach = useAction(
    apiAny.plugins.disclaimers.actions.importTemplatePdfAndAttach,
  ) as (args: {
    orgId?: string;
    templatePostId: string;
    sourceUrl: string;
  }) => Promise<{ pdfFileId: string }>;

  const mediaResponse = useQuery(
    apiAny.core.media.queries.listMediaItemsWithUrl,
    {
      paginationOpts: { numItems: 60, cursor: null },
      status: "published",
      searchTerm: search.trim().length > 0 ? search.trim() : undefined,
      organizationId: organizationId ?? undefined,
    },
  ) as { page: MediaRow[] } | undefined;

  const libraryItems = useMemo(() => {
    const items = mediaResponse?.page ?? [];
    return [...items].sort((a, b) => {
      const aIsPdf = isPdfCandidate(a) ? 0 : 1;
      const bIsPdf = isPdfCandidate(b) ? 0 : 1;
      if (aIsPdf !== bIsPdf) return aIsPdf - bIsPdf;
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });
  }, [mediaResponse?.page]);

  const handleSelectPdfFromMedia = useCallback(
    async (media: Pick<MediaRow, "url">) => {
      const sourceUrl = typeof media.url === "string" ? media.url : "";
      if (!sourceUrl) {
        toast.error("Selected media item has no URL.");
        return;
      }
      // Update canvas immediately using the media URL.
      debugLog("selectPdfFromMedia", { sourceUrl });
      setPreviewPdfUrl(sourceUrl);
      setIsWorkingPdf(true);
      try {
        await importTemplatePdfAndAttach({
          orgId: organizationId ?? undefined,
          templatePostId,
          sourceUrl,
        });
        debugLog("importTemplatePdfAndAttach:success");
        toast.success("Template PDF updated.");
      } catch (error) {
        debugLog("importTemplatePdfAndAttach:error", error);
        console.error(error);
        toast.error("Failed to update template PDF.");
      } finally {
        setIsWorkingPdf(false);
      }
    },
    [importTemplatePdfAndAttach, organizationId, templatePostId],
  );

  const handleUploadAndAttachPdf = useCallback(
    async (file: File) => {
      setIsWorkingPdf(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!res.ok) throw new Error("Upload failed");
        const json = (await res.json()) as { storageId: string };
        const saved = (await saveMedia({
          organizationId: organizationId ?? undefined,
          storageId: json.storageId as any,
          title: file.name,
          status: "published",
        })) as { url?: string | null };
        if (!saved?.url) throw new Error("Uploaded media has no URL");
        debugLog("uploadPdf:mediaSaved", { url: saved.url });
        setPreviewPdfUrl(saved.url);
        await handleSelectPdfFromMedia({ url: saved.url ?? null });
      } finally {
        setIsWorkingPdf(false);
      }
    },
    [generateUploadUrl, handleSelectPdfFromMedia, organizationId, saveMedia],
  );

  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>(
    {
      width: 0,
      height: 0,
    },
  );

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => {
      setFrameSize({ width: node.clientWidth, height: node.clientHeight });
    });
    ro.observe(node);
    setFrameSize({ width: node.clientWidth, height: node.clientHeight });
    return () => ro.disconnect();
  }, []);

  // In some cases (notably when this screen is mounted inside a tab that was
  // initially hidden), `clientWidth/Height` can read as 0 and ResizeObserver
  // may not fire again soon enough. Poll for a short time until we get a
  // non-zero measurement so the Konva stage can size correctly.
  useEffect(() => {
    // This effect must re-run once the actual canvas container is mounted.
    // On first render we may show a Loading card (no frameRef), so polling would
    // incorrectly no-op if it only depends on frameSize.
    if (frameSize.width > 0 && frameSize.height > 0) return;
    const node = frameRef.current;
    if (!node) return;

    let rafId: number | null = null;
    let tries = 0;
    const maxTries = 60; // ~1s at 60fps

    const tick = () => {
      const rect = node.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 0 && h > 0) {
        debugLog("layout:poll:measured", { w, h });
        setFrameSize({ width: w, height: h });
        return;
      }
      tries += 1;
      if (tries >= maxTries) {
        debugLog("layout:poll:gave_up", { w, h });
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [ctx, frameSize.height, frameSize.width, templatePostId]);

  const [pageCanvases, setPageCanvases] = useState<
    Array<HTMLCanvasElement | null>
  >([]);
  const [pageSizes, setPageSizes] = useState<
    Array<{ width: number; height: number }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!effectivePdfJsUrl) {
        if (!cancelled) {
          setPageCanvases([]);
          setPageSizes([]);
        }
        return;
      }
      try {
        debugLog("pdfjs:renderAllPages:start", {
          effectivePdfUrl,
          effectivePdfJsUrl,
        });
        const pdfjs = await loadPdfJs();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const loadingTask = (pdfjs as any).getDocument({
          url: effectivePdfJsUrl,
          disableRange: true,
          disableStream: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const doc = (await (loadingTask as any).promise) as any;
        const count =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          typeof doc?.numPages === "number" && doc.numPages > 0
            ? doc.numPages
            : 1;
        if (!cancelled) {
          setPageCount(Math.max(1, count));
          setActivePageIndex((prev) => Math.min(prev, Math.max(0, count - 1)));
          setPageCanvases(Array.from({ length: count }, () => null));
          setPageSizes(
            Array.from({ length: count }, () => ({ width: 612, height: 792 })),
          );
        }

        for (let pageIndex = 0; pageIndex < count; pageIndex++) {
          if (cancelled) return;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const page = await doc.getPage(pageIndex + 1);
          const baseViewport = page.getViewport({ scale: 1 });
          const renderScale = 1.5;
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const ctx2d = canvas.getContext("2d");
          if (!ctx2d) continue;
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: ctx2d, viewport }).promise;
          if (cancelled) return;

          const baseSize = {
            width: baseViewport.width,
            height: baseViewport.height,
          };
          setPageSizes((prev) => {
            const next = prev.slice();
            next[pageIndex] = baseSize;
            return next;
          });
          setPageCanvases((prev) => {
            const next = prev.slice();
            next[pageIndex] = canvas;
            return next;
          });
        }
      } catch (error) {
        debugLog("pdfjs:renderAllPages:error", error);
        console.error(error);
        if (!cancelled) {
          setPageCanvases([]);
          setPageSizes([]);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [effectivePdfJsUrl, effectivePdfUrl, pdfVersion]);

  const selectedNodeRef = useRef<Konva.Node | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  const activePageSize = pageSizes[activePageIndex] ?? pageSize;

  useEffect(() => {
    if (!activePageSize) return;
    setPageSize({ width: activePageSize.width, height: activePageSize.height });
  }, [activePageSize.height, activePageSize.width]);

  useEffect(() => {
    // Ensure the Konva layer repaints after PDF canvases stream in.
    layerRef.current?.batchDraw();
  }, [pageCanvases, pageSizes]);

  // For PDF backgrounds, we render via pdf.js onto an HTMLCanvasElement and
  // pass that canvas directly to KonvaImage (more reliable than data URLs).

  const baseDocWidth = pageSizes[0]?.width ?? pageSize.width;
  const scale = useMemo(() => {
    if (frameSize.width <= 0) return 1;
    return Math.min(2, frameSize.width / baseDocWidth);
  }, [baseDocWidth, frameSize.width]);

  const stageWidth = Math.max(1, Math.floor(frameSize.width));
  const pageGapPx = 16;
  const pageGapBase = pageGapPx / (scale || 1);
  const { pageOffsetsBase, docHeightBase } = useMemo(() => {
    const offsets: number[] = [];
    let y = 0;
    for (let i = 0; i < pageCount; i++) {
      offsets[i] = y;
      const ps = pageSizes[i] ?? pageSize;
      y += ps.height + pageGapBase;
    }
    if (y > 0) y -= pageGapBase;
    return { pageOffsetsBase: offsets, docHeightBase: Math.max(1, y) };
  }, [pageCount, pageGapBase, pageSizes, pageSize]);
  const stageHeight = Math.max(1, Math.ceil(docHeightBase * scale));

  useEffect(() => {
    debugLog("layout:metrics", {
      frameSize,
      pageSize,
      stageWidth,
      stageHeight,
      scale,
      hasCanvas: pageCanvases.some(Boolean),
      effectivePdfUrl,
      effectivePdfJsUrl,
    });
  }, [
    frameSize.height,
    frameSize.width,
    activePageSize.height,
    activePageSize.width,
    stageHeight,
    stageWidth,
    scale,
    pageCanvases,
    effectivePdfUrl,
    effectivePdfJsUrl,
  ]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    transformer.nodes(selectedNodeRef.current ? [selectedNodeRef.current] : []);
    transformer.getLayer()?.batchDraw();
  }, [activeFieldId]);

  if (!ctx) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Do not gate the builder behind a PDF: we want the canvas + sidebar to
  // render immediately (like the certificate builder). The canvas area will
  // show an empty state until a PDF is selected/uploaded.

  const activeElement: SignatureFieldElement | null =
    activeField && activeField.kind === "signature"
      ? {
          id: activeField.id,
          pageIndex: activeField.pageIndex,
          xPct: activeField.xPct,
          yPct: activeField.yPct,
          wPct: activeField.wPct,
          hPct: activeField.hPct,
          required: Boolean(activeField.required),
          label: activeField.label ?? undefined,
        }
      : null;

  return (
    <div className="flex flex-col">
      <div className="bg-background/80 sticky top-14 z-10 border-b px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Disclaimer Builder</h2>
            <p className="text-muted-foreground text-sm">
              Upload a PDF and drag signature fields onto the canvas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled>
              {pageCount} page{pageCount === 1 ? "" : "s"}
            </Button>

            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                id="showGrid"
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span>Grid</span>
            </label>

            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save layout"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Accordion
            type="single"
            collapsible
            value={metaBoxStates.inspector ? "inspector" : undefined}
            onValueChange={(value) =>
              setMetaBoxStates((prev) => ({
                ...prev,
                inspector: Boolean(value),
              }))
            }
            className="rounded-lg border"
          >
            <AccordionItem value="inspector" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-left">
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Inspector</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-4">
                <div className="space-y-4 pt-2">
                  <SignatureInspector
                    element={activeElement}
                    pageSize={pageSize}
                    onChange={(patch) => {
                      if (!activeFieldId) return;
                      setDraft((prev) => ({
                        ...prev,
                        fields: prev.fields.map((f) =>
                          f.id === activeFieldId
                            ? normalizeField({ ...f, ...patch })
                            : f,
                        ),
                      }));
                    }}
                    onRemove={handleRemoveActiveField}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            value={metaBoxStates.document ? "document" : undefined}
            onValueChange={(value) =>
              setMetaBoxStates((prev) => ({
                ...prev,
                document: Boolean(value),
              }))
            }
            className="rounded-lg border"
          >
            <AccordionItem value="document" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-left">
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Document</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-4">
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs font-semibold uppercase">
                      Upload new PDF
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={isWorkingPdf}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void handleUploadAndAttachPdf(file).catch((err) => {
                          console.error(err);
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : "Upload failed",
                          );
                        });
                        e.target.value = "";
                      }}
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      Uploading also adds it to the Media Library (Attachments).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs font-semibold uppercase">
                      Media library
                    </Label>
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search PDFs…"
                      disabled={isWorkingPdf}
                    />
                  </div>

                  <div className="max-h-[360px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2">
                      {libraryItems.map((item) => (
                        <button
                          key={String(item._id)}
                          type="button"
                          className="bg-muted/20 hover:bg-muted/40 overflow-hidden rounded border p-2 text-left"
                          onClick={() => void handleSelectPdfFromMedia(item)}
                          title={item.title ?? "PDF"}
                          disabled={isWorkingPdf}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div className="line-clamp-2 text-xs font-medium">
                              {item.title ?? "PDF"}
                            </div>
                          </div>
                          <div className="text-muted-foreground mt-1 text-[11px]">
                            {isPdfCandidate(item) ? "PDF" : "File"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-xs">
                    Showing {libraryItems.length} result
                    {libraryItems.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            value={metaBoxStates.fields ? "fields" : undefined}
            onValueChange={(value) =>
              setMetaBoxStates((prev) => ({ ...prev, fields: Boolean(value) }))
            }
            className="rounded-lg border"
          >
            <AccordionItem value="fields" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-left">
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Fields</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-4">
                <div className="space-y-4 pt-2">
                  <SignaturePalette onAdd={handleAddSignatureField} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="min-h-[520px] lg:h-[calc(100vh-240px)]">
          <div className="mx-auto h-full w-full max-w-[1200px]">
            <div
              ref={frameRef}
              className="h-full w-full overflow-auto rounded-md border bg-white shadow-sm"
            >
              {effectivePdfUrl ? (
                <Stage
                  width={stageWidth}
                  height={stageHeight}
                  scaleX={scale}
                  scaleY={scale}
                  onMouseDown={(e) => {
                    const clickedOnEmpty =
                      e.target === e.target.getStage() ||
                      e.target.name() === "canvas-bg";
                    if (clickedOnEmpty) setActiveFieldId(null);
                  }}
                >
                  <Layer ref={layerRef as any}>
                    {Array.from({ length: pageCount }).map((_, pageIndex) => {
                      const ps = pageSizes[pageIndex] ?? pageSize;
                      const y0 = pageOffsetsBase[pageIndex] ?? 0;
                      const canvas = pageCanvases[pageIndex] ?? null;
                      return (
                        <Group key={`page_${pageIndex}`}>
                          <Rect
                            name="canvas-bg"
                            x={0}
                            y={y0}
                            width={ps.width}
                            height={ps.height}
                            fill="#ffffff"
                          />

                          {canvas ? (
                            <KonvaImage
                              image={canvas}
                              x={0}
                              y={y0}
                              width={ps.width}
                              height={ps.height}
                              listening={false}
                            />
                          ) : (
                            <Text
                              x={24}
                              y={y0 + 24}
                              text={`Loading page ${pageIndex + 1}…`}
                              fontSize={14}
                              fill="#64748b"
                              listening={false}
                            />
                          )}

                          {showGrid
                            ? (() => {
                                const spacing = 20;
                                const cols = Math.floor(ps.width / spacing);
                                const rows = Math.floor(ps.height / spacing);
                                const lines: Array<{
                                  x: number;
                                  y: number;
                                  w: number;
                                  h: number;
                                }> = [];
                                for (let i = 0; i <= cols; i++) {
                                  lines.push({
                                    x: i * spacing,
                                    y: y0,
                                    w: 1,
                                    h: ps.height,
                                  });
                                }
                                for (let j = 0; j <= rows; j++) {
                                  lines.push({
                                    x: 0,
                                    y: y0 + j * spacing,
                                    w: ps.width,
                                    h: 1,
                                  });
                                }
                                return lines.map((line, idx) => (
                                  <Rect
                                    key={`grid_${pageIndex}_${idx}`}
                                    x={line.x}
                                    y={line.y}
                                    width={line.w}
                                    height={line.h}
                                    fill="rgba(0,0,0,0.04)"
                                    listening={false}
                                  />
                                ));
                              })()
                            : null}
                        </Group>
                      );
                    })}

                    {draft.fields.map((rawField) => {
                      const field = normalizeField(rawField);
                      const ps = pageSizes[field.pageIndex] ?? pageSize;
                      const y0 = pageOffsetsBase[field.pageIndex] ?? 0;
                      const isSelected = field.id === activeFieldId;
                      const x = field.xPct * ps.width;
                      const y = y0 + field.yPct * ps.height;
                      const w = Math.max(1, field.wPct * ps.width);
                      const h = Math.max(1, field.hPct * ps.height);
                      const label = `${field.label ?? "Signature"}${
                        field.required ? " (Required)" : ""
                      }`;

                      const pageAtY = (yBase: number) => {
                        for (let i = pageCount - 1; i >= 0; i--) {
                          const top = pageOffsetsBase[i] ?? 0;
                          const size = pageSizes[i] ?? pageSize;
                          if (
                            yBase >= top &&
                            yBase < top + size.height + pageGapBase
                          )
                            return i;
                        }
                        return 0;
                      };

                      return (
                        <Group key={field.id}>
                          <Rect
                            id={field.id}
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            stroke={isSelected ? "#2563eb" : "#111827"}
                            strokeWidth={2}
                            dash={[6, 4]}
                            draggable
                            onClick={() => {
                              setActiveFieldId(field.id);
                              setActivePageIndex(field.pageIndex);
                            }}
                            onTap={() => {
                              setActiveFieldId(field.id);
                              setActivePageIndex(field.pageIndex);
                            }}
                            onDragEnd={(e) => {
                              const node = e.target;
                              const newPageIndex = pageAtY(node.y());
                              const newPs = pageSizes[newPageIndex] ?? pageSize;
                              const yStart = pageOffsetsBase[newPageIndex] ?? 0;
                              const nextX = clamp01(node.x() / newPs.width);
                              const nextY = clamp01(
                                (node.y() - yStart) / newPs.height,
                              );
                              setDraft((prev) => ({
                                ...prev,
                                fields: prev.fields.map((f) =>
                                  f.id === field.id
                                    ? normalizeField({
                                        ...f,
                                        pageIndex: newPageIndex,
                                        xPct: nextX,
                                        yPct: nextY,
                                      })
                                    : f,
                                ),
                              }));
                              setActivePageIndex(newPageIndex);
                            }}
                            onTransformEnd={(e) => {
                              const node = e.target;
                              const scaleX = node.scaleX();
                              const scaleY = node.scaleY();
                              node.scaleX(1);
                              node.scaleY(1);
                              const newPageIndex = pageAtY(node.y());
                              const newPs = pageSizes[newPageIndex] ?? pageSize;
                              const yStart = pageOffsetsBase[newPageIndex] ?? 0;
                              const nextW = clamp01(
                                (node.width() * scaleX) / newPs.width,
                              );
                              const nextH = clamp01(
                                (node.height() * scaleY) / newPs.height,
                              );
                              const nextX = clamp01(node.x() / newPs.width);
                              const nextY = clamp01(
                                (node.y() - yStart) / newPs.height,
                              );
                              setDraft((prev) => ({
                                ...prev,
                                fields: prev.fields.map((f) =>
                                  f.id === field.id
                                    ? normalizeField({
                                        ...f,
                                        pageIndex: newPageIndex,
                                        xPct: nextX,
                                        yPct: nextY,
                                        wPct: nextW,
                                        hPct: nextH,
                                      })
                                    : f,
                                ),
                              }));
                              setActivePageIndex(newPageIndex);
                            }}
                            ref={(node) => {
                              if (isSelected) selectedNodeRef.current = node;
                            }}
                          />
                          <Text
                            x={x + 6}
                            y={y + 6}
                            text={label}
                            fontSize={14}
                            fill="#111827"
                            listening={false}
                          />
                        </Group>
                      );
                    })}

                    <Transformer
                      ref={transformerRef}
                      rotateEnabled={false}
                      keepRatio={false}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 24 || newBox.height < 24)
                          return oldBox;
                        return newBox;
                      }}
                    />
                  </Layer>
                </Stage>
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center p-6 text-sm">
                  Select or upload a PDF in the sidebar to start building.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
