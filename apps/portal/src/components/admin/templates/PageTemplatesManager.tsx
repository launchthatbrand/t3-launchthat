"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PencilLine, Plus } from "lucide-react";
import { toast } from "sonner";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import { usePostTypes } from "~/app/(root)/(admin)/admin/settings/post-types/_api/postTypes";
import { useTenant } from "~/context/TenantContext";

const TEMPLATE_CATEGORY_OPTIONS = [
  { value: "single", label: "Single (individual entry)" },
  { value: "archive", label: "Archive (listing page)" },
  { value: "loop", label: "Loop Item (grid/carousel item)" },
  { value: "container", label: "Container / Section" },
] as const;

type TemplateCategory = (typeof TEMPLATE_CATEGORY_OPTIONS)[number]["value"];

const categoryRequiresTarget = (category: TemplateCategory) =>
  category === "single" || category === "archive" || category === "loop";

interface TemplateListItem extends Record<string, unknown> {
  _id: Id<"posts">;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  templateCategory: TemplateCategory;
  targetPostType: string | null;
  pageIdentifier: string;
  loopContext: unknown;
  organizationId?: Id<"organizations"> | null;
  updatedAt: number;
}

interface TemplateRow extends TemplateListItem {
  scope: "tenant" | "global";
}

export function PageTemplatesManager() {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const { data: postTypesData } = usePostTypes();

  const templates = useQuery(api.core.posts.queries.listTemplates, {
    organizationId,
  }) as TemplateListItem[] | undefined;

  const createTemplate = useMutation(api.core.posts.mutations.createTemplate);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateCategory, setTemplateCategory] =
    useState<TemplateCategory>("single");
  const [postTypeSlug, setPostTypeSlug] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [loopContext, setLoopContext] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const postTypeOptions = useMemo(() => {
    const list = Array.isArray(postTypesData) ? postTypesData : [];
    return list.filter(
      (type) => Boolean(type.slug) && type.slug !== "templates",
    );
  }, [postTypesData]);

  const postTypeLabel = useCallback(
    (slug?: string | null) =>
      postTypeOptions.find((type) => type.slug === slug)?.name ?? slug ?? "—",
    [postTypeOptions],
  );

  const rows: TemplateRow[] = useMemo(() => {
    return (templates ?? []).map((template) => ({
      ...template,
      scope: template.organizationId ? "tenant" : "global",
    }));
  }, [templates]);

  const columns = useMemo<ColumnDefinition<TemplateRow>[]>(
    () => [
      {
        id: "title",
        header: "Name",
        accessorKey: "title",
        cell: (row: TemplateRow) => (
          <span className="font-medium">{row.title}</span>
        ),
      },
      {
        id: "templateCategory",
        header: "Category",
        accessorKey: "templateCategory",
        cell: (row: TemplateRow) => (
          <Badge variant="outline">
            {TEMPLATE_CATEGORY_OPTIONS.find(
              (opt) => opt.value === row.templateCategory,
            )?.label ?? row.templateCategory}
          </Badge>
        ),
      },
      {
        id: "targetPostType",
        header: "Target",
        accessorKey: "targetPostType",
        cell: (row: TemplateRow) => postTypeLabel(row.targetPostType),
      },
      {
        id: "scope",
        header: "Scope",
        accessorKey: "scope",
        cell: (row: TemplateRow) =>
          row.scope === "tenant" ? (
            <Badge variant="secondary">Tenant</Badge>
          ) : (
            <Badge variant="outline">Global</Badge>
          ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        accessorKey: "updatedAt",
        cell: (row: TemplateRow) => new Date(row.updatedAt).toLocaleString(),
      },
    ],
    [postTypeLabel],
  );

  const filters: FilterConfig<TemplateRow>[] = useMemo(
    () => [
      {
        id: "title",
        label: "Name",
        type: "text",
        field: "title",
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        field: "status",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
          { label: "Archived", value: "archived" },
        ],
      },
      {
        id: "templateCategory",
        label: "Category",
        type: "select",
        field: "templateCategory",
        options: TEMPLATE_CATEGORY_OPTIONS.map((opt) => ({
          label: opt.label,
          value: opt.value,
        })),
      },
      {
        id: "scope",
        label: "Scope",
        type: "select",
        field: "scope",
        options: [
          { label: "Global", value: "global" },
          { label: "Tenant", value: "tenant" },
        ],
      },
    ],
    [],
  );

  const handleCreate = async () => {
    const needsTarget = categoryRequiresTarget(templateCategory);
    if (needsTarget && !postTypeSlug) {
      toast.error("Select the post type this template applies to.");
      return;
    }

    const templateName =
      customName.trim() ||
      `${
        TEMPLATE_CATEGORY_OPTIONS.find((opt) => opt.value === templateCategory)
          ?.label ?? "Template"
      } · ${postTypeLabel(postTypeSlug)}`;

    setIsCreating(true);
    try {
      const result = await createTemplate({
        title: templateName,
        templateCategory,
        targetPostType: needsTarget ? postTypeSlug : undefined,
        loopContext: loopContext.trim() || undefined,
        organizationId,
        status: "draft",
      });

      toast.success("Template created");
      setDialogOpen(false);
      setCustomName("");
      setLoopContext("");

      const params = new URLSearchParams({
        pageIdentifier: result.pageIdentifier,
        organizationId: organizationId ?? "public",
        title: templateName,
        postId: result.id,
        postType: templateCategory,
      });
      window.open(`/puck/edit?${params.toString()}`, "_blank", "noreferrer");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenTemplate = useCallback((template: TemplateListItem) => {
    const params = new URLSearchParams({
      pageIdentifier: template.pageIdentifier,
      organizationId: template.organizationId ?? "public",
      title: template.title,
      postId: template._id,
      postType: template.templateCategory,
    });
    window.open(`/puck/edit?${params.toString()}`, "_blank", "noreferrer");
  }, []);

  const entityActions: EntityAction<TemplateRow>[] = useMemo(
    () => [
      {
        id: "edit",
        label: "Edit",
        icon: <PencilLine className="h-4 w-4" />,
        onClick: (row) => handleOpenTemplate(row),
        variant: "outline",
      },
    ],
    [handleOpenTemplate],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <EntityList<TemplateRow>
            data={rows}
            columns={columns}
            filters={filters}
            isLoading={templates === undefined}
            actions={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New template
              </Button>
            }
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch
            onRowClick={(row) => handleOpenTemplate(row)}
            entityActions={entityActions}
            emptyState={
              <p className="text-muted-foreground text-sm">
                No templates yet. Click &ldquo;New template&rdquo; to start
                designing one in Puck.
              </p>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template type</label>
              <Select
                value={templateCategory}
                onValueChange={(value) =>
                  setTemplateCategory(value as TemplateCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose template type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categoryRequiresTarget(templateCategory) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Post type</label>
                <Select
                  value={postTypeSlug}
                  onValueChange={(value) => setPostTypeSlug(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a post type" />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypeOptions.map((type) => (
                      <SelectItem key={type.slug} value={type.slug}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Template name (optional)
              </label>
              <Input
                value={customName}
                placeholder="e.g. Archive · Projects"
                onChange={(event) => setCustomName(event.target.value)}
              />
            </div>

            {templateCategory === "loop" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Loop context (JSON, optional)
                </label>
                <Textarea
                  value={loopContext}
                  placeholder='e.g. {"order":"asc","limit":8}'
                  onChange={(event) => setLoopContext(event.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create &amp; edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
