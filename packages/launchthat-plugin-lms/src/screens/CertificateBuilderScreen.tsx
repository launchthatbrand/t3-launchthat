"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui/toast";

import type {
  CertificateElement,
  CertificatePlaceholderKey,
  CertificateTemplateV1,
} from "../components/certificates/types";
import type { Id } from "../lib/convexId";
import { CertificateCanvas } from "../components/certificates/CertificateCanvas";
import { ElementInspector } from "../components/certificates/ElementInspector";
import { PageSetup } from "../components/certificates/PageSetup";
import { PlaceholderPalette } from "../components/certificates/PlaceholderPalette";
import {
  DEFAULT_TEMPLATE,
  resolveCanvasSizePx,
} from "../components/certificates/types";

const TEMPLATE_META_KEY = "certificateTemplate";

const safeParseTemplate = (value: unknown): CertificateTemplateV1 | null => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as CertificateTemplateV1;
    if (!parsed || parsed.version !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const buildMetaMap = (entries: any[] | null | undefined) => {
  const map = new Map<string, any>();
  (entries ?? []).forEach((entry) => {
    if (entry?.key) {
      map.set(String(entry.key), entry.value);
    }
  });
  return map;
};

const randomId = () => Math.random().toString(36).slice(2, 10);
const normalizeZ = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const CertificateBuilderScreen = ({
  certificateId,
  organizationId,
}: {
  certificateId: Id<"posts">;
  organizationId?: Id<"organizations">;
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [metaBoxStates, setMetaBoxStates] = useState<Record<string, boolean>>({
    inspector: true,
    images: true,
    placeholders: true,
  });

  const postMeta = useQuery(
    (api.plugins.lms.posts.queries as any).getPostMeta,
    certificateId
      ? {
          postId: certificateId as unknown as string,
          organizationId: organizationId as unknown as string | undefined,
        }
      : "skip",
  ) as any[] | undefined;

  const metaMap = useMemo(() => buildMetaMap(postMeta), [postMeta]);
  const storedTemplate = useMemo(() => {
    const raw = metaMap.get(TEMPLATE_META_KEY);
    return safeParseTemplate(raw) ?? null;
  }, [metaMap]);

  const [draft, setDraft] = useState<CertificateTemplateV1>(
    storedTemplate ?? DEFAULT_TEMPLATE,
  );

  const hasInitializedFromServerRef = useRef(false);
  useEffect(() => {
    if (hasInitializedFromServerRef.current) {
      return;
    }
    if (storedTemplate) {
      setDraft(storedTemplate);
      hasInitializedFromServerRef.current = true;
    }
  }, [storedTemplate]);

  const [mediaSearch, setMediaSearch] = useState("");
  const mediaQueryArgs = useMemo(
    () =>
      mediaSearch.trim().length > 0
        ? {
            paginationOpts: { numItems: 200, cursor: null },
            searchTerm: mediaSearch.trim(),
          }
        : {
            paginationOpts: { numItems: 200, cursor: null },
          },
    [mediaSearch],
  );
  const mediaResponse = useQuery(
    api.core.media.queries.listMediaItemsWithUrl,
    mediaQueryArgs as any,
  ) as any;
  const mediaItems: any[] = (mediaResponse?.page ?? []) as any[];
  const mediaByStorageId = useMemo(() => {
    const map = new Map<string, any>();
    mediaItems.forEach((item) => {
      if (item?.storageId) {
        map.set(String(item.storageId), item);
      }
    });
    return map;
  }, [mediaItems]);

  const generateUploadUrl = useMutation(
    api.core.media.mutations.generateUploadUrl,
  );
  const saveMedia = useMutation(api.core.media.mutations.saveMedia);
  const updatePost = useMutation(
    (api.plugins.lms.posts.mutations as any).updatePost,
  );
  const generateCertificatePdf = useAction(
    (api.plugins.lms.actions as any).generateCertificatePdf,
  );

  const { width: canvasW, height: canvasH } = resolveCanvasSizePx(draft.page);

  // One-time migration: legacy `background` becomes a normal image element.
  const hasMigratedLegacyBackgroundRef = useRef(false);
  useEffect(() => {
    if (hasMigratedLegacyBackgroundRef.current) return;
    const legacy = draft.background;
    if (!legacy?.storageId) return;

    hasMigratedLegacyBackgroundRef.current = true;
    setDraft((prev) => {
      if (!prev.background?.storageId) return prev;
      const existing = prev.elements.some(
        (el: any) =>
          el.kind === "image" && el.storageId === prev.background?.storageId,
      );
      if (existing) {
        return { ...prev, background: undefined };
      }
      const minZ = prev.elements.reduce(
        (min, el: any) => Math.min(min, normalizeZ(el?.zIndex)),
        0,
      );
      return {
        ...prev,
        background: undefined,
        elements: [
          {
            id: `img_legacy_bg_${randomId()}`,
            kind: "image",
            storageId: prev.background.storageId,
            x: 0,
            y: 0,
            width: canvasW,
            height: canvasH,
            rotation: 0,
            zIndex: minZ - 100,
          } as any,
          ...prev.elements,
        ],
      };
    });
  }, [canvasH, canvasW, draft.background, draft.elements]);

  const selectedElement = useMemo(() => {
    if (!selectedId) return null;
    return draft.elements.find((el) => el.id === selectedId) ?? null;
  }, [draft.elements, selectedId]);

  const handleChangeElement = useCallback(
    (id: string, patch: Partial<CertificateElement>) => {
      setDraft((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as any) : el,
        ),
      }));
    },
    [],
  );

  const handleRemoveSelected = useCallback(() => {
    if (!selectedId) return;
    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== selectedId),
    }));
    setSelectedId(null);
  }, [selectedId]);

  const handleRemoveElement = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleAddPlaceholder = useCallback(
    (placeholderKey: CertificatePlaceholderKey) => {
      const id = `ph_${placeholderKey}_${randomId()}`;
      setDraft((prev) => ({
        ...prev,
        elements: [
          ...prev.elements,
          {
            id,
            kind: "placeholder",
            placeholderKey,
            x: Math.round(canvasW / 2 - 120),
            y: Math.round(canvasH / 2 - 12),
            width: 240,
            height: 32,
            rotation: 0,
            zIndex:
              (prev.elements.reduce(
                (max, el) => Math.max(max, normalizeZ((el as any).zIndex)),
                0,
              ) ?? 0) + 10,
            style: {
              fontFamily: "Inter",
              fontSize: 26,
              color: "#111827",
              align: "center",
              fontWeight: 600,
            },
          },
        ],
      }));
      setSelectedId(id);
    },
    [canvasH, canvasW],
  );

  const handleAddImageFromMedia = useCallback(
    async (media: any) => {
      const storageId = String(media.storageId ?? "");
      if (!storageId) {
        toast.error("Selected media is missing a storageId.");
        return;
      }
      const id = `img_${randomId()}`;
      const url =
        typeof media.url === "string" && media.url.length > 0
          ? media.url
          : null;

      // Prefer stored dimensions, otherwise probe the real image dimensions from its URL.
      // Without this, we can end up stretching images into a guessed box (e.g. 1200x800).
      const probedDims =
        url && typeof window !== "undefined"
          ? await new Promise<{ w: number; h: number } | null>((resolve) => {
              const img = new window.Image();
              img.crossOrigin = "anonymous";
              img.onload = () =>
                resolve({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = () => resolve(null);
              img.src = url;
            })
          : null;

      const naturalW =
        typeof media.width === "number" && Number.isFinite(media.width)
          ? media.width
          : (probedDims?.w ?? 1200);
      const naturalH =
        typeof media.height === "number" && Number.isFinite(media.height)
          ? media.height
          : (probedDims?.h ?? 800);

      const maxW = Math.max(200, Math.round(canvasW * 0.7));
      const scale = Math.min(1, maxW / naturalW);
      const w = Math.round(naturalW * scale);
      const h = Math.round(naturalH * scale);

      setDraft((prev) => ({
        ...prev,
        elements: [
          ...prev.elements,
          {
            id,
            kind: "image",
            storageId,
            x: Math.round(canvasW / 2 - w / 2),
            y: Math.round(canvasH / 2 - h / 2),
            width: w,
            height: h,
            rotation: 0,
            zIndex:
              (prev.elements.reduce(
                (max, el) => Math.max(max, normalizeZ((el as any).zIndex)),
                0,
              ) ?? 0) + 1,
          },
        ],
      }));
      setSelectedId(id);
    },
    [canvasH, canvasW],
  );

  const handleUploadAndAddImage = useCallback(
    async (file: File) => {
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }
      const { storageId } = (await uploadResponse.json()) as {
        storageId: string;
      };
      await saveMedia({
        storageId: storageId as any,
        title: file.name,
        status: "published",
      });

      // Add to canvas immediately (use file dimensions if possible).
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        img.onload = () =>
          resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = url;
      });
      URL.revokeObjectURL(url);

      handleAddImageFromMedia({
        storageId,
        width: dims.w,
        height: dims.h,
      });

      toast.success("Image uploaded to Media Library.");
    },
    [generateUploadUrl, handleAddImageFromMedia, saveMedia],
  );

  const handleSaveTemplate = useCallback(async () => {
    try {
      await updatePost({
        id: certificateId as unknown as string,
        meta: {
          [TEMPLATE_META_KEY]: JSON.stringify(draft),
        },
      });
      toast.success("Certificate template saved.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save template.");
    }
  }, [certificateId, draft, updatePost]);

  const handleDownloadPdfPreview = useCallback(async () => {
    try {
      const bytes = (await generateCertificatePdf({
        certificateId: certificateId as unknown as string,
        organizationId: organizationId as unknown as string | undefined,
        templateOverride: draft,
        context: {
          userName: "Jane Doe",
          completionDate: new Date().toLocaleDateString(),
          courseTitle: "Example Course",
          certificateId: String(certificateId),
          organizationName: "Wall Street Academy",
        },
      })) as ArrayBuffer;

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-preview-${String(certificateId).slice(-6)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate PDF preview.",
      );
    }
  }, [certificateId, draft, generateCertificatePdf]);

  const pageLabel = useMemo(() => {
    const size = draft.page.size === "a4" ? "A4" : "Letter";
    const orientation =
      draft.page.orientation === "landscape" ? "Landscape" : "Portrait";
    return `${size} · ${orientation}`;
  }, [draft.page.orientation, draft.page.size]);

  return (
    <div className="flex flex-col">
      <div className="bg-background/80 sticky top-14 z-10 border-b px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Certificate Builder</h2>
            <p className="text-muted-foreground text-sm">
              Upload a background image and drag placeholders onto the canvas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  Page setup ({pageLabel})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Page setup</DialogTitle>
                </DialogHeader>
                <PageSetup
                  size={draft.page.size}
                  orientation={draft.page.orientation}
                  onChange={(next) =>
                    setDraft((prev) => ({ ...prev, page: next }))
                  }
                />
              </DialogContent>
            </Dialog>

            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                id="showGrid"
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span>Grid</span>
            </label>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdfPreview}
            >
              Download PDF preview
            </Button>
            <Button type="button" onClick={handleSaveTemplate}>
              Save template
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
                  <ElementInspector
                    element={selectedElement as any}
                    onChange={(patch) => {
                      if (!selectedElement) return;
                      handleChangeElement(selectedElement.id, patch as any);
                    }}
                    onRemove={handleRemoveSelected}
                    canvas={{ width: canvasW, height: canvasH }}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            value={metaBoxStates.images ? "images" : undefined}
            onValueChange={(value) =>
              setMetaBoxStates((prev) => ({ ...prev, images: Boolean(value) }))
            }
            className="rounded-lg border"
          >
            <AccordionItem value="images" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-left">
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Images</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-4">
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs font-semibold uppercase">
                      Upload new image
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void handleUploadAndAddImage(file).catch((err) => {
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
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Search images…"
                    />
                  </div>

                  <div className="max-h-[360px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2">
                      {mediaItems.map((item) => (
                        <button
                          key={String(item._id)}
                          type="button"
                          className="bg-muted/20 hover:bg-muted/40 overflow-hidden rounded border"
                          onClick={() => void handleAddImageFromMedia(item)}
                          title={item.title ?? "Image"}
                        >
                          {item.url ? (
                            <img
                              src={item.url}
                              alt={item.title ?? "Image"}
                              className="h-20 w-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground flex h-20 items-center justify-center text-xs">
                              No preview
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Showing {mediaItems.length} result
                    {mediaItems.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            value={metaBoxStates.placeholders ? "placeholders" : undefined}
            onValueChange={(value) =>
              setMetaBoxStates((prev) => ({
                ...prev,
                placeholders: Boolean(value),
              }))
            }
            className="rounded-lg border"
          >
            <AccordionItem value="placeholders" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-left">
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Placeholders</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-0 pb-4">
                <div className="space-y-4 pt-2">
                  <PlaceholderPalette onAdd={handleAddPlaceholder} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="min-h-[520px] lg:h-[calc(100vh-240px)]">
          <div className="mx-auto h-full w-full max-w-[1200px]">
            <CertificateCanvas
              className="bg-primary/50"
              template={draft}
              imageUrlByStorageId={mediaByStorageId}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChangeElement={handleChangeElement}
              onDeleteElement={handleRemoveElement}
              showGrid={showGrid}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
