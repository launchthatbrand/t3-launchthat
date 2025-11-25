"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { EntityAction } from "~/components/shared/EntityList/types";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { useTenant } from "~/context/TenantContext";

type MatchMode = "contains" | "exact" | "regex";

interface FormState {
  entryId?: string;
  title: string;
  slug: string;
  content: string;
  matchMode: MatchMode;
  matchPhrases: string;
  priority: number;
  isActive: boolean;
  tags: string;
}

interface KnowledgeEntry {
  _id: Id<"supportKnowledge">;
  title: string;
  slug?: string | null;
  content: string;
  matchMode?: MatchMode | null;
  matchPhrases?: string[] | null;
  priority?: number | null;
  isActive?: boolean | null;
  tags?: string[] | null;
  updatedAt?: number | null;
  createdAt?: number | null;
}

const defaultFormState: FormState = {
  title: "",
  slug: "",
  content: "",
  matchMode: "contains",
  matchPhrases: "",
  priority: 0,
  isActive: true,
  tags: "",
};

export function SupportResponses() {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const knowledgeQueryArgs = organizationId
    ? ({ organizationId } as const)
    : ("skip" as const);
  const entries = useQuery(
    api.plugins.support.queries.listKnowledgeEntries,
    knowledgeQueryArgs,
  );

  const upsertKnowledge = useMutation(
    api.plugins.support.mutations.upsertKnowledgeEntry,
  );
  const deleteKnowledge = useMutation(
    api.plugins.support.mutations.deleteKnowledgeEntry,
  );

  const editing = formState.entryId !== undefined;

  const knowledgeEntries: KnowledgeEntry[] = entries ?? [];
  const isLoadingEntries =
    Boolean(organizationId) && entries === undefined && !editing;

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormState(defaultFormState);

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openForCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setFormState({
      entryId: entry._id,
      title: entry.title,
      slug: entry.slug ?? "",
      content: entry.content,
      matchMode: entry.matchMode ?? "contains",
      matchPhrases: (entry.matchPhrases ?? []).join(", "),
      priority: entry.priority ?? 0,
      isActive: entry.isActive !== false,
      tags: (entry.tags ?? []).join(", "),
    });
    setIsDialogOpen(true);
  };

  const upsert = () => {
    if (!organizationId) {
      toast.error("Missing organization context");
      return;
    }

    if (!formState.title.trim() || !formState.content.trim()) {
      toast.error("Title and response content are required");
      return;
    }

    const matchPhrases = formState.matchPhrases
      .split(/[\n,]+/)
      .map((phrase) => phrase.trim())
      .filter(Boolean);

    startTransition(() => {
      void upsertKnowledge({
        organizationId,
        entryId: formState.entryId,
        title: formState.title.trim(),
        slug: formState.slug.trim() || undefined,
        content: formState.content.trim(),
        tags: formState.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        type: "canned",
        matchMode: formState.matchMode,
        matchPhrases,
        priority: formState.priority,
        isActive: formState.isActive,
      })
        .then(() => {
          toast.success(
            formState.entryId ? "Response updated." : "Response created.",
          );
          closeDialog();
        })
        .catch((error) => {
          console.error("Failed to save canned response", error);
          toast.error("Unable to save response. Please try again.");
        });
    });
  };

  const removeEntry = (entryId: Id<"supportKnowledge">) => {
    if (!organizationId) return;
    startTransition(() => {
      void deleteKnowledge({ organizationId, entryId })
        .then(() => {
          toast.success("Response deleted.");
          if (formState.entryId === entryId) {
            closeDialog();
          }
        })
        .catch((error) => {
          console.error("Failed to delete canned response", error);
          toast.error("Unable to delete response. Please try again.");
        });
    });
  };

  const entryColumns = useMemo<ColumnDef<KnowledgeEntry>[]>(
    () => [
      {
        header: "Response",
        id: "response",
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="space-y-1">
              <p className="font-medium">{entry.title}</p>
              <p className="text-xs text-muted-foreground">
                {entry.slug ?? "—"}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {entry.content}
              </p>
            </div>
          );
        },
      },
      {
        header: "Match Mode",
        id: "matchMode",
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.matchMode ?? "contains"}
          </span>
        ),
      },
      {
        header: "Triggers",
        id: "triggers",
        cell: ({ row }) => {
          const phrases = row.original.matchPhrases ?? [];
          if (phrases.length === 0) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          const preview = phrases.slice(0, 3).join(", ");
          const remainder = phrases.length - 3;
          return (
            <span className="text-sm text-muted-foreground">
              {preview}
              {remainder > 0 ? ` (+${remainder})` : ""}
            </span>
          );
        },
      },
      {
        header: "Priority",
        id: "priority",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.priority ?? 0}
          </span>
        ),
      },
      {
        header: "Status",
        id: "status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive === false ? "secondary" : "default"}
          >
            {row.original.isActive === false ? "Inactive" : "Active"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const entryActions: EntityAction<KnowledgeEntry>[] = [
    {
      id: "edit",
      label: "Edit",
      onClick: (entry) => handleEdit(entry),
      isDisabled: () => isPending,
    },
    {
      id: "delete",
      label: "Delete",
      variant: "destructive",
      onClick: (entry) => removeEntry(entry._id),
      isDisabled: () => isPending,
    },
  ];

  return (
    <AdminLayout
      title="Support Assistant"
      description="Configure canned answers before the AI model runs."
    >
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain className="space-y-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold">Canned responses</h2>
              <p className="text-sm text-muted-foreground">
                Define trigger phrases and the exact response that should be
                sent before contacting the LLM.
              </p>
            </div>
            <Button onClick={openForCreate}>Add response</Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Responses</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <EntityList<KnowledgeEntry>
                data={knowledgeEntries}
                columns={entryColumns}
                isLoading={isLoadingEntries || isPending}
                enableSearch
                enableFooter={false}
                entityActions={entryActions}
                onRowClick={(entry) => handleEdit(entry)}
                viewModes={["list", "grid"]}
                defaultViewMode="list"
                gridColumns={{ sm: 1, md: 2 }}
                itemRender={(entry) => (
                  <Card key={entry._id} className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">
                            {entry.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {entry.slug ?? "—"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            entry.isActive === false ? "secondary" : "default"
                          }
                        >
                          {entry.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p className="line-clamp-3">{entry.content}</p>
                      {entry.matchPhrases?.length ? (
                        <p className="text-xs">
                          Triggers: {entry.matchPhrases.join(", ")}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          Mode: {entry.matchMode ?? "contains"}
                        </Badge>
                        <Badge variant="outline">
                          Priority: {entry.priority ?? 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                emptyState={
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No canned responses yet. Use “Add response” to create your
                    first canned reply.
                  </div>
                }
              />
            </CardContent>
          </Card>
        </AdminLayoutMain>
        <AdminLayoutSidebar className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API & docs</CardTitle>
              <CardDescription>
                Need to seed data programmatically?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Button asChild size="sm">
                <Link
                  href="https://stack.convex.dev/ai-chat-with-convex-vector-search"
                  target="_blank"
                >
                  Convex RAG Guide
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/support-chat">Chat endpoint</Link>
              </Button>
            </CardContent>
          </Card>
        </AdminLayoutSidebar>
      </AdminLayoutContent>
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          } else {
            setIsDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit canned response" : "Add canned response"}
            </DialogTitle>
            <DialogDescription>
              Configure the canned reply shown before the AI model runs.
            </DialogDescription>
          </DialogHeader>
          {!organizationId ? (
            <p className="text-sm text-muted-foreground">
              Select an organization to manage canned responses.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                upsert();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formState.title}
                    onChange={(event) =>
                      handleChange("title", event.target.value)
                    }
                    placeholder="Return policy overview"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (optional)</Label>
                  <Input
                    id="slug"
                    value={formState.slug}
                    onChange={(event) =>
                      handleChange("slug", event.target.value)
                    }
                    placeholder="return-policy"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchMode">Match mode</Label>
                <Select
                  value={formState.matchMode}
                  onValueChange={(value: MatchMode) =>
                    handleChange("matchMode", value)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Match mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains keywords</SelectItem>
                    <SelectItem value="exact">Exact question</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchPhrases">Trigger phrases</Label>
                <Textarea
                  id="matchPhrases"
                  value={formState.matchPhrases}
                  onChange={(event) =>
                    handleChange("matchPhrases", event.target.value)
                  }
                  placeholder="what is your return policy, refund window"
                  disabled={isPending}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Separate phrases with commas or new lines.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Response</Label>
                <Textarea
                  id="content"
                  value={formState.content}
                  onChange={(event) =>
                    handleChange("content", event.target.value)
                  }
                  placeholder="We offer a 30-day refund..."
                  disabled={isPending}
                  rows={5}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <Input
                    id="tags"
                    value={formState.tags}
                    onChange={(event) =>
                      handleChange("tags", event.target.value)
                    }
                    placeholder="policy, refunds"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formState.priority}
                    onChange={(event) =>
                      handleChange("priority", Number(event.target.value))
                    }
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formState.isActive}
                    onCheckedChange={(checked) =>
                      handleChange("isActive", checked)
                    }
                    disabled={isPending}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {editing ? "Update response" : "Create response"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
