"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { LexicalEditor } from "lexical";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Search, Sparkles, Upload } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { toast } from "@acme/ui/toast";

import type { OEmbedPayload } from "~/components/editor/utils/oembed";
import type { PluginArchiveViewInstance } from "~/lib/plugins/helpers";
import type {
  PluginMediaPickerContext,
  PluginMediaSelection,
} from "~/lib/plugins/types";
import { PlaceholderState } from "~/app/(root)/(admin)/admin/edit/_components/PlaceholderState";
import { INSERT_OEMBED_COMMAND } from "~/components/editor/plugins/embeds/oembed-plugin";
import { INSERT_IMAGE_COMMAND } from "~/components/editor/plugins/images-plugin";
import { fetchOEmbedPayload } from "~/components/editor/utils/oembed";
import {
  getPluginArchiveViewForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";

type MediaItemWithUrl = Doc<"mediaItems"> & { url?: string | null };
type AttachmentSelection = Extract<
  PluginMediaSelection,
  { kind: "attachment" }
>;
type EmbedSelection = Extract<PluginMediaSelection, { kind: "embed" }>;

interface MediaPickerDialogProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
  organizationId?: Id<"organizations">;
}

const FALLBACK_TAB = {
  id: "attachments-library",
  slug: "edit",
  label: "Media Library",
  usesDefaultArchive: true,
};

