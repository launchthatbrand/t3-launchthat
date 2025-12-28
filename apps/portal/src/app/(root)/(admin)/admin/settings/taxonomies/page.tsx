"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Loader2,
  Plus,
  Tag,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Switch } from "@acme/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { TaxonomyDoc } from "./_api/taxonomies";
import { usePostTypes } from "../post-types/_api/postTypes";
import {
  useCreateTaxonomy,
  useDeleteTaxonomy,
  useTaxonomies,
  useUpdateTaxonomy,
} from "./_api/taxonomies";

const defaultFormState = {
  name: "",
  slug: "",
  description: "",
  hierarchical: false,
  postTypeSlugs: [] as string[],
};

export default function TaxonomiesSettingsPage() {
  const { data: taxonomyData, isLoading } = useTaxonomies();
  const taxonomies = useMemo(() => taxonomyData ?? [], [taxonomyData]);
  const { data: postTypesData } = usePostTypes(true);
  const postTypes = useMemo(
    () => (postTypesData ?? []) as Doc<"postTypes">[],
    [postTypesData],
  );
  const createTaxonomy = useCreateTaxonomy();
  const updateTaxonomy = useUpdateTaxonomy();
  const deleteTaxonomy = useDeleteTaxonomy();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTaxonomy, setEditingTaxonomy] = useState<TaxonomyDoc | null>(
    null,
  );
  const [formState, setFormState] = useState(defaultFormState);

  const sortedTaxonomies = useMemo(
    () =>
      [...taxonomies].sort((a, b) => {
        if (a.builtIn && !b.builtIn) return -1;
        if (!a.builtIn && b.builtIn) return 1;
        return a.name.localeCompare(b.name);
      }),
    [taxonomies],
  );

  const postTypeOptions = useMemo(
    () =>
      postTypes.map((type) => ({
        label: type.name,
        value: type.slug,
      })),
    [postTypes],
  );

  const openCreateDialog = () => {
    setEditingTaxonomy(null);
    setFormState(defaultFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (taxonomy: TaxonomyDoc) => {
    setEditingTaxonomy(taxonomy);
    setFormState({
      name: taxonomy.name,
      slug: taxonomy.slug,
      description: taxonomy.description ?? "",
      hierarchical: taxonomy.hierarchical,
      postTypeSlugs: taxonomy.postTypeSlugs ?? [],
    });
    setDialogOpen(true);
  };

  const handleSlugChange = (value: string) => {
    const nextSlug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setFormState((prev) => ({ ...prev, slug: nextSlug }));
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      if (!formState.name || !formState.slug) {
        toast("Name and slug are required");
        return;
      }

      if (editingTaxonomy) {
        await updateTaxonomy({
          id: editingTaxonomy._id,
          data: {
            name: formState.name,
            slug: editingTaxonomy.builtIn ? undefined : formState.slug,
            description: formState.description,
            hierarchical: formState.hierarchical,
            postTypeSlugs: formState.postTypeSlugs,
          },
        });
        toast.success(`Updated ${editingTaxonomy.name}`);
      } else {
        await createTaxonomy({
          name: formState.name,
          slug: formState.slug,
          description: formState.description,
          hierarchical: formState.hierarchical,
          postTypeSlugs: formState.postTypeSlugs,
        });
        toast.success(`Created taxonomy ${formState.name}`);
      }
      setDialogOpen(false);
      setEditingTaxonomy(null);
      setFormState(defaultFormState);
    } catch (error) {
      toast.error("Unable to save taxonomy", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (taxonomy: TaxonomyDoc) => {
    if (taxonomy.builtIn) return;
    try {
      await deleteTaxonomy({ id: taxonomy._id });
      toast.success(`Deleted ${taxonomy.name}`);
    } catch (error) {
      toast.error("Unable to delete taxonomy", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-muted-foreground flex items-center justify-center py-10">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading taxonomies…
        </div>
      ) : sortedTaxonomies.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
          <Tag className="h-6 w-6" />
          <p>No taxonomies found. Create your first taxonomy.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Post Types</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTaxonomies.map((taxonomy) => {
                const manageUrl = `/admin/edit?taxonomy=${taxonomy.slug}&post_type=${encodeURIComponent(
                  taxonomy.postTypeSlugs?.[0] ?? "posts",
                )}`;
                return (
                  <TableRow key={taxonomy._id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{taxonomy.name}</span>
                          {taxonomy.builtIn ? (
                            <Badge variant="secondary">Built-in</Badge>
                          ) : null}
                        </div>
                        {taxonomy.description ? (
                          <p className="text-muted-foreground text-sm">
                            {taxonomy.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {taxonomy.slug}
                    </TableCell>
                    <TableCell>
                      {taxonomy.hierarchical ? (
                        <Badge variant="outline">Hierarchical</Badge>
                      ) : (
                        <Badge variant="outline">Flat</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(taxonomy.postTypeSlugs ?? []).length === 0 ? (
                          <Badge variant="secondary">All</Badge>
                        ) : (
                          taxonomy.postTypeSlugs?.map((slug) => (
                            <Badge key={slug} variant="secondary">
                              {slug}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={manageUrl}>Manage terms</Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(taxonomy)}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        <span className="sr-only">Edit {taxonomy.name}</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={taxonomy.builtIn}
                        onClick={() => handleDelete(taxonomy)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete {taxonomy.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingTaxonomy ? "Edit Taxonomy" : "Add Taxonomy"}
            </DialogTitle>
            <DialogDescription>
              {editingTaxonomy
                ? "Update taxonomy settings."
                : "Define a taxonomy to group related posts."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="taxonomy-name">Name</Label>
              <Input
                id="taxonomy-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxonomy-slug">Slug</Label>
              <Input
                id="taxonomy-slug"
                value={formState.slug}
                disabled={editingTaxonomy?.builtIn}
                onChange={(event) => handleSlugChange(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxonomy-description">Description</Label>
              <Input
                id="taxonomy-description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <span className="text-sm font-medium">Hierarchical</span>
                <p className="text-muted-foreground text-xs">
                  Allow parent/child relationships like categories.
                </p>
              </div>
              <Switch
                checked={formState.hierarchical}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({
                    ...prev,
                    hierarchical: checked,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Post Types</Label>
              <ScrollArea className="h-32 rounded-md border p-2">
                <div className="flex flex-col gap-2">
                  {postTypeOptions.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No post types available.
                    </p>
                  ) : (
                    postTypeOptions.map((option) => {
                      const checked = formState.postTypeSlugs.includes(
                        option.value,
                      );
                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span>{option.label}</span>
                          <Switch
                            checked={checked}
                            onCheckedChange={(value) => {
                              setFormState((prev) => {
                                const slugs = new Set(prev.postTypeSlugs);
                                if (value) {
                                  slugs.add(option.value);
                                } else {
                                  slugs.delete(option.value);
                                }
                                return {
                                  ...prev,
                                  postTypeSlugs: Array.from(slugs),
                                };
                              });
                            }}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
              <p className="text-muted-foreground text-xs">
                Leave empty to expose taxonomy to all post types.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTaxonomy ? "Save Changes" : "Create Taxonomy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>How taxonomy menus work</CardTitle>
          <CardDescription>
            Taxonomies don&apos;t show up in the sidebar on their own. Instead,
            any post type that references a taxonomy will automatically get a
            submenu item, such as “Categories”, beneath its admin menu entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground flex items-start gap-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p>
            Example: if the Posts post type includes the built-in{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
              category
            </code>{" "}
            taxonomy, you&apos;ll see a “Categories” submenu beneath Posts that
            links to{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
              /admin/edit?taxonomy=category&amp;post_type=posts
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
