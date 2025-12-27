"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

type TemplateRow = {
  id: string;
  title: string;
  status: "published" | "draft" | "archived";
  slug: string;
  updatedAt?: number | null;
  createdAt: number;
  pdfUrl: string | null;
  meta: Record<string, string | number | boolean | null>;
};

const apiAny = api as any;

const formatDateTime = (ts?: number | null) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
};

export const DisclaimersTemplatesPage = (
  props: PluginSettingComponentProps,
) => {
  const orgId = props.organizationId ? String(props.organizationId) : undefined;

  const templates = useQuery(
    apiAny.plugins.disclaimers.queries.listDisclaimerTemplates,
    {
      organizationId: orgId,
    },
  ) as TemplateRow[] | undefined;

  const createPost = useMutation(
    apiAny.plugins.disclaimers.posts.mutations.createPost,
  ) as (args: {
    title: string;
    slug: string;
    status: "published" | "draft" | "archived";
    postTypeSlug: string;
    organizationId?: string;
    meta?: Record<string, string | number | boolean | null>;
  }) => Promise<string>;

  const updateMeta = useMutation(
    apiAny.plugins.disclaimers.mutations.upsertDisclaimerTemplateMeta,
  ) as (args: {
    postId: string;
    organizationId?: string;
    pdfFileId?: string;
    consentText?: string;
    description?: string;
  }) => Promise<string>;

  const generateUploadUrl = useMutation(
    apiAny.core.media.mutations.generateUploadUrl,
  ) as () => Promise<string>;

  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newConsentText, setNewConsentText] = useState(
    "I agree to the terms of this disclaimer.",
  );
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const columns: ColumnDefinition<TemplateRow>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Title",
        accessorKey: "title",
        cell: (item: TemplateRow) => (
          <div className="font-medium">{item.title}</div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (item: TemplateRow) => (
          <div className="capitalize">{item.status}</div>
        ),
      },
      {
        id: "pdf",
        header: "PDF",
        accessorKey: "pdfUrl",
        cell: (item: TemplateRow) => {
          const url = item.pdfUrl;
          if (!url) return <div className="text-muted-foreground">Missing</div>;
          return (
            <a
              className="text-primary underline"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>
          );
        },
      },
      {
        id: "version",
        header: "Version",
        accessorKey: "meta",
        cell: (item: TemplateRow) => {
          const version = item.meta["disclaimer.pdfVersion"];
          return <div>{typeof version === "number" ? version : ""}</div>;
        },
      },
      {
        id: "updated",
        header: "Updated",
        accessorKey: "updatedAt",
        cell: (item: TemplateRow) => (
          <div className="text-muted-foreground">
            {formatDateTime(item.updatedAt ?? item.createdAt)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (template: TemplateRow) => {
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit template</DialogTitle>
                  <DialogDescription>
                    Replace the PDF or update consent text. (Title editing uses
                    the standard post editor for now.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Consent text</Label>
                    <Textarea
                      defaultValue={
                        (template.meta["disclaimer.consentText"] as string) ??
                        "I agree to the terms of this disclaimer."
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        startTransition(() => {
                          void updateMeta({
                            postId: template.id,
                            organizationId: orgId,
                            consentText: value,
                          }).then(() => toast.success("Updated consent text"));
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      defaultValue={
                        (template.meta["disclaimer.description"] as string) ??
                        ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        startTransition(() => {
                          void updateMeta({
                            postId: template.id,
                            organizationId: orgId,
                            description: value,
                          }).then(() => toast.success("Updated description"));
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Replace PDF</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;
                        startTransition(() => {
                          void (async () => {
                            const uploadUrl = await generateUploadUrl();
                            const res = await fetch(uploadUrl, {
                              method: "POST",
                              headers: {
                                "Content-Type":
                                  file.type || "application/octet-stream",
                              },
                              body: file,
                            });
                            if (!res.ok) {
                              throw new Error("Upload failed");
                            }
                            const json = (await res.json()) as {
                              storageId: string;
                            };
                            await updateMeta({
                              postId: template.id,
                              organizationId: orgId,
                              pdfFileId: json.storageId,
                            });
                            toast.success("Replaced PDF");
                          })().catch((err: unknown) => {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Failed to replace PDF",
                            );
                          });
                        });
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" type="button">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        },
      },
    ],
    [generateUploadUrl, orgId, updateMeta],
  );

  const handleCreate = () => {
    if (!newFile) {
      toast.error("Please choose a PDF.");
      return;
    }
    if (!newTitle.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": newFile.type || "application/octet-stream",
          },
          body: newFile,
        });
        if (!res.ok) throw new Error("Upload failed");
        const json = (await res.json()) as { storageId: string };

        const slugBase = newTitle
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        await createPost({
          title: newTitle.trim(),
          slug: slugBase || `disclaimer-${Date.now()}`,
          status: "draft",
          postTypeSlug: "disclaimertemplates",
          organizationId: orgId,
          meta: {
            "disclaimer.pdfFileId": json.storageId,
            "disclaimer.pdfVersion": 1,
            "disclaimer.consentText": newConsentText,
            "disclaimer.description": newDescription,
          },
        });

        toast.success("Created template");
        setCreateOpen(false);
        setNewTitle("");
        setNewFile(null);
      })().catch((err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to create template",
        );
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Disclaimer templates</CardTitle>
            <CardDescription>Upload PDFs users will sign.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create template</DialogTitle>
                <DialogDescription>
                  Upload a PDF and configure consent text.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Example: Chargeback policy acknowledgment"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PDF</Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consent text</Label>
                  <Textarea
                    value={newConsentText}
                    onChange={(e) => setNewConsentText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional internal description."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <EntityList
            data={templates ?? []}
            columns={columns}
            title="Disclaimer templates"
            description="Upload PDFs users will sign."
            isLoading={templates === undefined}
            emptyState={
              <div className="text-muted-foreground">No templates yet.</div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
