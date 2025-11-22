"use client";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Loader2, PencilLine, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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

type TemplateListItem = {
  _id: Id<"posts">;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  templateCategory: TemplateCategory;
  targetPostType: string | null;
  pageIdentifier: string;
  loopContext: unknown | null;
  organizationId?: Id<"organizations"> | null;
  updatedAt: number;
};

export function PageTemplatesManager() {
  const tenant = useTenant();
  const organizationId = tenant?._id ?? null;
  const { data: postTypesData } = usePostTypes();

  const templates = useQuery(api.core.posts.queries.listTemplates, {
    organizationId: organizationId ?? undefined,
  }) as TemplateListItem[] | undefined;

  const createTemplate = useMutation(
    api.core.posts.mutations.createTemplate,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateCategory, setTemplateCategory] =
    useState<TemplateCategory>("single");
  const [postTypeSlug, setPostTypeSlug] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [loopContext, setLoopContext] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const postTypeOptions = useMemo(() => {
    return (postTypesData ?? []).filter(
      (type) => Boolean(type.slug) && type.slug !== "templates",
    );
  }, [postTypesData]);

  const postTypeLabel = (slug?: string | null) =>
    postTypeOptions.find((type) => type.slug === slug)?.name ?? slug ?? "—";

  const rows = useMemo(() => {
    if (!templates) return [];
    return templates;
  }, [templates]);

  const handleCreate = async () => {
    const needsTarget = categoryRequiresTarget(templateCategory);
    if (needsTarget && !postTypeSlug) {
      toast.error("Select the post type this template applies to.");
      return;
    }

    const templateName =
      customName.trim() ||
      `${TEMPLATE_CATEGORY_OPTIONS.find(
        (opt) => opt.value === templateCategory,
      )?.label ?? "Template"} · ${postTypeLabel(postTypeSlug)}`;

    setIsCreating(true);
    try {
      const result = await createTemplate({
        title: templateName,
        templateCategory,
        targetPostType: needsTarget ? postTypeSlug : undefined,
        loopContext: loopContext.trim() || undefined,
        organizationId: organizationId ?? undefined,
        status: "draft",
      });

      if (!result) {
        toast.error("Unable to create template");
        return;
      }

      toast.success("Template created");
      setDialogOpen(false);
      setCustomName("");
      setLoopContext("");

      const params = new URLSearchParams({
        pageIdentifier: result.pageIdentifier,
        organizationId: organizationId ?? "public",
        title: templateName,
      });
      window.open(`/puck/edit?${params.toString()}`, "_blank", "noreferrer");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenTemplate = (template: TemplateListItem) => {
    const params = new URLSearchParams({
      pageIdentifier: template.pageIdentifier,
      organizationId: template.organizationId ?? "public",
      title: template.title,
    });
    window.open(`/puck/edit?${params.toString()}`, "_blank", "noreferrer");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Build reusable layouts for single entries, archives, loop items,
              or standalone sections.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New template
          </Button>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <p className="text-sm text-muted-foreground">
              No templates yet. Click &ldquo;New template&rdquo; to start
              designing one in Puck.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {
                          TEMPLATE_CATEGORY_OPTIONS.find(
                            (opt) => opt.value === row.templateCategory,
                          )?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>{postTypeLabel(row.targetPostType)}</TableCell>
                    <TableCell>
                      {row.organizationId ? (
                        <Badge variant="secondary">Tenant</Badge>
                      ) : (
                        <Badge variant="outline">Global</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(row.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTemplate(row)}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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

