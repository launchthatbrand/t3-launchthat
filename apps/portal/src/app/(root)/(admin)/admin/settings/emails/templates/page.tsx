"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { useTenant } from "~/context/TenantContext";

interface TemplateCatalogRow extends Record<string, unknown> {
  templateId?: Id<"emailTemplates">;
  templateKey: string;
  title: string;
  subject: string;
  hasOverride: boolean;
  designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
  updatedAt?: number;
}

export default function AdminEmailTemplatesPage() {
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;
  const router = useRouter();

  const templates = useQuery(
    api.core.emails.service.listTemplateCatalog,
    orgId ? { orgId } : "skip",
  ) as TemplateCatalogRow[] | undefined;

  const ensureOverride = useMutation(
    api.core.emails.service.ensureTemplateOverrideForKey,
  );
  const migrateLegacy = useMutation(
    api.core.emails.service.migrateLegacyMarkdownTemplatesForOrg,
  ) as (args: {
    orgId: Id<"organizations">;
  }) => Promise<{ migratedCount: number }>;
  const resetOverride = useMutation(
    api.core.emails.service.resetTemplateOverride,
  ) as (args: {
    orgId: Id<"organizations">;
    templateId: Id<"emailTemplates">;
  }) => Promise<null>;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplateKey, setNewTemplateKey] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const rows = useMemo<TemplateCatalogRow[]>(
    () => templates ?? [],
    [templates],
  );

  const columns = useMemo<ColumnDefinition<TemplateCatalogRow>[]>(
    () => [
      {
        id: "templateKey",
        header: "Key",
        accessorKey: "templateKey",
        cell: (item: TemplateCatalogRow) => (
          <div className="max-w-[360px] truncate font-mono text-sm">
            {item.templateKey}
          </div>
        ),
      },
      {
        id: "title",
        header: "Template",
        accessorKey: "title",
        cell: (item: TemplateCatalogRow) => (
          <div className="max-w-[280px] truncate font-medium">{item.title}</div>
        ),
      },
      {
        id: "subject",
        header: "Subject",
        accessorKey: "subject",
        cell: (item: TemplateCatalogRow) => (
          <div className="max-w-[520px] truncate font-medium">
            {item.subject}
          </div>
        ),
      },
      {
        id: "source",
        header: "Source",
        cell: (item: TemplateCatalogRow) => (
          <Badge variant={item.hasOverride ? "default" : "secondary"}>
            {item.hasOverride ? "Customized" : "Default"}
          </Badge>
        ),
      },
      {
        id: "design",
        header: "Design",
        accessorKey: "designOverrideKey",
        cell: (item: TemplateCatalogRow) => (
          <div className="text-muted-foreground text-sm">
            {item.hasOverride
              ? (item.designOverrideKey ?? "inherit")
              : "inherit"}
          </div>
        ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        accessorKey: "updatedAt",
        cell: (item: TemplateCatalogRow) =>
          item.updatedAt ? (
            <div className="text-muted-foreground text-sm">
              {new Date(item.updatedAt).toLocaleString()}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">—</div>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: (item: TemplateCatalogRow) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reset overrides"
              disabled={!orgId || !item.templateId || !item.hasOverride}
              onClick={() => {
                if (!orgId || !item.templateId) return;
                const templateId = item.templateId;
                void (async () => {
                  try {
                    await resetOverride({ orgId, templateId });
                    toast.success("Overrides reset");
                  } catch (err) {
                    toast.error("Failed to reset overrides", {
                      description:
                        err instanceof Error ? err.message : String(err),
                    });
                  }
                })();
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Edit template"
              onClick={() => {
                if (!orgId) return;
                if (item.templateId) {
                  router.push(
                    `/admin/settings/emails/template/${item.templateId}`,
                  );
                  return;
                }
                void (async () => {
                  try {
                    const templateId = await ensureOverride({
                      orgId,
                      templateKey: item.templateKey,
                    });
                    router.push(
                      `/admin/settings/emails/template/${templateId}`,
                    );
                  } catch (err) {
                    toast.error("Failed to open template", {
                      description:
                        err instanceof Error ? err.message : String(err),
                    });
                  }
                })();
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [ensureOverride, orgId, resetOverride, router],
  );

  return (
    <div className="space-y-4">
      <EntityList
        data={rows}
        columns={columns}
        title="Templates"
        description="Email templates used for transactional messages (React Email). Edit a template to override copy and/or design for this org."
        isLoading={templates === undefined}
        emptyState={<div className="text-muted-foreground">No templates.</div>}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!orgId || isMigrating}
              onClick={() => {
                if (!orgId) return;
                void (async () => {
                  try {
                    setIsMigrating(true);
                    const result = await migrateLegacy({ orgId });
                    toast.success("Legacy templates migrated", {
                      description: `${result.migratedCount} template(s) migrated.`,
                    });
                  } catch (err) {
                    toast.error("Failed to migrate legacy templates", {
                      description:
                        err instanceof Error ? err.message : String(err),
                    });
                  } finally {
                    setIsMigrating(false);
                  }
                })();
              }}
            >
              Migrate legacy markdown
            </Button>
            <Button
              type="button"
              disabled={!orgId}
              onClick={() => {
                if (!orgId) return;
                setNewTemplateKey("");
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create template
            </Button>
          </div>
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Create template</DialogTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={newTemplateKey} onValueChange={setNewTemplateKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {rows.map((row) => (
                    <SelectItem key={row.templateKey} value={row.templateKey}>
                      {row.title} ({row.templateKey})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-muted-foreground text-xs">
                This creates an org override record for the selected template.
                URLs are ID-based.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !orgId || isCreating || newTemplateKey.trim().length === 0
                }
                onClick={() => {
                  if (!orgId) return;
                  void (async () => {
                    try {
                      setIsCreating(true);
                      const templateId = await ensureOverride({
                        orgId,
                        templateKey: newTemplateKey.trim(),
                      });
                      setIsCreateOpen(false);
                      router.push(
                        `/admin/settings/emails/template/${templateId}`,
                      );
                    } catch (err) {
                      toast.error("Failed to create template", {
                        description:
                          err instanceof Error ? err.message : String(err),
                      });
                    } finally {
                      setIsCreating(false);
                    }
                  })();
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