export function MediaPickerDialog({
  activeEditor,
  onClose,
  organizationId,
}: MediaPickerDialogProps) {
  const [isInserting, setIsInserting] = useState(false);

  const pluginArchiveView = useMemo<PluginArchiveViewInstance | null>(
    () => getPluginArchiveViewForSlug("attachments"),
    [],
  );

  const archiveTabs =
    pluginArchiveView?.config.tabs && pluginArchiveView.config.tabs.length > 0
      ? pluginArchiveView.config.tabs
      : [FALLBACK_TAB];

  const [activeTab, setActiveTab] = useState(
    archiveTabs[0]?.slug ?? FALLBACK_TAB.slug,
  );

  useEffect(() => {
    const nextActive =
      archiveTabs.find((tab) => tab.slug === activeTab)?.slug ??
      archiveTabs[0]?.slug ??
      FALLBACK_TAB.slug;
    setActiveTab(nextActive);
  }, [archiveTabs, activeTab]);

  const insertAttachment = useCallback(
    (attachment: AttachmentSelection["attachment"]) => {
      if (!attachment.url) {
        throw new Error("Selected media item does not have a URL.");
      }
      const altText = attachment.alt ?? attachment.title ?? "Media Item";
      const mimeType = attachment.mimeType ?? "";
      const isImage =
        mimeType.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment.url);

      if (isImage) {
        activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          src: attachment.url,
          altText,
        });
        return;
      }

      const html = mimeType.startsWith("video/")
        ? `<video controls style="width:100%;height:auto;" src="${attachment.url}"></video>`
        : `<a href="${attachment.url}" target="_blank" rel="noopener noreferrer">${attachment.title ?? attachment.url}</a>`;

      activeEditor.dispatchCommand(INSERT_OEMBED_COMMAND, {
        url: attachment.url,
        html,
        providerName: "Media Library",
        title: attachment.title ?? undefined,
      });
    },
    [activeEditor],
  );

  const insertEmbed = useCallback(
    async (embed: EmbedSelection["embed"]) => {
      const payload: OEmbedPayload | null =
        embed.html !== undefined
          ? (embed as OEmbedPayload)
          : await fetchOEmbedPayload(embed.url);

      if (!payload) {
        throw new Error("Unable to embed this media item.");
      }

      const mergedPayload: OEmbedPayload = {
        ...payload,
        providerName: embed.providerName ?? payload.providerName,
        title: embed.title ?? payload.title,
        width: embed.width ?? payload.width,
        height: embed.height ?? payload.height,
        thumbnailUrl: embed.thumbnailUrl ?? payload.thumbnailUrl,
        videoId: embed.videoId ?? payload.videoId,
      };

      activeEditor.dispatchCommand(INSERT_OEMBED_COMMAND, mergedPayload);
    },
    [activeEditor],
  );

  const handleSelection = useCallback(
    async (selection: PluginMediaSelection) => {
      if (isInserting) {
        return;
      }
      setIsInserting(true);
      try {
        if (selection.kind === "attachment") {
          insertAttachment(selection.attachment);
        } else {
          await insertEmbed(selection.embed);
        }
        onClose();
      } catch (error) {
        toast.error("Failed to insert media", {
          description:
            error instanceof Error ? error.message : "Unexpected error.",
        });
      } finally {
        setIsInserting(false);
      }
    },
    [insertAttachment, insertEmbed, isInserting, onClose],
  );

  const mediaPickerContext = useMemo<PluginMediaPickerContext | undefined>(
    () =>
      pluginArchiveView
        ? {
            onSelectMedia: (selection) => {
              void handleSelection(selection);
            },
          }
        : undefined,
    [handleSelection, pluginArchiveView],
  );

  const renderDefaultTab = () => (
    <MediaPickerLibraryPanel
      onSelect={handleSelection}
      isInserting={isInserting}
    />
  );

  const renderTabContent = (tabSlug: string): ReactNode => {
    const tabDefinition =
      archiveTabs.find((tab) => tab.slug === tabSlug) ?? archiveTabs[0];
    if (!tabDefinition) {
      return renderDefaultTab();
    }

    const showDefaultArchive =
      tabDefinition.usesDefaultArchive ?? !tabDefinition.render;
    if (showDefaultArchive) {
      return renderDefaultTab();
    }

    if (!tabDefinition.render || !pluginArchiveView) {
      return (
        <PlaceholderState
          label={tabDefinition.label ?? "Media"}
          description="This plugin tab does not provide any content yet."
        />
      );
    }

    const rendered = tabDefinition.render({
      pluginId: pluginArchiveView.pluginId,
      pluginName: pluginArchiveView.pluginName,
      postTypeSlug: tabDefinition.postTypeSlug ?? "attachments",
      organizationId,
      mediaPickerContext,
    });

    return wrapWithPluginProviders(rendered, pluginArchiveView.pluginId);
  };

  return (
    <div className="flex w-full max-w-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Select Media</h2>
        <p className="text-muted-foreground text-sm">
          Browse your attachments or plugin-powered sources to insert media into
          the editor.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          {archiveTabs.map((tab) => (
            <TabsTrigger key={tab.slug} value={tab.slug}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {archiveTabs.map((tab) => (
          <TabsContent
            key={tab.slug}
            value={tab.slug}
            className="mt-4 max-h-[65vh] overflow-y-auto pr-2"
          >
            {renderTabContent(tab.slug)}
          </TabsContent>
        ))}
      </Tabs>
      <div className="text-muted-foreground text-xs">
        Want more sources? Enable media plugins in{" "}
        <Link
          href="/admin/integrations/plugins"
          className="text-primary underline"
        >
          Plugins
        </Link>
        .
      </div>
    </div>
  );
}

interface MediaPickerLibraryPanelProps {
  onSelect: (selection: PluginMediaSelection) => Promise<void>;
  isInserting: boolean;
}

function MediaPickerLibraryPanel({
  onSelect,
  isInserting,
}: MediaPickerLibraryPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim();

  const generateUploadUrl = useMutation(
    api.core.media.mutations.generateUploadUrl,
  );
  const saveMedia = useMutation(api.core.media.mutations.saveMedia);

  const mediaQueryArgs = useMemo(
    () =>
      normalizedSearch
        ? {
            paginationOpts: { numItems: 60, cursor: null },
            searchTerm: normalizedSearch,
          }
        : {
            paginationOpts: { numItems: 60, cursor: null },
          },
    [normalizedSearch],
  );

  const mediaResponse = useQuery(
    api.core.media.queries.listMediaItemsWithUrl,
    mediaQueryArgs,
  );

  const mediaItems: MediaItemWithUrl[] = mediaResponse?.page ?? [];
  const isLoading = mediaResponse === undefined;

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadError(null);
      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          const uploadUrl = await generateUploadUrl();
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload file.");
          }
          const { storageId } = (await uploadResponse.json()) as {
            storageId: string;
          };
          await saveMedia({
            storageId: storageId as Id<"_storage">,
            title: file.name,
            status: "published",
          });
        }
        toast.success("Upload complete");
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed.",
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [generateUploadUrl, saveMedia],
  );

  const handleSelectAttachment = useCallback(
    (media: MediaItemWithUrl) => {
      if (!media.url) {
        toast.error("Media item is missing a URL.");
        return;
      }
      void onSelect({
        kind: "attachment",
        attachment: {
          id: media._id,
          url: media.url,
          title: media.title ?? undefined,
          alt: media.alt ?? undefined,
          mimeType: media.mimeType ?? undefined,
          width: media.width ?? undefined,
          height: media.height ?? undefined,
        },
      });
    },
    [onSelect],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search media"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFilesSelected}
        />
      </div>
      {uploadError ? (
        <p className="text-destructive text-sm">{uploadError}</p>
      ) : null}
      <Separator />
      {isLoading ? (
        <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading media…
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="text-muted-foreground flex h-48 flex-col items-center justify-center text-center text-sm">
          <Sparkles className="mb-2 h-6 w-6" />
          <p>No attachments yet. Upload media to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mediaItems.map((item) => (
            <Card key={item._id}>
              <CardContent className="space-y-3 p-4">
                <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                  {item.url ? (
                    <Image
                      src={item.url}
                      alt={item.title ?? "Attachment"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                      No preview
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {item.title ?? "Untitled"}
                    </p>
                    <Badge
                      variant={
                        item.status === "published" ? "default" : "secondary"
                      }
                    >
                      {item.status ?? "draft"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Uploaded{" "}
                    {formatDistanceToNow(item._creationTime, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={item.url ?? "#"} target="_blank">
                      Preview
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    disabled={isInserting}
                    onClick={() => handleSelectAttachment(item)}
                  >
                    {isInserting ? "Inserting…" : "Insert"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
