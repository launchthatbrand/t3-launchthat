/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { useAction, useQuery } from "convex/react";
import { Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

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

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
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
        mod.GlobalWorkerOptions.workerSrc = new URL(
          candidate,
          import.meta.url,
        ).toString();
        break;
      } catch {
        // try next
      }
    }
  } catch {
    // ignore
  }
  return mod;
};

const toPdfJsUrl = (rawUrl: string) => {
  try {
    const u = new URL(rawUrl);
    if (typeof window !== "undefined") {
      if (u.origin !== window.location.origin) {
        return `/api/pdf-proxy?url=${encodeURIComponent(u.toString())}`;
      }
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
};

const parseSignatureDataUrlToImage = (dataUrl: string) => {
  const img = new window.Image();
  img.src = dataUrl;
  return img;
};

const DisclaimerSigningCanvas = ({
  templateTitle,
  pdfUrl,
  pdfVersion,
  consentText,
  signatureFields,
  requiredSignatureFields,
  signatureByFieldId,
  setSignatureByFieldId,
  signedName,
  setSignedName,
  signedEmail,
  setSignedEmail,
  hasConsented,
  setHasConsented,
  isPending,
  onSubmit,
}: {
  templateTitle: string;
  pdfUrl: string;
  pdfVersion: number;
  consentText: string;
  signatureFields: BuilderSignatureFieldV1[];
  requiredSignatureFields: BuilderSignatureFieldV1[];
  signatureByFieldId: Record<string, string | null>;
  setSignatureByFieldId: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  signedName: string;
  setSignedName: Dispatch<SetStateAction<string>>;
  signedEmail: string;
  setSignedEmail: Dispatch<SetStateAction<string>>;
  hasConsented: boolean;
  setHasConsented: Dispatch<SetStateAction<boolean>>;
  isPending: boolean;
  onSubmit: () => void;
}) => {
  const pdfJsUrl = useMemo(() => toPdfJsUrl(pdfUrl), [pdfUrl]);
  const pdfKey = useMemo(
    () => `${pdfJsUrl}:${pdfVersion}`,
    [pdfJsUrl, pdfVersion],
  );

  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [pageCanvas, setPageCanvas] = useState<HTMLCanvasElement | null>(null);

  const pageCanvasCache = useRef<
    Record<
      string,
      {
        canvas: HTMLCanvasElement;
        pageSize: { width: number; height: number };
      } | null
    >
  >({});

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
        if (!cancelled) setPageCount(count);
      } catch {
        if (!cancelled) setPageCount(1);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pdfKey, pdfJsUrl]);

  useEffect(() => {
    const first = requiredSignatureFields.find(
      (f) => !signatureByFieldId[f.id],
    );
    if (!first) return;
    setActivePageIndex(Math.max(0, first.pageIndex));
  }, [requiredSignatureFields, signatureByFieldId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const cacheKey = `${pdfKey}:p${activePageIndex}`;
      const cached = pageCanvasCache.current[cacheKey];
      if (cached) {
        setPageCanvas(cached.canvas);
        setPageSize(cached.pageSize);
        return;
      }
      pageCanvasCache.current[cacheKey] = null;
      try {
        const pdfjs = await loadPdfJs();
        const loadingTask = pdfjs.getDocument({
          url: pdfJsUrl,
          disableRange: true,
          disableStream: true,
        });
        const doc = await loadingTask.promise;
        const page = await doc.getPage(activePageIndex + 1);
        const baseViewport = page.getViewport({ scale: 1 });
        const renderScale = 2;
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: ctx2d, viewport }).promise;
        if (cancelled) return;
        pageCanvasCache.current[cacheKey] = {
          canvas,
          pageSize: { width: baseViewport.width, height: baseViewport.height },
        };
        setPageCanvas(canvas);
        setPageSize({ width: baseViewport.width, height: baseViewport.height });
      } catch {
        if (!cancelled) setPageCanvas(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [activePageIndex, pdfJsUrl, pdfKey]);

  // Fit-to-width (desktop-friendly). Height can scroll inside the frame.
  const scale = useMemo(() => {
    if (frameSize.width <= 0) return 1;
    // Clamp to 2x since we render the PDF canvas at 2x for crispness.
    return Math.min(2, frameSize.width / pageSize.width);
  }, [frameSize.width, pageSize.width]);

  const stageWidth = Math.max(1, Math.floor(frameSize.width));
  const stageHeight = Math.max(1, Math.ceil(pageSize.height * scale));

  const fieldsOnPage = useMemo(() => {
    return signatureFields.filter((f) => f.pageIndex === activePageIndex);
  }, [activePageIndex, signatureFields]);

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

  const signatureImageCache = useRef<Record<string, HTMLImageElement | null>>(
    {},
  );
  const getSignatureImage = (fieldId: string) => {
    const base64 = signatureByFieldId[fieldId];
    if (!base64) return null;
    const dataUrl = base64.startsWith("data:")
      ? base64
      : `data:image/png;base64,${base64}`;
    const existing = signatureImageCache.current[dataUrl];
    if (existing) return existing;
    const img = parseSignatureDataUrlToImage(dataUrl);
    img.onload = () => {
      signatureImageCache.current[dataUrl] = img;
    };
    signatureImageCache.current[dataUrl] = null;
    return null;
  };

  return (
    <div className="bg-muted/10 relative h-svh w-full">
      <div className="bg-background/80 absolute inset-x-0 top-0 z-10 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {templateTitle}
            </div>
            <div className="text-muted-foreground text-xs">
              Click a field to sign • Page {activePageIndex + 1} / {pageCount}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activePageIndex <= 0}
              onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activePageIndex >= pageCount - 1}
              onClick={() =>
                setActivePageIndex((p) => Math.min(pageCount - 1, p + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pt-14 pb-44">
        <div className="mx-auto h-full w-full max-w-5xl px-4">
          <div
            ref={frameRef}
            className="h-full w-full overflow-auto rounded-md border bg-white shadow-sm"
          >
            {pageCanvas ? (
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
                    width={pageSize.width}
                    height={pageSize.height}
                    fill="#ffffff"
                  />
                  <KonvaImage
                    image={pageCanvas}
                    x={0}
                    y={0}
                    width={pageSize.width}
                    height={pageSize.height}
                    listening={false}
                  />

                  {fieldsOnPage.map((field) => {
                    const x = field.xPct * pageSize.width;
                    const y = field.yPct * pageSize.height;
                    const w = field.wPct * pageSize.width;
                    const h = field.hPct * pageSize.height;
                    const done = Boolean(signatureByFieldId[field.id]);
                    const img = done ? getSignatureImage(field.id) : null;
                    const label = field.label ?? "Signature";
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
                              : "rgba(59,130,246,0.08)"
                          }
                          stroke={done ? "#10b981" : "#3b82f6"}
                          strokeWidth={2}
                          dash={done ? undefined : [6, 4]}
                          onClick={() => openField(field.id)}
                          onTap={() => openField(field.id)}
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
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center p-6 text-sm">
                Loading document…
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background/90 absolute inset-x-0 bottom-0 z-10 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={signedEmail}
                onChange={(e) => setSignedEmail(e.target.value)}
                inputMode="email"
              />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="text-muted-foreground text-xs">
                {
                  requiredSignatureFields.filter(
                    (f) => signatureByFieldId[f.id],
                  ).length
                }{" "}
                / {requiredSignatureFields.length} required fields signed
              </div>
              <Button onClick={onSubmit} disabled={isPending}>
                Submit signature
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={hasConsented}
              onCheckedChange={(v) => setHasConsented(Boolean(v))}
            />
            <Label htmlFor="consent" className="leading-snug">
              {consentText}
            </Label>
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
      if (!cancelled) setTokenHash(hash);
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
    api.plugins.disclaimers.actions.submitSignature,
  ) as (args: {
    issueId: string;
    tokenHash: string;
    signatureDataUrl?: string;
    fieldSignatures?: { fieldId: string; signatureDataUrl: string }[];
    signedName: string;
    signedEmail: string;
    consentText: string;
    userAgent?: string;
  }) => Promise<{ signatureId: string; signedPdfFileId: string }>;

  const [signedName, setSignedName] = useState("");
  const [signedEmail, setSignedEmail] = useState("");
  const [hasConsented, setHasConsented] = useState(false);
  const [signatureBase64, _setSignatureBase64] = useState<string | null>(null);
  const [signatureByFieldId, setSignatureByFieldId] = useState<
    Record<string, string | null>
  >({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!signingContext) return;
    if (signedEmail.trim().length === 0) {
      setSignedEmail(signingContext.recipientEmail);
    }
    if (signedName.trim().length === 0 && signingContext.recipientName) {
      setSignedName(signingContext.recipientName);
    }
  }, [signingContext, signedEmail, signedName]);

  const signatureDataUrl = useMemo(() => {
    if (!signatureBase64) return null;
    if (signatureBase64.startsWith("data:")) return signatureBase64;
    return `data:image/png;base64,${signatureBase64}`;
  }, [signatureBase64]);

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
    if (!hasConsented) {
      toast.error("Please confirm consent.");
      return;
    }
    if (!signedName.trim()) {
      toast.error("Enter your name.");
      return;
    }
    if (!signedEmail.trim()) {
      toast.error("Enter your email.");
      return;
    }
    const isMultiSign = requiredSignatureFields.length > 0;
    if (isMultiSign) {
      const missing = requiredSignatureFields.some(
        (f) => !signatureByFieldId[f.id],
      );
      if (missing) {
        toast.error("Please sign all required fields.");
        return;
      }
    } else {
      if (!signatureDataUrl) {
        toast.error("Please add a signature.");
        return;
      }
    }

    startTransition(() => {
      const fieldSignatures =
        requiredSignatureFields.length > 0
          ? requiredSignatureFields.map((f) => ({
              fieldId: f.id,
              signatureDataUrl: `data:image/png;base64,${String(
                signatureByFieldId[f.id],
              )}`,
            }))
          : undefined;

      void submitSignature({
        issueId,
        tokenHash,
        signatureDataUrl: fieldSignatures
          ? undefined
          : (signatureDataUrl ?? undefined),
        fieldSignatures,
        signedName: signedName.trim(),
        signedEmail: signedEmail.trim().toLowerCase(),
        consentText: signingContext.template.consentText,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      })
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
      <div className="space-y-1">
        <div className="text-2xl font-semibold">Sign disclaimer</div>
        <div className="text-muted-foreground text-sm">
          Review the document and sign to complete.
        </div>
      </div>

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
                  href={`?token=${encodeURIComponent(token)}&tokenHash=${encodeURIComponent(
                    tokenHashFromUrl || (tokenHash ?? ""),
                  )}&debug=1`}
                >
                  Show debug details
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {signingContext ? (
        signingContext.status === "complete" ? (
          <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
            <Card>
              <CardHeader>
                <CardTitle>Signed. Thank you!</CardTitle>
                <CardDescription>
                  This disclaimer has already been completed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {receipt?.signedPdfUrl ? (
                  <Button asChild variant="outline">
                    <a
                      href={receipt.signedPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download signed PDF
                    </a>
                  </Button>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    Signed PDF is processing.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <DisclaimerSigningCanvas
            templateTitle={signingContext.template.title}
            pdfUrl={signingContext.template.pdfUrl}
            pdfVersion={signingContext.template.pdfVersion}
            consentText={signingContext.template.consentText}
            signatureFields={signatureFields}
            requiredSignatureFields={requiredSignatureFields}
            signatureByFieldId={signatureByFieldId}
            setSignatureByFieldId={setSignatureByFieldId}
            signedName={signedName}
            setSignedName={setSignedName}
            signedEmail={signedEmail}
            setSignedEmail={setSignedEmail}
            hasConsented={hasConsented}
            setHasConsented={setHasConsented}
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        )
      ) : null}
    </div>
  );
}
