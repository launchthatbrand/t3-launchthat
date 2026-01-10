"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { MultiSelect } from "@acme/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import type { TaxonomyTerm } from "../../settings/taxonomies/_api/taxonomies";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
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
  postTypeSlugs: [] as string[],
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
  const tenant = useTenant();
  const organizationId =
    (tenant?._id) ?? undefined;

  const taxonomy = useTaxonomyBySlug(taxonomySlug, organizationId);
  const taxonomyTermsData = useTaxonomyTerms(
    taxonomySlug,
    organizationId,
    postTypeSlug,
  ) as TaxonomyTermRow[] | undefined;
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
  const [pendingDeleteTerm, setPendingDeleteTerm] =
    useState<TaxonomyTermRow | null>(null);
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

  const allPostTypeSlugs = useMemo(
    () => postTypes.map((type) => type.slug),
    [postTypes],
  );

  const openCreateTerm = () => {
    setEditingTerm(null);
    setTermForm({ ...EMPTY_TERM_STATE, postTypeSlugs: allPostTypeSlugs });
    setTermDialogOpen(true);
  };

  const openEditTerm = (term: TaxonomyTermRow) => {
    const termPostTypes: string[] = Array.isArray(term.postTypeSlugs)
      ? term.postTypeSlugs.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const scopedPostTypes =
      termPostTypes.length > 0 ? termPostTypes : allPostTypeSlugs;
    setEditingTerm(term);
    setTermForm({
      name: term.name,
      slug: term.slug,
      description: term.description ?? "",
      parentId: term.parentId ?? "",
      postTypeSlugs: scopedPostTypes,
    });
    setTermDialogOpen(true);
  };

  const castParentId = (value: string) => {
    if (!value || value === "__none__") return undefined;
    if (!taxonomyDoc?.hierarchical) return undefined;
      return value as Id<"taxonomyTerms">;
  };

  const handleTermSave = async () => {
    if (!taxonomyDoc) {
      toast.error("Taxonomy not found");
      return;
    }
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }
    if (!termForm.name) {
      toast("Name is required for terms");
      return;
    }

    try {
      setTermSaving(true);
      const basePayload = {
        organizationId,
        taxonomySlug,
        name: termForm.name,
        slug: termForm.slug || undefined,
        description: termForm.description || undefined,
      };
      const parentId =
        taxonomyDoc.hierarchical && termForm.parentId
          ? castParentId(termForm.parentId)
          : undefined;

      const selectedPostTypeSlugs =
        termForm.postTypeSlugs.length === allPostTypeSlugs.length
          ? undefined
          : termForm.postTypeSlugs;

      if (editingTerm) {
        await updateTerm({
          organizationId,
          taxonomySlug,
          termId: editingTerm._id,
          data: {
            name: basePayload.name,
            slug: basePayload.slug,
            description: basePayload.description,
            parentId,
            postTypeSlugs: selectedPostTypeSlugs,
          },
        });
        toast.success(`Updated ${editingTerm.name}`);
      } else {
        await createTerm({
          ...basePayload,
          parentId,
          postTypeSlugs: selectedPostTypeSlugs,
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

  const deleteTermNow = async (term: TaxonomyTermRow) => {
    if (!taxonomyDoc) return;
    if (!organizationId) return;
    try {
      await deleteTerm({
        organizationId,
        taxonomySlug,
        termId: term._id,
      });
      toast.success(`Deleted ${term.name}`);
    } catch (error) {
      toast.error("Unable to delete term", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleDeleteTerm = async (term: TaxonomyTermRow) => {
    setPendingDeleteTerm(term);
  };

  return (
    <>
      <AlertDialog
        open={pendingDeleteTerm != null}
        onOpenChange={(open) => setPendingDeleteTerm(open ? pendingDeleteTerm : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete term?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete{" "}
              <span className="font-medium">
                {pendingDeleteTerm?.name ?? "this term"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteTerm(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const term = pendingDeleteTerm;
                setPendingDeleteTerm(null);
                if (term) void deleteTermNow(term);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <SelectTrigger className="w-60">
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
                    <div className="text-muted-foreground flex h-32 items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading taxonomy…
                    </div>
                  ) : terms.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
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
                            <p className="text-foreground font-medium">
                              {term.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              slug: {term.slug}
                            </p>
                            {term.parentId && (
                              <p className="text-muted-foreground text-xs">
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
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>
                    Assigned to:
                    {taxonomyDoc?.postTypeSlugs?.length ? (
                      <span className="text-foreground ml-1 font-medium">
                        {taxonomyDoc.postTypeSlugs.join(", ")}
                      </span>
                    ) : (
                      <span className="text-foreground ml-1 font-medium">
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
            <div className="grid gap-2">
              <Label>Post types</Label>
              <MultiSelect
                key={`${editingTerm?._id ?? "new"}-${termDialogOpen ? "open" : "closed"}`}
                options={postTypes.map((type) => ({
                  label: type.name,
                  value: type.slug,
                }))}
                defaultValue={termForm.postTypeSlugs}
                onValueChange={(value) =>
                  setTermForm((prev) => ({
                    ...prev,
                    postTypeSlugs: value,
                  }))
                }
                placeholder="All post types"
                maxCount={3}
              />
              <p className="text-muted-foreground text-xs">
                Defaults to all post types. Unselect to scope where this term is
                available.
              </p>
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
                    <SelectItem value="__none__">None</SelectItem>
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
