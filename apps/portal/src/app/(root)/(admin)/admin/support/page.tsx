"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState, useTransition } from "react";
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

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
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

export default function SupportAdminPage() {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isPending, startTransition] = useTransition();

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

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormState(defaultFormState);

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
          resetForm();
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
            resetForm();
          }
        })
        .catch((error) => {
          console.error("Failed to delete canned response", error);
          toast.error("Unable to delete response. Please try again.");
        });
    });
  };

  return (
    <AdminLayout
      title="Support Assistant"
      description="Configure canned answers before the AI model runs."
    >
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain>
          <Card>
            <CardHeader>
              <CardTitle>
                {editing ? "Edit response" : "Add canned response"}
              </CardTitle>
              <CardDescription>
                Define trigger phrases and the exact response that should be
                sent before contacting the LLM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <SelectItem value="contains">
                          Contains keywords
                        </SelectItem>
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
                      {editing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetForm}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" disabled={isPending}>
                        {editing ? "Update response" : "Create response"}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </AdminLayoutMain>
        <AdminLayoutSidebar className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Existing responses</CardTitle>
              <CardDescription>
                {knowledgeEntries.length === 0
                  ? "No canned answers yet."
                  : "Click a card to edit or delete it."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Create your first canned response to answer FAQs instantly.
                </p>
              ) : (
                <div className="space-y-3">
                  {knowledgeEntries.map((entry) => (
                    <div
                      key={entry._id}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Match: {entry.matchMode ?? "contains"} · Priority:{" "}
                            {entry.priority ?? 0}
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
                      {entry.matchPhrases && entry.matchPhrases.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Triggers: {entry.matchPhrases.join(", ")}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(entry)}
                          disabled={isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeEntry(entry._id)}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
    </AdminLayout>
  );
}
