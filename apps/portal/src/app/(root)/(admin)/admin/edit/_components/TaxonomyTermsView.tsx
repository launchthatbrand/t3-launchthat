"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@acme/ui";

import type { TaxonomyTerm } from "../../settings/taxonomies/_api/taxonomies";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  useCreateTaxonomyTerm,
  useDeleteTaxonomyTerm,
  useEnsureBuiltInTaxonomies,
  useTaxonomyBySlug,
  useTaxonomyTerms,
  useUpdateTaxonomyTerm,
} from "../../settings/taxonomies/_api/taxonomies";

type PostTypeDoc = Doc<"postTypes">;

type TaxonomyTermRow = TaxonomyTerm;

const BUILTIN_TAXONOMY_SLUGS = new Set(["category", "post_tag"]);

const EMPTY_TERM_STATE = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

export interface TaxonomyTermsViewProps {
  taxonomySlug: string;
  postTypeSlug: string;
  postTypes: PostTypeDoc[];
  onPostTypeChange: (slug: string) => void;
}

export function TaxonomyTermsView({
  taxonomySlug,
  postTypeSlug,
  postTypes,
  onPostTypeChange,
}: TaxonomyTermsViewProps) {
  const taxonomy = useTaxonomyBySlug(taxonomySlug);
  const taxonomyTermsData = useTaxonomyTerms(taxonomySlug);
  const terms: TaxonomyTermRow[] = useMemo(
    () => taxonomyTermsData ?? [],
    [taxonomyTermsData],
  );
  const createTerm = useCreateTaxonomyTerm();
  const updateTerm = useUpdateTaxonomyTerm();
  const deleteTerm = useDeleteTaxonomyTerm();
  const ensureBuiltIns = useEnsureBuiltInTaxonomies();
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [termSaving, setTermSaving] = useState(false);
  const [termForm, setTermForm] = useState(EMPTY_TERM_STATE);
  const [editingTerm, setEditingTerm] = useState<TaxonomyTermRow | null>(null);

  const taxonomyDoc = taxonomy ?? null;
  const loading = taxonomy === undefined;

  useEffect(() => {
    if (
      taxonomySlug &&
      BUILTIN_TAXONOMY_SLUGS.has(taxonomySlug) &&
      taxonomy === null
    ) {
      void ensureBuiltIns();
    }
  }, [taxonomySlug, taxonomy, ensureBuiltIns]);

  const parentOptions = useMemo(() => {
    if (!taxonomyDoc?.hierarchical) return [];
    return terms.filter((term) =>
      editingTerm ? term._id !== editingTerm._id : true,
    );
  }, [taxonomyDoc, terms, editingTerm]);

  const parentLookup = useMemo(() => {
    const map = new Map<string, TaxonomyTermRow>();
    terms.forEach((term) => map.set(term._id as string, term));
    return map;
  }, [terms]);

  const resetTermDialog = () => {
    setTermForm(EMPTY_TERM_STATE);
    setEditingTerm(null);
    setTermDialogOpen(false);
  };

  const openCreateTerm = () => {
    setEditingTerm(null);
    setTermForm(EMPTY_TERM_STATE);
    setTermDialogOpen(true);
  };

  const openEditTerm = (term: TaxonomyTermRow) => {
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      slug: term.slug,
      description: term.description ?? "",
      parentId: term.parentId ?? "",
    });
    setTermDialogOpen(true);
  };

  const castTermId = (
    value: Id<"categories"> | Id<"tags"> | Id<"taxonomyTerms">,
  ) => {
    if (!taxonomyDoc) return value;
    if (taxonomyDoc.termCollection === "categories") {
      return value as Id<"categories">;
    }
    if (taxonomyDoc.termCollection === "tags") {
      return value as Id<"tags">;
    }
    return value as Id<"taxonomyTerms">;
  };

  const castParentId = (value: string) => {
    if (!value) return undefined;
    if (!taxonomyDoc?.hierarchical) return undefined;
    if (taxonomyDoc.termCollection === "categories") {
      return value as Id<"categories">;
    }
    if (taxonomyDoc.termCollection === "custom") {
      return value as Id<"taxonomyTerms">;
    }
    return undefined;
  };

  const handleTermSave = async () => {
    if (!taxonomyDoc) {
      toast.error("Taxonomy not found");
      return;
    }
    if (!termForm.name) {
      toast("Name is required for terms");
      return;
    }

    try {
      setTermSaving(true);
      const basePayload = {
        taxonomySlug,
        name: termForm.name,
        slug: termForm.slug || undefined,
        description: termForm.description || undefined,
      };
      const parentId =
        taxonomyDoc.hierarchical && termForm.parentId
          ? castParentId(termForm.parentId)
          : undefined;

      if (editingTerm) {
        await updateTerm({
          ...basePayload,
          termId: castTermId(editingTerm._id),
          data: {
            name: basePayload.name,
            slug: basePayload.slug,
            description: basePayload.description,
            parentId,
          },
        });
        toast.success(`Updated ${editingTerm.name}`);
      } else {
        await createTerm({
          ...basePayload,
          parentId,
        });
        toast.success(`Created ${termForm.name}`);
      }
      resetTermDialog();
    } catch (error) {
      toast.error("Unable to save term", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setTermSaving(false);
    }
  };

  const handleDeleteTerm = async (term: TaxonomyTermRow) => {
    if (!taxonomyDoc) return;
    const confirmed = window.confirm(
      `Delete ${term.name}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteTerm({
        taxonomySlug,
        termId: castTermId(term._id),
      });
      toast.success(`Deleted ${term.name}`);
    } catch (error) {
      toast.error("Unable to delete term", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <AdminLayout
        title={`${taxonomyDoc?.name ?? taxonomySlug} Terms`}
        description={
          taxonomyDoc?.description ??
          "Structure content using categories and tags."
        }
        pathname={`/admin/edit/taxonomy?taxonomy=${taxonomySlug}`}
      >
        <AdminLayoutContent withSidebar>
          <AdminLayoutMain>
            <AdminLayoutHeader />
            <div className="container space-y-6 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Select value={postTypeSlug} onValueChange={onPostTypeChange}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select post type" />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypes.map((type) => (
                      <SelectItem key={type._id} value={type.slug}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={openCreateTerm}>
                  Add term
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Terms</CardTitle>
                  <CardDescription>
                    Manage hierarchical taxonomies similar to WordPress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading taxonomy…
                    </div>
                  ) : terms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No terms yet. Create one to start organizing entries.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {terms.map((term) => (
                        <div
                          key={term._id}
                          className="flex flex-wrap items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {term.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              slug: {term.slug}
                            </p>
                            {term.parentId && (
                              <p className="text-xs text-muted-foreground">
                                Parent: {parentLookup.get(term.parentId)?.name}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditTerm(term)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDeleteTerm(term)}
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
            </div>
          </AdminLayoutMain>
          <AdminLayoutSidebar className="border-l p-4">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Configure how this taxonomy relates to custom post types.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={postTypeSlug} onValueChange={onPostTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select post type" />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypes.map((type) => (
                      <SelectItem key={type._id} value={type.slug}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Assigned to:
                    {taxonomyDoc?.postTypeSlugs?.length ? (
                      <span className="ml-1 font-medium text-foreground">
                        {taxonomyDoc.postTypeSlugs.join(", ")}
                      </span>
                    ) : (
                      <span className="ml-1 font-medium text-foreground">
                        All post types
                      </span>
                    )}
                  </p>
                  <div>
                    <Badge variant="outline">
                      {taxonomyDoc?.hierarchical ? "Hierarchical" : "Flat"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AdminLayoutSidebar>
        </AdminLayoutContent>
      </AdminLayout>

      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTerm ? "Edit term" : "Add term"}</DialogTitle>
            <DialogDescription>
              {taxonomyDoc?.hierarchical
                ? "Nest terms to build hierarchies."
                : "Flat terms act like tags."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="term-name">Name</Label>
              <Input
                id="term-name"
                value={termForm.name}
                onChange={(event) =>
                  setTermForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="term-slug">Slug</Label>
              <Input
                id="term-slug"
                value={termForm.slug}
                onChange={(event) =>
                  setTermForm((prev) => ({
                    ...prev,
                    slug: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="term-description">Description</Label>
              <Textarea
                id="term-description"
                value={termForm.description}
                onChange={(event) =>
                  setTermForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            {taxonomyDoc?.hierarchical ? (
              <div className="grid gap-2">
                <Label htmlFor="term-parent">Parent term</Label>
                <Select
                  value={termForm.parentId}
                  onValueChange={(value) =>
                    setTermForm((prev) => ({ ...prev, parentId: value }))
                  }
                >
                  <SelectTrigger id="term-parent">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parentOptions.map((term) => (
                      <SelectItem key={term._id} value={term._id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={resetTermDialog}
              disabled={termSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleTermSave} disabled={termSaving}>
              {termSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTerm ? "Save" : "Create term"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
