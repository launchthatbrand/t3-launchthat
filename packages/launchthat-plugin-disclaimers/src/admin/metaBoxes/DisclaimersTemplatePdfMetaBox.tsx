"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
import { FileText, Loader2, Upload } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

const PDF_FILE_META_KEY = "disclaimer.pdfFileId";
const PDF_VERSION_META_KEY = "disclaimer.pdfVersion";
const CONSENT_TEXT_META_KEY = "disclaimer.consentText";
const DESCRIPTION_META_KEY = "disclaimer.description";

type MediaRow = {
  _id: string;
  storageId?: string | null;
  url?: string | null;
  title?: string | null;
  status?: "draft" | "published" | null;
  mimeType?: string | null;
};

const apiAny = api as any;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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

export const DisclaimersTemplatePdfMetaBox = ({
  context,
}: PluginMetaBoxRendererProps) => {
  const postId = context.postId;
  const organizationId = context.organizationId;

  const postMetaRows = useQuery(
    (apiAny.plugins.disclaimers.posts.queries as any).getPostMeta,
    postId
      ? {
          postId,
          organizationId: organizationId ? String(organizationId) : undefined,
        }
      : "skip",
  ) as Array<{ key?: string; value?: unknown }> | undefined;

  const meta = useMemo(() => {
    const out: Record<string, unknown> = {};
    (postMetaRows ?? []).forEach((row) => {
      const key = typeof row?.key === "string" ? row.key : "";
      if (!key) return;
      out[key] = row?.value ?? null;
    });
    return out;
  }, [postMetaRows]);

  const currentPdfFileId = isNonEmptyString(meta[PDF_FILE_META_KEY])
    ? String(meta[PDF_FILE_META_KEY])
    : null;
  const currentPdfVersion =
    typeof meta[PDF_VERSION_META_KEY] === "number"
      ? (meta[PDF_VERSION_META_KEY] as number)
      : 0;

  const consentDefault = isNonEmptyString(meta[CONSENT_TEXT_META_KEY])
    ? String(meta[CONSENT_TEXT_META_KEY])
    : "I agree to the terms of this disclaimer.";
  const descriptionDefault = isNonEmptyString(meta[DESCRIPTION_META_KEY])
    ? String(meta[DESCRIPTION_META_KEY])
    : "";

  const [consentText, setConsentText] = useState("");
  const [description, setDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [search, setSearch] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const hydratedRef = useRef<{ postId?: string; sig?: string }>({});
  useEffect(() => {
    const sig = [
      postId ?? "",
      consentDefault ?? "",
      descriptionDefault ?? "",
    ].join("|");
    if (
      hydratedRef.current.postId === postId &&
      hydratedRef.current.sig === sig
    ) {
      return;
    }
    hydratedRef.current.postId = postId;
    hydratedRef.current.sig = sig;
    setConsentText(consentDefault);
    setDescription(descriptionDefault);
  }, [consentDefault, descriptionDefault, postId]);

  const updateTemplateMeta = useMutation(
    (apiAny.plugins.disclaimers.mutations as any).upsertDisclaimerTemplateMeta,
  ) as any;

  const importTemplatePdfAndAttach = useAction(
    apiAny.plugins.disclaimers.actions.importTemplatePdfAndAttach,
  ) as (args: {
    orgId?: string;
    templatePostId: string;
    sourceUrl: string;
  }) => Promise<{ pdfFileId: string }>;

  const generateUploadUrl = useMutation(
    apiAny.core.media.mutations.generateUploadUrl,
  ) as any;

  const saveMedia = useMutation(apiAny.core.media.mutations.saveMedia) as any;

  const currentPdfMedia = useQuery(
    apiAny.core.media.queries.getMediaByStorageId,
    currentPdfFileId ? { storageId: currentPdfFileId as any } : "skip",
  ) as MediaRow | null | undefined;

  const mediaResponse = useQuery(
    apiAny.core.media.queries.listMediaItemsWithUrl,
    {
      paginationOpts: { numItems: 60, cursor: null },
      status: "published",
      searchTerm: search.trim().length > 0 ? search.trim() : undefined,
      organizationId: organizationId ? String(organizationId) : undefined,
    },
  ) as
    | {
        page: MediaRow[];
      }
    | undefined;

  const libraryItems = useMemo(() => {
    const items = mediaResponse?.page ?? [];
    // Prefer PDFs at top, but still allow selecting any storage-backed media.
    return [...items].sort((a, b) => {
      const aIsPdf = isPdfCandidate(a) ? 0 : 1;
      const bIsPdf = isPdfCandidate(b) ? 0 : 1;
      if (aIsPdf !== bIsPdf) return aIsPdf - bIsPdf;
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });
  }, [mediaResponse?.page]);

  const canEdit = Boolean(postId);

  const handleSaveTextMeta = useCallback(async () => {
    if (!postId) return;
    setIsWorking(true);
    try {
      await updateTemplateMeta({
        postId,
        organizationId: organizationId ? String(organizationId) : undefined,
        consentText,
        description,
      });
      toast.success("Template metadata updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update template metadata.");
    } finally {
      setIsWorking(false);
    }
  }, [consentText, description, organizationId, postId, updateTemplateMeta]);

  const handleSelectMedia = useCallback(
    async (media: Pick<MediaRow, "url">) => {
      if (!postId) return;
      const sourceUrl = typeof media.url === "string" ? media.url : "";
      if (!sourceUrl) {
        toast.error("Selected media item has no URL.");
        return;
      }
      setIsWorking(true);
      try {
        await importTemplatePdfAndAttach({
          orgId: organizationId ? String(organizationId) : undefined,
          templatePostId: postId,
          sourceUrl,
        });
        toast.success("Template PDF updated.");
        setDialogOpen(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to update template PDF.");
      } finally {
        setIsWorking(false);
      }
    },
    [importTemplatePdfAndAttach, organizationId, postId],
  );

  const handleUpload = useCallback(async () => {
    if (!postId) return;
    if (!uploadFile) {
      toast.error("Choose a PDF to upload.");
      return;
    }
    setIsWorking(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": uploadFile.type || "application/octet-stream",
        },
        body: uploadFile,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      const json = (await res.json()) as { storageId: string };
      const saved = (await saveMedia({
        organizationId: organizationId ? (String(organizationId) as any) : undefined,
        storageId: json.storageId as any,
        title: uploadFile.name,
        status: "published",
      })) as { url?: string | null };
      await handleSelectMedia({ url: saved.url ?? null });
      setUploadFile(null);
      toast.success("Uploaded to Media Library.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsWorking(false);
    }
  }, [generateUploadUrl, handleSelectMedia, organizationId, postId, saveMedia, uploadFile]);

  if (!canEdit) {
    return (
      <div className="text-muted-foreground text-sm">
        Save this template first to attach a PDF from the Media Library.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">PDF</span>
          </div>
          <Badge variant="outline" className="text-xs">
            v{currentPdfVersion}
          </Badge>
        </div>

        {currentPdfFileId ? (
          <div className="text-muted-foreground space-y-1 text-sm">
            <div className="truncate">
              <span className="font-medium">Storage ID:</span>{" "}
              <span className="font-mono text-xs">{currentPdfFileId}</span>
            </div>
            {currentPdfMedia?.url ? (
              <Link
                className="text-primary inline-flex items-center gap-2 underline underline-offset-4"
                href={currentPdfMedia.url}
                target="_blank"
              >
                View PDF
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No PDF selected.</div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Choose / Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Select template PDF</DialogTitle>
              <DialogDescription>
                Choose an existing file from the Media Library or upload a new
                PDF (it will be added to the Media Library automatically).
              </DialogDescription>
            </DialogHeader>

            <Tabs value={tab} onValueChange={(value) => setTab(value as any)}>
              <TabsList>
                <TabsTrigger value="library">Media Library</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search media…"
                  />
                  <Button asChild variant="secondary">
                    <a
                      href="/admin/edit/attachments"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Attachments
                    </a>
                  </Button>
                </div>

                <div className="max-h-[420px] space-y-2 overflow-auto rounded-md border p-3">
                  {mediaResponse === undefined ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading media…
                    </div>
                  ) : libraryItems.length === 0 ? (
                    <div className="text-muted-foreground text-sm">
                      No media found.
                    </div>
                  ) : (
                    libraryItems.map((item) => {
                      const title = String(item.title ?? "Untitled");
                      const canSelect = isNonEmptyString(item.url);
                      return (
                        <div
                          key={item._id}
                          className="flex items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {title}
                            </div>
                            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {isPdfCandidate(item) ? "pdf" : "file"}
                              </Badge>
                              {item.storageId ? (
                                <span className="font-mono">
                                  {String(item.storageId)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {item.url ? (
                              <Button asChild variant="ghost" size="sm">
                                <a
                                  href={String(item.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              disabled={!canSelect || isWorking}
                              onClick={() =>
                                item.url
                                  ? void handleSelectMedia({
                                      url: String(item.url),
                                    })
                                  : null
                              }
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-3">
                <div className="space-y-2">
                  <Label>Upload PDF</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-muted-foreground text-sm">
                    Uploaded files are saved to the Media Library so they can be
                    reused elsewhere (downloads, attachments, etc).
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={!uploadFile || isWorking}
                >
                  {isWorking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Label>Consent text</Label>
        <Textarea
          value={consentText}
          onChange={(e) => setConsentText(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        type="button"
        size="sm"
        onClick={() => void handleSaveTextMeta()}
        disabled={isWorking}
      >
        {isWorking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
};
