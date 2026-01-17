"use client";

import React from "react";
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
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import type {
  DiscordTemplateContext,
  DiscordTemplatesPageProps,
} from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type TemplateRow = {
  _id: string;
  name?: string;
  description?: string;
  scope?: "org" | "guild";
  updatedAt?: number;
};

const fallbackContext: DiscordTemplateContext = {
  kind: "tradeidea",
  label: "Trade idea",
  description: "Messages that summarize a trade idea.",
  defaultTemplate: [
    "**{{symbol}}** — **{{direction}}** — **{{status}}**",
    "Qty: `{{netQty}}`{{avgEntryPrice}}",
    "{{realizedPnl}}",
    "{{fees}}",
    "{{openedAt}}",
    "{{closedAt}}",
  ]
    .filter(Boolean)
    .join("\n"),
  fields: [
    { key: "symbol", label: "Symbol" },
    { key: "direction", label: "Direction" },
    { key: "status", label: "Status" },
    { key: "netQty", label: "Net quantity" },
    { key: "avgEntryPrice", label: "Avg entry price" },
    { key: "realizedPnl", label: "Realized PnL" },
    { key: "fees", label: "Fees" },
    { key: "openedAt", label: "Opened at" },
    { key: "closedAt", label: "Closed at" },
  ],
};

