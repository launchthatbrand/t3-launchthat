"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import type {
  DiscordTemplateContext,
  DiscordTemplatesPageProps,
} from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useAction, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import React from "react";
import { Textarea } from "@acme/ui/textarea";
import { DiscordChannelSelect } from "../components";

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

  // Preview / send-test (optional host-app actions)
  const listGuildChannels = useAction(api.actions.listGuildChannels);
  const previewTemplate = useAction(api.actions.previewTemplate ?? "skip");
  const sendTemplateTest = useAction(api.actions.sendTemplateTest ?? "skip");

  const [channels, setChannels] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loadingChannels, setLoadingChannels] = React.useState(false);
  const [testChannelId, setTestChannelId] = React.useState("");
  const [includeSnapshot, setIncludeSnapshot] = React.useState(false);
  const [sampleValues, setSampleValues] = React.useState<Record<string, string>>({});
  const [previewing, setPreviewing] = React.useState(false);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState<string>("");
  const [previewImageBase64, setPreviewImageBase64] = React.useState<string | null>(null);

  const refreshChannels = async () => {
    if (!guildId) return;
    setLoadingChannels(true);
    try {
      const res = await listGuildChannels({
        ...(organizationId ? { organizationId } : {}),
        guildId,
      });
      const rows = Array.isArray(res) ? (res as any[]) : [];
      setChannels(
        rows
          .map((c) => ({ id: String(c?.id ?? ""), name: String(c?.name ?? "") }))
          .filter((c) => c.id && c.name),
      );
    } finally {
      setLoadingChannels(false);
    }
  };

  React.useEffect(() => {
    void refreshChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, organizationId]);

  React.useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const f of activeContext?.fields ?? []) {
      defaults[f.key] = defaults[f.key] ?? "";
    }
    setSampleValues((prev) => ({ ...defaults, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext?.kind]);

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

  const handleGeneratePreview = async () => {
    if (!api.actions.previewTemplate) return;
    if (!selectedId) return;
    setPreviewing(true);
    try {
      const res = await previewTemplate({
        ...(organizationId ? { organizationId } : {}),
        templateId: selectedId,
        values: sampleValues,
        includeSnapshot,
      });
      setPreviewContent(String((res as any)?.content ?? ""));
      setPreviewImageBase64(
        typeof (res as any)?.imageBase64 === "string" ? (res as any).imageBase64 : null,
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleSendTest = async () => {
    if (!api.actions.sendTemplateTest) return;
    if (!selectedId) return;
    if (!guildId) return;
    if (!testChannelId.trim()) return;
    setSendingTest(true);
    try {
      await sendTemplateTest({
        ...(organizationId ? { organizationId } : {}),
        guildId,
        channelId: testChannelId,
        templateId: selectedId,
        values: sampleValues,
        includeSnapshot,
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className={cx(className, ui?.pageClassName)}>


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

        {guildId ? (
          <Card className={ui?.cardClassName}>
            <CardHeader className={cx("space-y-2", ui?.cardHeaderClassName)}>
              <CardTitle className={ui?.cardTitleClassName}>Preview & send test</CardTitle>
              <CardDescription className={ui?.cardDescriptionClassName}>
                Render the template with sample values and send a test message to Discord.
              </CardDescription>
            </CardHeader>
            <CardContent className={cx("space-y-5", ui?.cardContentClassName)}>
              {!api.actions.previewTemplate ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  Preview pipeline not enabled in this host app yet.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Test channel</Label>
                      <DiscordChannelSelect
                        value={testChannelId}
                        onChange={setTestChannelId}
                        options={channels}
                        placeholder={loadingChannels ? "Loading..." : "Pick a channel..."}
                      />
                      <Button
                        variant="outline"
                        className={ui?.outlineButtonClassName}
                        disabled={loadingChannels}
                        onClick={() => void refreshChannels()}
                      >
                        {loadingChannels ? "Refreshing..." : "Refresh channels"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Include snapshot PNG</Label>
                      <Select
                        value={includeSnapshot ? "true" : "false"}
                        onValueChange={(v) => setIncludeSnapshot(v === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        TraderLaunchpad-only: attaches the snapshot PNG and embeds it in Discord.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {(activeContext?.fields ?? []).slice(0, 8).map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}</Label>
                        <Input
                          value={sampleValues[field.key] ?? ""}
                          onChange={(e) =>
                            setSampleValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          placeholder={`{{${field.key}}}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      className={ui?.outlineButtonClassName}
                      disabled={!selectedId || previewing}
                      onClick={() => void handleGeneratePreview()}
                    >
                      {previewing ? "Rendering..." : "Generate preview"}
                    </Button>
                    <Button
                      className={ui?.buttonClassName}
                      disabled={!api.actions.sendTemplateTest || !testChannelId || sendingTest}
                      onClick={() => void handleSendTest()}
                    >
                      {sendingTest ? "Sending..." : "Send test to Discord"}
                    </Button>
                  </div>

                  {previewContent ? (
                    <div className="space-y-2">
                      <Label>Rendered content</Label>
                      <pre className="bg-muted/40 border border-border/60 rounded-md p-3 text-sm whitespace-pre-wrap">
                        {previewContent}
                      </pre>
                    </div>
                  ) : null}

                  {previewImageBase64 ? (
                    <div className="space-y-2">
                      <Label>Rendered image</Label>
                      <img
                        alt="Template preview image"
                        className="max-w-full rounded-md border border-border/60"
                        src={`data:image/png;base64,${previewImageBase64}`}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
