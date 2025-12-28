/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  createImageCache,
  loadPdfJs,
  toPdfJsUrl,
} from "@acme/konva";

const SignatureMaker = dynamic(
  async () => (await import("@docuseal/signature-maker-react")).SignatureMaker,
  { ssr: false },
);

interface BuilderSignatureFieldV1 {
  id: string;
  kind: "signature";
  pageIndex: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  required: boolean;
  label?: string;
}

interface BuilderTemplateV1 {
  version: 1;
  fields: BuilderSignatureFieldV1[];
}

const safeParseBuilderTemplate = (value: unknown): BuilderTemplateV1 | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(value) as BuilderTemplateV1;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.fields)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = new Uint8Array(digest);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};


const DisclaimerSigningCanvas = ({
  templateTitle,
  recipientEmail,
  recipientName,
  pdfUrl,
  pdfVersion,
  signatureFields,
  requiredSignatureFields,
  signatureByFieldId,
  setSignatureByFieldId,
  isPending,
  onFinish,
  isComplete,
  downloadUrl,
  signedAt,
}: {
  templateTitle: string;
  recipientEmail: string;
  recipientName?: string;
  pdfUrl: string;
  pdfVersion: number;
  signatureFields: BuilderSignatureFieldV1[];
  requiredSignatureFields: BuilderSignatureFieldV1[];
  signatureByFieldId: Record<string, string | null>;
  setSignatureByFieldId: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  isPending: boolean;
  onFinish: () => void;
  isComplete: boolean;
  downloadUrl: string | null;
  signedAt: number | null;
}) => {
  const pdfJsUrl = useMemo(() => toPdfJsUrl(pdfUrl), [pdfUrl]);
  const pdfKey = useMemo(
    () => `${pdfJsUrl}:${pdfVersion}`,
    [pdfJsUrl, pdfVersion],
  );

  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [pageSizes, setPageSizes] = useState<
    Array<{ width: number; height: number }>
  >([]);
  const [pageCanvases, setPageCanvases] = useState<
    Array<HTMLCanvasElement | null>
  >([]);

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

  useEffect(() => {
    if (frameSize.width > 0 && frameSize.height > 0) return;
    const node = frameRef.current;
    if (!node) return;
    let rafId: number | null = null;
    let tries = 0;
    const maxTries = 120;
    const tick = () => {
      const rect = node.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 0 && h > 0) {
        setFrameSize({ width: w, height: h });
        return;
      }
      tries += 1;
      if (tries >= maxTries) return;
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [frameSize.height, frameSize.width]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setPageSizes([]);
      setPageCanvases([]);
      setPageCount(1);

      try {
        const pdfjs = await loadPdfJs();
        const loadingTask = pdfjs.getDocument({
          url: pdfJsUrl,
          disableRange: true,
          disableStream: true,
        });
        const doc = await loadingTask.promise;
        const count =
          typeof doc?.numPages === "number" && doc.numPages > 0
            ? doc.numPages
            : 1;
        if (cancelled) return;
        setPageCount(count);
        setPageSizes(
          Array.from({ length: count }, () => ({ width: 612, height: 792 })),
        );
        setPageCanvases(Array.from({ length: count }, () => null));

        // Progressive render: do the first couple pages ASAP, then yield between pages.
        const renderScale = 2;
        const renderPage = async (pageIndex: number) => {
          const page = await doc.getPage(pageIndex + 1);
          const baseViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const ctx2d = canvas.getContext("2d");
          if (!ctx2d) return;
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: ctx2d, viewport }).promise;
          if (cancelled) return;
          setPageSizes((prev) => {
            const next = prev.slice();
            next[pageIndex] = { width: baseViewport.width, height: baseViewport.height };
            return next;
          });
          setPageCanvases((prev) => {
            const next = prev.slice();
            next[pageIndex] = canvas;
            return next;
          });
        };

        const fastCount = Math.min(2, count);
        for (let i = 0; i < fastCount; i++) {
          if (cancelled) return;
          await renderPage(i);
        }

        for (let pageIndex = fastCount; pageIndex < count; pageIndex++) {
          if (cancelled) return;
          // Yield to keep scroll/inputs responsive.
          await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          if (cancelled) return;
          await renderPage(pageIndex);
        }
      } catch {
        if (cancelled) return;
        setPageCount(1);
        setPageSizes([{ width: 612, height: 792 }]);
        setPageCanvases([null]);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pdfKey, pdfJsUrl]);

  const basePageSize = pageSizes[0] ?? { width: 612, height: 792 };
  const pageGapPx = 16;

  // Fit-to-width (desktop-friendly). Height scrolls in the frame (multi-page).
  const scale = useMemo(() => {
    if (frameSize.width <= 0) return 1;
    return Math.min(2, frameSize.width / basePageSize.width);
  }, [basePageSize.width, frameSize.width]);

  const stageWidth = Math.max(1, Math.floor(frameSize.width));

  const fieldsByPageIndex = useMemo(() => {
    const map: Record<number, BuilderSignatureFieldV1[]> = {};
    for (const f of signatureFields) {
      const idx = Math.max(0, f.pageIndex);
      (map[idx] ??= []).push(f);
    }
    return map;
  }, [signatureFields]);

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldSigBase64, setFieldSigBase64] = useState<string | null>(null);

  const openField = useCallback(
    (fieldId: string) => {
      setActiveFieldId(fieldId);
      setFieldSigBase64(signatureByFieldId[fieldId] ?? null);
      setFieldDialogOpen(true);
    },
    [signatureByFieldId],
  );

  const saveFieldSignature = useCallback(() => {
    const fid = activeFieldId ?? null;
    if (!fid) return;
    setSignatureByFieldId((prev) => ({ ...prev, [fid]: fieldSigBase64 }));
    setFieldDialogOpen(false);
  }, [activeFieldId, fieldSigBase64, setSignatureByFieldId]);

  // Used to force a re-render when signature images finish loading.
  const [_signatureImageTick, setSignatureImageTick] = useState(0);

  const signatureImageCache = useMemo(() => createImageCache(), []);

  const getSignatureImage = (fieldId: string) => {
    const base64 = signatureByFieldId[fieldId];
    if (!base64) return null;
    const dataUrl = base64.startsWith("data:")
      ? base64
      : `data:image/png;base64,${base64}`;
    const img = signatureImageCache.get(dataUrl, () =>
      setSignatureImageTick((t) => t + 1),
    );
    return img;
  };

  const [hasStarted, setHasStarted] = useState(false);
  const [highlightFieldId, setHighlightFieldId] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{
    fieldId: string;
    pageIndex: number;
    yPct: number;
  } | null>(null);

  const requiredSignedCount = useMemo(() => {
    return requiredSignatureFields.filter((f) => signatureByFieldId[f.id])
      .length;
  }, [requiredSignatureFields, signatureByFieldId]);
  const requiredCount = requiredSignatureFields.length;
  const allRequiredSigned =
    requiredCount > 0 ? requiredSignedCount >= requiredCount : false;

  useEffect(() => {
    if (isComplete) setHasStarted(true);
  }, [isComplete]);

  useEffect(() => {
    if (!highlightFieldId) return;
    const t = window.setTimeout(() => setHighlightFieldId(null), 2200);
    return () => window.clearTimeout(t);
  }, [highlightFieldId]);

  useEffect(() => {
    if (!scrollTarget) return;
    const node = frameRef.current;
    if (!node) return;
    const idx = Math.max(0, scrollTarget.pageIndex);
    if (!pageSizes[idx]) return;

    let top = 0;
    for (let i = 0; i < idx; i++) {
      const ps = pageSizes[i] ?? basePageSize;
      top += ps.height * scale + pageGapPx;
    }
    const ps = pageSizes[idx] ?? basePageSize;
    top += scrollTarget.yPct * ps.height * scale;

    node.scrollTo({ top: Math.max(0, top - 96), behavior: "smooth" });
    setHighlightFieldId(scrollTarget.fieldId);
    setScrollTarget(null);
  }, [basePageSize, pageGapPx, pageSizes, scale, scrollTarget]);

  const handleStart = useCallback(() => {
    if (isComplete) return;
    setHasStarted(true);
    const firstUnsigned = requiredSignatureFields.find(
      (f) => !signatureByFieldId[f.id],
    );
    if (!firstUnsigned) return;
    setScrollTarget({
      fieldId: firstUnsigned.id,
      pageIndex: Math.max(0, firstUnsigned.pageIndex),
      yPct: firstUnsigned.yPct,
    });
  }, [isComplete, requiredSignatureFields, signatureByFieldId]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    window.open(downloadUrl, "_blank", "noreferrer");
  }, [downloadUrl]);

  const canInteract = hasStarted && !isComplete;

  return (
    <div className="bg-muted/10 relative h-svh w-full">
      <div className="bg-background/80 absolute inset-x-0 top-0 z-10 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {templateTitle}
            </div>
            <div className="text-muted-foreground text-xs">
              {(recipientName ? `${recipientName} • ` : "") + recipientEmail}
              {" • "}
              {isComplete
                ? "Completed"
                : !hasStarted
                  ? `${requiredCount} required field${requiredCount === 1 ? "" : "s"}`
                  : `${requiredSignedCount}/${requiredCount} required signed`}
              {" • "}
              {pageCount} page{pageCount === 1 ? "" : "s"}
              {signedAt
                ? ` • Signed ${new Date(signedAt).toLocaleString()}`
                : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isComplete ? (
              <Button
                type="button"
                onClick={handleDownload}
                disabled={!downloadUrl}
              >
                {downloadUrl ? "Download" : "Preparing…"}
              </Button>
            ) : !hasStarted ? (
              <Button
                type="button"
                onClick={handleStart}
                disabled={requiredCount === 0}
              >
                Start
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onFinish}
                disabled={!allRequiredSigned || isPending}
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pt-14 pb-4">
        <div className="mx-auto h-full w-full max-w-5xl px-4">
          <div
            ref={frameRef}
            className="relative h-full w-full overflow-auto rounded-md border bg-white shadow-sm"
          >
            <div className="flex w-full flex-col gap-4 p-3">
              {Array.from({ length: pageCount }).map((_, pageIndex) => {
                const ps = pageSizes[pageIndex] ?? basePageSize;
                const canvas = pageCanvases[pageIndex] ?? null;
                const fieldsOnPage = fieldsByPageIndex[pageIndex] ?? [];
                const stageHeight = Math.max(1, Math.ceil(ps.height * scale));
                return (
                  <div
                    key={`${pdfKey}:p${pageIndex}`}
                    className="mx-auto w-full max-w-5xl"
                  >
                    <Stage
                      width={stageWidth}
                      height={stageHeight}
                      scaleX={scale}
                      scaleY={scale}
                    >
                      <Layer>
                        <Rect
                          name="canvas-bg"
                          x={0}
                          y={0}
                          width={ps.width}
                          height={ps.height}
                          fill="#ffffff"
                        />

                        {canvas ? (
                          <KonvaImage
                            image={canvas}
                            x={0}
                            y={0}
                            width={ps.width}
                            height={ps.height}
                            listening={false}
                          />
                        ) : (
                          <Text
                            x={24}
                            y={24}
                            text={`Loading page ${pageIndex + 1}…`}
                            fontSize={14}
                            fill="#64748b"
                            listening={false}
                          />
                        )}

                        {fieldsOnPage.map((field) => {
                          const x = field.xPct * ps.width;
                          const y = field.yPct * ps.height;
                          const w = field.wPct * ps.width;
                          const h = field.hPct * ps.height;
                          const done = Boolean(signatureByFieldId[field.id]);
                          const img = done ? getSignatureImage(field.id) : null;
                          const label = field.label ?? "Signature";
                          const isHighlight = highlightFieldId === field.id;
                          return (
                            <Fragment key={field.id}>
                              <Rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                fill={
                                  done
                                    ? "rgba(16,185,129,0.08)"
                                    : canInteract
                                      ? "rgba(59,130,246,0.08)"
                                      : "rgba(148,163,184,0.10)"
                                }
                                stroke={
                                  isHighlight
                                    ? "#f59e0b"
                                    : done
                                      ? "#10b981"
                                      : "#3b82f6"
                                }
                                strokeWidth={isHighlight ? 3 : 2}
                                dash={done ? undefined : [6, 4]}
                                onClick={() => {
                                  if (!canInteract) return;
                                  openField(field.id);
                                }}
                                onTap={() => {
                                  if (!canInteract) return;
                                  openField(field.id);
                                }}
                              />
                              <Text
                                x={x + 6}
                                y={y + 6}
                                text={`${done ? "✓ " : ""}${label}`}
                                fontSize={14}
                                fill={done ? "#065f46" : "#1e3a8a"}
                                listening={false}
                              />
                              {img ? (
                                <KonvaImage
                                  image={img}
                                  x={x + 6}
                                  y={y + 22}
                                  width={Math.max(1, w - 12)}
                                  height={Math.max(1, h - 28)}
                                  listening={false}
                                />
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </Layer>
                    </Stage>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sign field</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-2">
              <SignatureMaker
                withUpload={false}
                withSubmit={false}
                downloadOnSave={false}
                onChange={(event: { base64: string | null }) => {
                  const base64 =
                    typeof event?.base64 === "string" ? event.base64 : null;
                  setFieldSigBase64(base64);
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFieldSigBase64(null)}
              >
                Clear
              </Button>
              <Button type="button" onClick={saveFieldSignature}>
                Apply signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function DisclaimerSignPage() {
  const params = useParams<{ issueId: string }>();
  const issueId = params?.issueId ?? "";
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const tokenHashFromUrl = searchParams.get("tokenHash") ?? "";
  const debug = (searchParams.get("debug") ?? "") === "1";

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (tokenHashFromUrl) {
      setTokenHash(tokenHashFromUrl);
      return () => {
        cancelled = true;
      };
    }
    if (!token) {
      setTokenHash(null);
      return;
    }
    void sha256Hex(token).then((hash) => {
      if (cancelled) return;
      setTokenHash(hash);
      // Remove the raw token from the URL once we have the hash to reduce leakage via referrers/logs.
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("token");
        u.searchParams.set("tokenHash", hash);
        window.history.replaceState(null, "", u.toString());
      } catch {
        // ignore
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, tokenHashFromUrl]);

  const signingContext = useQuery(
    api.plugins.disclaimers.queries.getSigningContext,
    tokenHash && issueId ? { issueId, tokenHash } : "skip",
  ) as
    | {
        status: "incomplete" | "complete";
        recipientEmail: string;
        recipientName?: string | null;
        audit?: {
          sentAt?: number;
          firstViewedAt?: number;
          lastViewedAt?: number;
          viewCount?: number;
          completedAt?: number;
        };
        template: {
          title: string;
          pdfUrl: string;
          pdfVersion: number;
          consentText: string;
          builderTemplateJson?: string | null;
        };
      }
    | null
    | undefined;

  const signingDebug = useQuery(
    api.plugins.disclaimers.queries.getSigningContextDebug,
    debug && tokenHash && issueId ? { issueId, tokenHash } : "skip",
  ) as
    | {
        ok: boolean;
        reason: string;
        checks: Record<string, boolean>;
        snapshot: Record<string, string | null>;
      }
    | null
    | undefined;

  const receipt = useQuery(
    api.plugins.disclaimers.queries.getSigningReceipt,
    signingContext?.status === "complete" && tokenHash && issueId
      ? { issueId, tokenHash }
      : "skip",
  ) as
    | {
        signedAt: number;
        signedName: string;
        signedEmail: string;
        signedPdfUrl: string | null;
        pdfSha256: string;
      }
    | null
    | undefined;

  const submitSignature = useAction(
    (
      api as unknown as {
        plugins: { disclaimers: { actions: { submitSignature: unknown } } };
      }
    ).plugins.disclaimers.actions.submitSignature as never,
  ) as unknown as (args: {
    issueId: string;
    tokenHash: string;
    signatureDataUrl?: string;
    fieldSignatures?: { fieldId: string; signatureDataUrl: string }[];
    ip?: string;
    userAgent?: string;
  }) => Promise<{ signatureId: string; signedPdfFileId: string }>;

  const recordSigningView = useMutation(
    api.plugins.disclaimers.mutations.recordSigningView,
  ) as (args: {
    issueId: string;
    tokenHash: string;
    ip?: string;
    userAgent?: string;
  }) => Promise<null>;

  const [signatureByFieldId, setSignatureByFieldId] = useState<
    Record<string, string | null>
  >({});
  const [isPending, startTransition] = useTransition();

  const fetchClientIp = useCallback(async (): Promise<string | undefined> => {
    try {
      const res = await fetch("/api/client-ip", { cache: "no-store" });
      if (!res.ok) return undefined;
      const json: unknown = await res.json();
      const ip =
        json &&
        typeof json === "object" &&
        "ip" in json &&
        typeof (json as { ip?: unknown }).ip === "string"
          ? (json as { ip: string }).ip.trim()
          : "";
      return ip.length > 0 ? ip : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const hasRecordedViewRef = useRef(false);
  useEffect(() => {
    if (hasRecordedViewRef.current) return;
    if (!tokenHash || !issueId) return;
    if (!signingContext) return;

    // Client-side cooldown to avoid spamming view events (StrictMode/dev + rapid refresh).
    try {
      const key = `disclaimer:view:${issueId}:${tokenHash}`;
      const prev = window.localStorage.getItem(key);
      const prevMs = prev ? Number(prev) : 0;
      const now = Date.now();
      if (Number.isFinite(prevMs) && prevMs > 0 && now - prevMs < 15_000) {
        hasRecordedViewRef.current = true;
        return;
      }
      window.localStorage.setItem(key, String(now));
    } catch {
      // ignore
    }

    hasRecordedViewRef.current = true;
    void (async () => {
      const ip = await fetchClientIp();
      await recordSigningView({
        issueId,
        tokenHash,
        ip,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
    })().catch(() => {
      // Allow retry if it failed due to transient network issues.
      hasRecordedViewRef.current = false;
    });
  }, [fetchClientIp, issueId, recordSigningView, signingContext, tokenHash]);

  const builderTemplate = useMemo(() => {
    const raw = signingContext?.template?.builderTemplateJson ?? null;
    return safeParseBuilderTemplate(raw);
  }, [signingContext?.template?.builderTemplateJson]);

  const signatureFields = useMemo(() => {
    const fields = builderTemplate?.fields ?? [];
    return fields
      .filter((f) => f && f.kind === "signature")
      .sort((a, b) => {
        if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
        if (a.yPct !== b.yPct) return a.yPct - b.yPct;
        return a.xPct - b.xPct;
      });
  }, [builderTemplate?.fields]);

  const requiredSignatureFields = useMemo(
    () => signatureFields.filter((f) => f.required !== false),
    [signatureFields],
  );

  const handleSubmit = () => {
    if (!tokenHash) {
      toast.error("Missing token.");
      return;
    }
    if (!issueId) {
      toast.error("Missing issue ID.");
      return;
    }
    if (!signingContext) {
      toast.error("Invalid or expired link.");
      return;
    }
    if (signingContext.status !== "incomplete") {
      toast.error("This disclaimer has already been completed.");
      return;
    }
    if (requiredSignatureFields.length === 0) {
      toast.error("No signature fields configured.");
      return;
    }

    const missing = requiredSignatureFields.some(
      (f) => !signatureByFieldId[f.id],
    );
    if (missing) {
      toast.error("Please sign all required fields.");
      return;
    }

    startTransition(() => {
      const fieldSignatures = signatureFields
        .map((f) => {
          const raw = signatureByFieldId[f.id];
          if (!raw) return null;
          const signatureDataUrl = raw.startsWith("data:")
            ? raw
            : `data:image/png;base64,${raw}`;
          return { fieldId: f.id, signatureDataUrl };
        })
        .filter((x): x is { fieldId: string; signatureDataUrl: string } =>
          Boolean(x),
        );

      void (async () => {
        const ip = await fetchClientIp();
        return await submitSignature({
          issueId,
          tokenHash,
          fieldSignatures,
          ip,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        });
      })()
        .then(() => {
          toast.success("Signed. Thank you!");
        })
        .catch((err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to submit signature",
          );
        });
    });
  };

  const isLoading =
    signingContext === undefined && tokenHash !== null && issueId.length > 0;
  const invalid = signingContext === null;

  return (
    <div className="w-full">
      {isLoading ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Loading…
          </CardContent>
        </Card>
      ) : null}

      {invalid ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            This link is invalid or expired.
            {debug ? (
              <pre className="text-muted-foreground mt-4 overflow-auto rounded-md border p-3 text-left text-xs">
                {JSON.stringify(signingDebug ?? null, null, 2)}
              </pre>
            ) : (
              <div className="mt-4">
                <Link
                  className="text-primary underline underline-offset-4"
                  href={`?tokenHash=${encodeURIComponent(tokenHashFromUrl || (tokenHash ?? ""))}&debug=1`}
                >
                  Show debug details
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {signingContext && signingContext !== null ? (
        <DisclaimerSigningCanvas
          templateTitle={signingContext.template.title}
          recipientEmail={signingContext.recipientEmail}
          recipientName={signingContext.recipientName ?? undefined}
          pdfUrl={signingContext.template.pdfUrl}
          pdfVersion={signingContext.template.pdfVersion}
          signatureFields={signatureFields}
          requiredSignatureFields={requiredSignatureFields}
          signatureByFieldId={signatureByFieldId}
          setSignatureByFieldId={setSignatureByFieldId}
          isPending={isPending}
          onFinish={handleSubmit}
          isComplete={signingContext.status === "complete"}
          downloadUrl={receipt?.signedPdfUrl ?? null}
          signedAt={receipt?.signedAt ?? null}
        />
      ) : null}
    </div>
  );
}
