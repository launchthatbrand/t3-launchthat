"use client";

import * as React from "react";
import type { FunctionReference } from "convex/server";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";

interface UploadResponse { storageId?: unknown }

interface BaseMediaItem {
  _id: string;
  url: string | null;
  filename?: string;
  contentType?: string;
  createdAt?: number;
}

export interface MediaLibraryDialogProps<
  ListArgs extends Record<string, unknown>,
  UploadArgs extends Record<string, unknown>,
  CreateArgs extends Record<string, unknown>,
  Item extends BaseMediaItem = BaseMediaItem,
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;

  /** A Convex query that returns media items with URLs. */
  listRef: FunctionReference<"query", "public", ListArgs, Item[]>;
  listArgs: ListArgs;

  /** A Convex mutation that returns an upload URL for `fetch(POST, file)`. */
  generateUploadUrlRef: FunctionReference<"mutation", "public", UploadArgs, string>;
  uploadArgs: UploadArgs;

  /** A Convex mutation to persist metadata + storageId. */
  createRef: FunctionReference<"mutation", "public", CreateArgs, unknown>;
  buildCreateArgs: (args: { storageId: string; file: File }) => CreateArgs;

  onSelect: (item: Item) => void;

  accept?: string;
  className?: string;
}

async function uploadFileToConvex(uploadUrl: string, file: File): Promise<string> {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${raw || "unknown error"}`);
  }
  const json = (await res.json()) as UploadResponse;
  const storageId = typeof json.storageId === "string" ? json.storageId : "";
  if (!storageId) {
    throw new Error("Upload succeeded but storageId was missing.");
  }
  return storageId;
}

export function MediaLibraryDialog<
  ListArgs extends Record<string, unknown>,
  UploadArgs extends Record<string, unknown>,
  CreateArgs extends Record<string, unknown>,
  Item extends BaseMediaItem = BaseMediaItem,
>(props: MediaLibraryDialogProps<ListArgs, UploadArgs, CreateArgs, Item>) {
  const items = useQuery(
    props.listRef as unknown as FunctionReference<
      "query",
      "public",
      Record<string, unknown>,
      Item[]
    >,
    props.listArgs as unknown as Record<string, unknown>,
  );
  const generateUploadUrl = useMutation(props.generateUploadUrlRef);
  const createMedia = useMutation(props.createRef);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!props.open) {
      setSelectedId(null);
      setIsUploading(false);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [props.open]);

  const list = Array.isArray(items) ? items : [];

  const selected = React.useMemo(() => {
    if (!selectedId) return null;
    return list.find((i) => i._id === selectedId) ?? null;
  }, [list, selectedId]);

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const generateUploadUrlTyped = generateUploadUrl as unknown as (
        args: UploadArgs,
      ) => Promise<string>;
      const uploadUrl = await generateUploadUrlTyped(props.uploadArgs);
      const storageId = await uploadFileToConvex(uploadUrl, file);
      const createMediaTyped = createMedia as unknown as (
        args: CreateArgs,
      ) => Promise<unknown>;
      await createMediaTyped(props.buildCreateArgs({ storageId, file }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className={props.className ?? "max-w-3xl"}>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="file"
                accept={props.accept ?? "image/*"}
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  void handleUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                {isUploading ? "Uploading…" : "Upload"}
              </Button>
            </div>

            <Button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                props.onSelect(selected);
                props.onOpenChange(false);
              }}
            >
              Select
            </Button>
          </div>

          {error ? <div className="text-destructive text-sm">{error}</div> : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {list.map((item) => {
              const isSelected = item._id === selectedId;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedId(item._id)}
                  className={[
                    "relative overflow-hidden rounded-md border bg-muted/10 text-left transition",
                    isSelected ? "border-primary ring-2 ring-primary/30" : "border-border/60",
                  ].join(" ")}
                >
                  <div className="aspect-square w-full">
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.filename ?? "media"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate border-t px-2 py-1 text-xs">
                    {item.filename ?? item.contentType ?? item._id}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

