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
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Doc } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { api } from "@/convex/_generated/api";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { toast } from "sonner";
import { usePostTypes } from "../settings/post-types/_api/postTypes";
import { useTenant } from "~/context/TenantContext";

type TemplateType = "single" | "archive";

const TEMPLATE_LABEL: Record<TemplateType, string> = {
  single: "Single post",
  archive: "Archive",
};

export default function TemplatesPage() {
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const scopeKey = organizationId ?? "global";
  const { data: postTypesData } = usePostTypes();
  const templates = useQuery(api.puckTemplates.queries.list, {
    scopeKey,
  }) as Doc<"puckTemplates">[] | undefined;
  const createTemplate = useMutation(api.puckTemplates.mutations.create);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateType, setTemplateType] = useState<TemplateType>("single");
  const [postTypeSlug, setPostTypeSlug] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const postTypeOptions = useMemo<Doc<"postTypes">[]>(() => {
    return postTypesData.filter((type) => Boolean(type.slug));
  }, [postTypesData]);

  const selectedPostType = postTypeOptions.find(
    (type) => type.slug === postTypeSlug,
  );

  interface TemplateRow {
    id: string;
    name: string;
    templateType: TemplateType;
    postType: string;
    postTypeSlug: string;
    pageIdentifier: string;
    updatedAt: number;
  }

  const rows = useMemo<TemplateRow[]>(() => {
    if (!templates) {
      return [];
    }
    return templates.map((template) => {
      const matchedPostType = postTypeOptions.find(
        (type) => type.slug === template.postTypeSlug,
      );
      return {
        id: template._id,
        name: template.name,
        templateType: template.templateType as TemplateType,
        postType: matchedPostType?.name ?? template.postTypeSlug,
        postTypeSlug: template.postTypeSlug,
        pageIdentifier: template.pageIdentifier,
        updatedAt: template._creationTime,
      };
    });
  }, [templates, postTypeOptions]);

  const handleCreate = async () => {
    if (!postTypeSlug) {
      toast.error("Select a post type");
      return;
    }
    const postTypeName =
      selectedPostType?.name ??
      postTypeOptions.find((type) => type.slug === postTypeSlug)?.name ??
      postTypeSlug;
    const name =
      customName.trim() || `${TEMPLATE_LABEL[templateType]} · ${postTypeName}`;
    const pageIdentifier = getTenantScopedPageIdentifier(
      `/templates/${templateType}/${postTypeSlug}`,
      { organizationId },
    );
    setIsCreating(true);
    try {
      const template = await Promise.resolve(
        createTemplate({
          name,
          templateType,
          postTypeSlug,
          pageIdentifier,
          organizationId: organizationId ?? undefined,
          scopeKey,
        }),
      );
      if (!template) {
        toast.error("Unable to create template");
        return;
      }
      toast.success("Template created");
      setDialogOpen(false);
      setCustomName("");
      const params = new URLSearchParams({
        pageIdentifier: template.pageIdentifier,
        organizationId: organizationId ?? "public",
        postType: template.postTypeSlug,
        title: template.name,
      });
      window.open(`/puck/edit?${params.toString()}`, "_blank", "noreferrer");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenTemplate = (
    template: Pick<TemplateRow, "pageIdentifier" | "postTypeSlug" | "name">,
  ) => {
    const params = new URLSearchParams({
      pageIdentifier: template.pageIdentifier,
      organizationId: organizationId ?? "public",
      postType: template.postTypeSlug,
      title: template.name,
    });
    window.open(`/puck/edit?${params.toString()}`, "_blank", "noreferrer");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Puck Templates</CardTitle>
            <CardDescription>
              Create Elementor-style templates that control single post or
              archive layouts.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New template
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet. Click &ldquo;New template&rdquo; to start
              designing one in Puck.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Post Type</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TEMPLATE_LABEL[row.templateType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.postType}</TableCell>
                    <TableCell>
                      {new Date(row.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleOpenTemplate({
                            pageIdentifier: row.pageIdentifier,
                            postTypeSlug: row.postTypeSlug,
                            name: row.name,
                          })
                        }
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
                value={templateType}
                onValueChange={(value) =>
                  setTemplateType(value as TemplateType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single post</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
