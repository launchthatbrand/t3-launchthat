"use client";

import type { GenericId as Id } from "convex/values";
import { useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { CalendarClock, CircleDot } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { ColumnDefinition, EntityList } from "@acme/ui/entity-list";
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

type MatchMode = "contains" | "exact" | "regex";

interface FormState {
  entryId?: Id<"supportKnowledge">;
  title: string;
  slug: string;
  content: string;
  matchMode: MatchMode;
  matchPhrases: string;
  priority: number;
  isActive: boolean;
  tags: string;
}

interface KnowledgeEntry extends Record<string, unknown> {
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

interface ResponsesViewProps {
  organizationId: Id<"organizations">;
}

export function ResponsesView({ organizationId }: ResponsesViewProps) {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const entries = (useQuery(api.plugins.support.queries.listKnowledgeEntries, {
    organizationId,
  }) ?? []) as KnowledgeEntry[];
  const upsertKnowledge = useMutation(
    api.plugins.support.mutations.upsertKnowledgeEntry,
  );
  const deleteKnowledge = useMutation(
    api.plugins.support.mutations.deleteKnowledgeEntry,
  );

  const openForCreate = () => {
    setFormState(defaultFormState);
    setIsDialogOpen(true);
  };

  const openForEdit = (entry: KnowledgeEntry) => {
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

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const matchModeOptions: MatchMode[] = ["contains", "exact", "regex"];

  const handleSave = () => {
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
          setIsDialogOpen(false);
          setFormState(defaultFormState);
        })
        .catch((error) => {
          console.error("Failed to save canned response", error);
          toast.error("Unable to save response. Please try again.");
        });
    });
  };

  const handleDelete = (entryId: Id<"supportKnowledge">) => {
    startTransition(() => {
      void deleteKnowledge({ organizationId, entryId })
        .then(() => {
          toast.success("Response deleted.");
        })
        .catch((error) => {
          console.error("Failed to delete canned response", error);
          toast.error("Unable to delete response. Please try again.");
        });
    });
  };

  const columns: ColumnDefinition<KnowledgeEntry>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Response",
      sortable: true,
      cell: (entry: KnowledgeEntry) => (
        <div>
          <p className="font-medium">{entry.title}</p>
          <p className="text-muted-foreground text-xs">{entry.slug ?? "—"}</p>
        </div>
      ),
    },
    {
      id: "triggers",
      header: "Triggers",
      cell: (entry: KnowledgeEntry) =>
        entry.matchPhrases?.length ? (
          <div className="text-sm">{entry.matchPhrases.join(", ")}</div>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        ),
    },
    {
      id: "matchMode",
      accessorKey: "matchMode",
      header: "Mode",
      cell: (entry: KnowledgeEntry) => (
        <Badge variant="outline" className="flex items-center gap-1">
          <CircleDot className="h-3 w-3" />
          {entry.matchMode ?? "contains"}
        </Badge>
      ),
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: "Priority",
      cell: (entry: KnowledgeEntry) => (
        <Badge variant="outline">
          {typeof entry.priority === "number" ? entry.priority : 0}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (entry: KnowledgeEntry) => (
        <Badge variant={entry.isActive === false ? "secondary" : "default"}>
          {entry.isActive === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      id: "updatedAt",
      header: "Last updated",
      cell: (entry: KnowledgeEntry) =>
        entry.updatedAt ? (
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <CalendarClock className="h-3.5 w-3.5" />
            {new Date(entry.updatedAt).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
  ];

  const entityActions = [
    {
      id: "edit",
      label: "Edit",
      onClick: (entry: KnowledgeEntry) => openForEdit(entry),
    },
    {
      id: "delete",
      label: "Delete",
      variant: "destructive" as const,
      onClick: (entry: KnowledgeEntry) => handleDelete(entry._id),
    },
  ];

  return (
    <div className="h-full min-h-screen flex-1 space-y-6 overflow-y-auto p-6">
      <EntityList<KnowledgeEntry>
        data={entries}
        columns={columns}
        entityActions={entityActions}
        enableSearch
        title="Canned responses"
        description="Define trigger phrases and the exact response that should be sent before contacting the LLM."
        actions={
          <Button onClick={openForCreate} disabled={isPending}>
            Add response
          </Button>
        }
        emptyState={
          <div className="text-muted-foreground rounded-md border p-6 text-center text-sm">
            No canned responses yet. Use “Add response” to create your first
            canned reply.
          </div>
        }
        onRowClick={(entry) => openForEdit(entry)}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formState.entryId
                ? "Edit canned response"
                : "Add canned response"}
            </DialogTitle>
            <DialogDescription>
              Define trigger phrases and the exact response text to send before
              contacting the model.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="response-title">Title</Label>
                <Input
                  id="response-title"
                  value={formState.title}
                  onChange={(event) =>
                    handleChange("title", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response-slug">Slug</Label>
                <Input
                  id="response-slug"
                  value={formState.slug}
                  onChange={(event) => handleChange("slug", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Match mode</Label>
              <Select
                value={formState.matchMode}
                onValueChange={(value: MatchMode) =>
                  handleChange("matchMode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {matchModeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-triggers">Trigger phrases</Label>
              <Textarea
                id="response-triggers"
                value={formState.matchPhrases}
                onChange={(event) =>
                  handleChange("matchPhrases", event.target.value)
                }
                rows={3}
                placeholder="Refund policy, return window…"
              />
              <p className="text-muted-foreground text-xs">
                Separate phrases with commas or new lines.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-content">Response content</Label>
              <Textarea
                id="response-content"
                value={formState.content}
                onChange={(event) =>
                  handleChange("content", event.target.value)
                }
                rows={5}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="response-tags">Tags</Label>
                <Input
                  id="response-tags"
                  value={formState.tags}
                  onChange={(event) => handleChange("tags", event.target.value)}
                  placeholder="policy, refunds"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response-priority">Priority</Label>
                <Input
                  id="response-priority"
                  type="number"
                  value={formState.priority}
                  onChange={(event) =>
                    handleChange("priority", Number(event.target.value))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Active response</p>
                <p className="text-muted-foreground text-xs">
                  Disabled responses will be skipped during matching.
                </p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setFormState(defaultFormState);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {formState.entryId ? "Save changes" : "Create response"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
