"use client";

import type { GenericId as Id } from "convex/values";
import { useState, useTransition } from "react";
import { api } from "@portal/convexspec";
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Canned responses</h1>
          <p className="text-sm text-muted-foreground">
            Define trigger phrases and the exact response that should be sent
            before contacting the LLM.
          </p>
        </div>
        <Button onClick={openForCreate}>Add response</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Card key={entry._id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{entry.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {entry.slug ?? "—"}
                    </p>
                  </div>
                  <Badge
                    variant={entry.isActive === false ? "secondary" : "default"}
                  >
                    {entry.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {entry.content}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {entry.matchPhrases?.length ? (
                  <p>
                    <span className="font-medium text-foreground">
                      Triggers:
                    </span>{" "}
                    {entry.matchPhrases.join(", ")}
                  </p>
                ) : (
                  <p>No trigger phrases defined.</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    Mode: {entry.matchMode ?? "contains"}
                  </Badge>
                  <Badge variant="outline">
                    Priority: {entry.priority ?? 0}
                  </Badge>
                </div>
                {entry.tags && entry.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openForEdit(entry)}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(entry._id)}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No canned responses yet. Use “Add response” to create your first
            canned reply.
          </Card>
        )}
      </div>

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
              <p className="text-xs text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
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