export function DiscordTemplatesPage({
  api,
  organizationId,
  guildId,
  templateContexts,
  defaultTemplateKind,
  className,
  ui,
}: DiscordTemplatesPageProps) {
  const contexts = React.useMemo(
    () =>
      Array.isArray(templateContexts) && templateContexts.length > 0
        ? templateContexts
        : [fallbackContext],
    [templateContexts],
  );
  const [kind, setKind] = React.useState(
    defaultTemplateKind ?? contexts[0]?.kind ?? "tradeidea",
  );
  const activeContext =
    contexts.find((context) => context.kind === kind) ?? contexts[0];
  const templates = useQuery(api.queries.listTemplates, {
    ...(organizationId ? { organizationId } : {}),
    guildId,
    kind,
  });
  const createTemplate = useMutation(api.mutations.createTemplate);
  const updateTemplate = useMutation(api.mutations.updateTemplate);
  const deleteTemplate = useMutation(api.mutations.deleteTemplate);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showEditor, setShowEditor] = React.useState(false);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [value, setValue] = React.useState(
    activeContext?.defaultTemplate ?? "",
  );
  const [saving, setSaving] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!Array.isArray(templates)) return;
    if (templates.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId && templates.some((row) => row._id === selectedId)) return;
    if (isCreatingNew) return;
    setSelectedId(templates[0]?._id ?? null);
  }, [templates, selectedId, isCreatingNew]);

  React.useEffect(() => {
    const selected = Array.isArray(templates)
      ? templates.find((row) => row._id === selectedId)
      : undefined;
    if (selected) {
      setName(selected.name ?? "");
      setDescription(selected.description ?? "");
      setValue(selected.template ?? "");
      return;
    }
    setName("");
    setDescription("");
    setValue(activeContext?.defaultTemplate ?? "");
  }, [selectedId, templates, activeContext?.defaultTemplate]);

  React.useEffect(() => {
    if (!contexts.some((context) => context.kind === kind)) {
      setKind(contexts[0]?.kind ?? "tradeidea");
    }
  }, [contexts, kind]);

  React.useEffect(() => {
    if (selectedId) {
      setShowEditor(true);
      setIsCreatingNew(false);
    }
  }, [selectedId]);

  const handleCreate = async () => {
    if (!activeContext) return;
    setCreating(true);
    try {
      const templateId = await createTemplate({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        kind: activeContext.kind,
        name: name.trim() || `New ${activeContext.label} template`,
        description: (description.trim() || activeContext.description) ?? "",
        template: value || activeContext.defaultTemplate || "",
      });
      setSelectedId(templateId);
      setIsCreatingNew(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) {
      await handleCreate();
      return;
    }
    setSaving(true);
    try {
      await updateTemplate({
        ...(organizationId ? { organizationId } : {}),
        templateId: selectedId,
        name: name.trim() || "Untitled template",
        description: description.trim() || undefined,
        template: value,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await deleteTemplate({
        ...(organizationId ? { organizationId } : {}),
        templateId: selectedId,
      });
      setSelectedId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleNewTemplate = () => {
    setSelectedId(null);
    setIsCreatingNew(true);
    setShowEditor(true);
    setName("");
    setDescription("");
    setValue(activeContext?.defaultTemplate ?? "");
  };

  const handleInsertToken = (token: string) => {
    const placeholder = `{{${token}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setValue((prev) => `${prev}${placeholder}`);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = value.slice(0, start) + placeholder + value.slice(end);
    setValue(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + placeholder.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div className={cx("mb-6", ui?.headerClassName)}>
        <h2
          className={cx(
            "text-foreground text-2xl font-semibold",
            ui?.titleClassName,
          )}
        >
          Message templates
        </h2>
        <p
          className={cx(
            "text-muted-foreground text-sm",
            ui?.descriptionClassName,
          )}
        >
          Build reusable message templates and assign them to Discord routes.
        </p>
      </div>

      <div className="space-y-6">
        <EntityList
          title="Template library"
          description="Create and manage templates per message type."
          data={(templates ?? []) as TemplateRow[]}
          className={ui?.listClassName}
          columns={[
            {
              id: "name",
              header: "Template",
              accessorKey: "name",
              cell: (row: TemplateRow) => (
                <div>
                  <div className="text-foreground text-sm font-medium">
                    {row.name ?? "Untitled template"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {row.description ?? "—"}
                  </div>
                </div>
              ),
            },
            {
              id: "scope",
              header: "Scope",
              accessorKey: "scope",
              cell: (row: TemplateRow) => (
                <Badge variant="secondary" className={ui?.badgeClassName}>
                  {row.scope === "guild" ? "Guild" : "Org"}
                </Badge>
              ),
            },
            {
              id: "updatedAt",
              header: "Updated",
              accessorKey: "updatedAt",
              cell: (row: TemplateRow) =>
                row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—",
            },
          ]}
          enableSearch
          selectedId={selectedId}
          getRowId={(row: any) => String(row._id)}
          onRowClick={(row: any) => {
            setSelectedId(String(row._id));
            setShowEditor(true);
            setIsCreatingNew(false);
          }}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {contexts.length > 1 ? (
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contexts.map((context) => (
                      <SelectItem key={context.kind} value={context.kind}>
                        {context.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Button
                onClick={handleNewTemplate}
                disabled={creating}
                className={ui?.buttonClassName}
              >
                {creating ? "Creating..." : "New template"}
              </Button>
            </div>
          }
          emptyState={
            <div
              className={cx(
                "text-muted-foreground rounded-lg border border-dashed p-6 text-sm",
                ui?.emptyStateClassName,
              )}
            >
              No templates yet. Click “New template” to create your first one.
            </div>
          }
        />

        {showEditor ? (
          <Card className={ui?.cardClassName}>
            <CardHeader className={cx("space-y-2", ui?.cardHeaderClassName)}>
              <CardTitle className={ui?.cardTitleClassName}>
                Template editor
              </CardTitle>
              <CardDescription className={ui?.cardDescriptionClassName}>
                {activeContext?.description ??
                  "Define the message body and insert available fields."}
              </CardDescription>
            </CardHeader>
            <CardContent className={cx("space-y-5", ui?.cardContentClassName)}>
              {!selectedId && (templates?.length ?? 0) === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  Fill out the form and click “Create template”.
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template name</Label>
                  <Input
                    id="templateName"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Trade idea recap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Input
                    id="templateDescription"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Used for mentor trade feed posts"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateBody">Message body</Label>
                <Textarea
                  ref={textareaRef}
                  id="templateBody"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  rows={10}
                  placeholder="Write your Discord message..."
                />
              </div>

              <div className="space-y-2">
                <Label>Available fields</Label>
                <div className="flex flex-wrap gap-2">
                  {(activeContext?.fields ?? []).map((field) => (
                    <Button
                      key={field.key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleInsertToken(field.key)}
                    >
                      {`{{${field.key}}}`}
                    </Button>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Click a field to insert the placeholder into the message.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || creating}
                  className={ui?.buttonClassName}
                >
                  {saving || creating
                    ? "Saving..."
                    : selectedId
                      ? "Save changes"
                      : "Create template"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={!selectedId || deleting}
                  className={ui?.outlineButtonClassName}
                >
                  {deleting ? "Deleting..." : "Delete template"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
