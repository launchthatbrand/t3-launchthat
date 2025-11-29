"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { ChevronLeft, Edit, Loader2, Plus, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import {
  useAddPostTypeField,
  useCreatePostType,
  useDeletePostType,
  useInitPostTypes,
  usePostTypeFields,
  usePostTypes,
  useRemovePostTypeField,
  useUpdatePostTypeEntryCounts,
} from "./_api/postTypes";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "sonner";

type FieldType =
  | "text"
  | "textarea"
  | "richText"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "image"
  | "file"
  | "select"
  | "multiSelect"
  | "relation"
  | "json";

const TAB_VALUES = ["types", "fields", "taxonomies"] as const;
type TabValue = (typeof TAB_VALUES)[number];
const DEFAULT_TAB: TabValue = "types";

const isValidTab = (value: string | null): value is TabValue => {
  if (!value) return false;
  return TAB_VALUES.includes(value as TabValue);
};

interface TaxonomyDefinition {
  slug: string;
  name: string;
  description: string;
  hierarchical: boolean;
  builtIn?: boolean;
}

const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: "Text", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Rich Text", value: "richText" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Date & Time", value: "datetime" },
  { label: "Image", value: "image" },
  { label: "File", value: "file" },
  { label: "Select", value: "select" },
  { label: "Multi Select", value: "multiSelect" },
  { label: "Relation", value: "relation" },
  { label: "JSON", value: "json" },
];

const DEFAULT_TAXONOMIES: TaxonomyDefinition[] = [
  {
    slug: "category",
    name: "Categories",
    description:
      "Hierarchical taxonomy for structuring content similar to WordPress categories.",
    hierarchical: true,
    builtIn: true,
  },
  {
    slug: "post_tag",
    name: "Tags",
    description:
      "Flat taxonomy for contextual keywords similar to WordPress tags.",
    hierarchical: false,
    builtIn: true,
  },
  {
    slug: "product_category",
    name: "Product Categories",
    description: "Hierarchical taxonomy for organizing catalog items.",
    hierarchical: true,
  },
];

const normalizeMetaKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

type PostType = Doc<"postTypes">;

export default function PostTypesSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const postTypeParam = searchParams.get("post_type");
  const initialTab = isValidTab(tabParam) ? tabParam : DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPostType, setNewPostType] = useState({
    name: "",
    slug: "",
    description: "",
    isPublic: true,
    includeTimestamps: true,
    enableApi: true,
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState<{
    name: string;
    key: string;
    type: FieldType;
    description: string;
    required: boolean;
    searchable: boolean;
    filterable: boolean;
  }>({
    name: "",
    key: "",
    type: "text",
    description: "",
    required: false,
    searchable: false,
    filterable: false,
  });
  const [taxonomyPostType, setTaxonomyPostType] = useState<string | null>(null);
  const [taxonomyAssignments, setTaxonomyAssignments] = useState<
    Record<string, string[]>
  >({});
  const [taxonomies, setTaxonomies] =
    useState<TaxonomyDefinition[]>(DEFAULT_TAXONOMIES);
  const [isTaxonomyDialogOpen, setIsTaxonomyDialogOpen] = useState(false);
  const [taxonomyForm, setTaxonomyForm] = useState({
    name: "",
    slug: "",
    description: "",
    hierarchical: false,
  });

  useEffect(() => {
    const derivedTab = isValidTab(tabParam) ? tabParam : DEFAULT_TAB;
    if (derivedTab !== activeTab) {
      setActiveTab(derivedTab);
    }
  }, [tabParam, activeTab]);

  const updateQueryParams = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  };

  const handleTabChange = (value: string) => {
    if (!isValidTab(value)) {
      return;
    }
    setActiveTab(value);
    updateQueryParams((params) => {
      if (value === DEFAULT_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
    });
  };

  const postTypesResult = usePostTypes();
  const postTypesQuery = postTypesResult.data;
  const postTypesLoading = postTypesResult.isLoading;
  const selectedPostType = useMemo(
    () => postTypesQuery.find((type) => type.slug === selectedType) ?? null,
    [postTypesQuery, selectedType],
  );
  const selectedTaxonomyPostType = useMemo(
    () => postTypesQuery.find((type) => type.slug === taxonomyPostType) ?? null,
    [postTypesQuery, taxonomyPostType],
  );
  const addPostTypeField = useAddPostTypeField();
  const removePostTypeField = useRemovePostTypeField();
  const postTypeFieldsResult = usePostTypeFields(
    selectedType ?? undefined,
    true,
  );
  const postTypeFields = postTypeFieldsResult.data;
  const postTypeFieldsLoading = postTypeFieldsResult.isLoading;
  const currentFields = postTypeFields;
  const assignedTaxonomies = selectedTaxonomyPostType
    ? (taxonomyAssignments[selectedTaxonomyPostType.slug] ?? [])
    : [];

  useEffect(() => {
    if (!postTypesQuery.length) {
      return;
    }
    const first = postTypesQuery[0];
    if (!first) {
      return;
    }
    const hasParamMatch =
      postTypeParam &&
      postTypesQuery.some((type) => type.slug === postTypeParam);
    if (hasParamMatch && postTypeParam !== selectedType) {
      setSelectedType(postTypeParam);
    } else if (!selectedType) {
      setSelectedType(first.slug);
    }
    if (!taxonomyPostType) {
      setTaxonomyPostType(first.slug);
    }
  }, [postTypesQuery, selectedType, taxonomyPostType, postTypeParam]);

  useEffect(() => {
    if (!postTypesQuery.length) {
      return;
    }
    setTaxonomyAssignments((prev) => {
      const next = { ...prev };
      const defaultAssignments = DEFAULT_TAXONOMIES.filter(
        (taxonomy) => taxonomy.builtIn,
      ).map((taxonomy) => taxonomy.slug);
      postTypesQuery.forEach((type) => {
        if (!next[type.slug]) {
          next[type.slug] = defaultAssignments;
        }
      });
      return next;
    });
  }, [postTypesQuery]);

  const resetFieldForm = () => {
    setFieldForm({
      name: "",
      key: "",
      type: "text",
      description: "",
      required: false,
      searchable: false,
      filterable: false,
    });
  };

  const handleFieldFormChange = <K extends keyof typeof fieldForm>(
    key: K,
    value: (typeof fieldForm)[K],
  ) => {
    setFieldForm((prev) => {
      if (key === "name" && !prev.key) {
        return {
          ...prev,
          name: value as string,
          key: normalizeMetaKey(value as string),
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleAddField = async () => {
    if (!selectedPostType) {
      toast("Select a post type before adding fields.");
      return;
    }
    if (!fieldForm.name.trim() || !fieldForm.key.trim()) {
      toast("Field name and key are required.");
      return;
    }
    try {
      await addPostTypeField({
        postTypeId: selectedPostType._id,
        field: {
          name: fieldForm.name.trim(),
          key: normalizeMetaKey(fieldForm.key),
          type: fieldForm.type,
          description: fieldForm.description.trim() || undefined,
          required: fieldForm.required,
          searchable: fieldForm.searchable,
          filterable: fieldForm.filterable,
          isSystem: false,
          isBuiltIn: false,
          order: postTypeFields.length + 1,
        },
      });
      toast("Field added.");
      setIsFieldDialogOpen(false);
      resetFieldForm();
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Failed to add field. Please try again.",
      );
    }
  };

  const handleRemoveField = async (
    fieldId: Id<"postTypeFields">,
    isSystem?: boolean,
  ) => {
    if (isSystem) {
      toast("System fields cannot be removed.");
      return;
    }
    try {
      await removePostTypeField({ fieldId });
      toast("Field removed.");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Failed to remove field. Please try again.",
      );
    }
  };

  const handleToggleTaxonomyAssignment = (
    taxonomySlug: string,
    enabled: boolean,
  ) => {
    if (!selectedTaxonomyPostType) return;
    setTaxonomyAssignments((prev) => {
      const existing = prev[selectedTaxonomyPostType.slug] ?? [];
      const nextAssignments = enabled
        ? Array.from(new Set([...existing, taxonomySlug]))
        : existing.filter((slug) => slug !== taxonomySlug);
      return {
        ...prev,
        [selectedTaxonomyPostType.slug]: nextAssignments,
      };
    });
  };

  const handleAddTaxonomy = () => {
    if (!taxonomyForm.name.trim()) return;
    const slug = normalizeMetaKey(taxonomyForm.slug || taxonomyForm.name);
    if (!slug) {
      toast("Provide a valid taxonomy name or slug");
      return;
    }
    if (taxonomies.some((taxonomy) => taxonomy.slug === slug)) {
      toast("Taxonomy slug must be unique");
      return;
    }
    const newTaxonomy: TaxonomyDefinition = {
      slug,
      name: taxonomyForm.name.trim(),
      description: taxonomyForm.description.trim(),
      hierarchical: taxonomyForm.hierarchical,
    };
    setTaxonomies((prev) => [...prev, newTaxonomy]);
    setIsTaxonomyDialogOpen(false);
    setTaxonomyForm({
      name: "",
      slug: "",
      description: "",
      hierarchical: false,
    });
  };

  const handlePostTypeChange = (value: string) => {
    const slug = value || null;
    setSelectedType(slug);
    updateQueryParams((params) => {
      if (slug) {
        params.set("post_type", slug);
      } else {
        params.delete("post_type");
      }
    });
  };

  const createPostType = useCreatePostType();
  const deletePostType = useDeletePostType();
  const initCmsSystem = useInitPostTypes();
  const updateEntryCounts = useUpdatePostTypeEntryCounts();

  const handleCreatePostType = async () => {
    try {
      setIsCreating(true);

      // Validate inputs
      if (!newPostType.name || !newPostType.slug) {
        toast("Name and slug are required fields", {
          description: "Validation Error failed",
        });
        return;
      }

      await createPostType({
        name: newPostType.name,
        slug: newPostType.slug,
        description: newPostType.description,
        isPublic: newPostType.isPublic,
        includeTimestamps: newPostType.includeTimestamps,
        enableApi: newPostType.enableApi,
      });

      // Reset form and close dialog
      setNewPostType({
        name: "",
        slug: "",
        description: "",
        isPublic: true,
        includeTimestamps: true,
        enableApi: true,
      });
      setIsCreating(false);

      toast(`${newPostType.name} has been created successfully`);
    } catch (error) {
      console.error("Failed to create post type:", error);
      toast("Creation Failed", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      setIsCreating(false);
    }
  };

  const handleInitializeCms = async () => {
    try {
      setIsInitializing(true);
      await initCmsSystem();
      toast("Built-in post types have been created successfully");
    } catch (error) {
      console.error("Failed to initialize CMS:", error);
      toast("Initialization Failed", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRefreshCounts = async () => {
    try {
      setIsRefreshing(true);
      const slugs = postTypesQuery.map((type) => type.slug);
      await Promise.all(slugs.map((slug) => updateEntryCounts({ slug })));
      toast(`Updated entry counts for ${slugs.length} post types`);
    } catch (error) {
      console.error("Failed to refresh counts:", error);
      toast("Failed to refresh entry counts", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeletePostType = async (type: PostType) => {
    try {
      setDeletingId(type._id);
      await deletePostType({ id: type._id });
      toast(`${type.name} has been deleted`);
    } catch (error) {
      console.error("Failed to delete post type:", error);
      toast("Deletion Failed", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSlugChange = (value: string) => {
    // Generate slug from name (lowercase, replace spaces with hyphens)
    const slug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    setNewPostType({
      ...newPostType,
      slug,
    });
  };

  const postTypes = postTypesQuery ?? [];

  const createPostTypeDialog = (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Content Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Content Type</DialogTitle>
          <DialogDescription>
            Define a new post type for your site
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Blog Post"
              value={newPostType.name}
              onChange={(e) => {
                setNewPostType({
                  ...newPostType,
                  name: e.target.value,
                });
                if (!newPostType.slug) {
                  handleSlugChange(e.target.value);
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="e.g., blog-posts"
              value={newPostType.slug}
              onChange={(e) =>
                setNewPostType({
                  ...newPostType,
                  slug: e.target.value,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and API endpoints. Use only lowercase letters,
              numbers, and hyphens.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What kind of content will this type contain?"
              value={newPostType.description}
              onChange={(e) =>
                setNewPostType({
                  ...newPostType,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="api-enabled"
              checked={newPostType.enableApi}
              onCheckedChange={(checked) =>
                setNewPostType({
                  ...newPostType,
                  enableApi: checked,
                })
              }
            />
            <Label htmlFor="api-enabled">Enable API Access</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="create-timestamps"
              checked={newPostType.includeTimestamps}
              onCheckedChange={(checked) =>
                setNewPostType({
                  ...newPostType,
                  includeTimestamps: checked,
                })
              }
            />
            <Label htmlFor="create-timestamps">Include Timestamps</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreatePostType}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>Create Content Type</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const postTypeListActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={handleRefreshCounts}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>Refresh Counts</>
        )}
      </Button>
      {createPostTypeDialog}
    </div>
  );

  const postTypesEmptyState = (
    <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
      <p className="text-muted-foreground">No post types found</p>
      <Button onClick={() => handleInitializeCms()} disabled={isInitializing}>
        {isInitializing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing...
          </>
        ) : (
          <>Create built-in types</>
        )}
      </Button>
    </div>
  );

  const postTypeColumns: ColumnDef<PostType>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="line-clamp-1 text-muted-foreground">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "fieldCount",
      header: () => <div className="text-center">Fields</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.original.fieldCount ?? 0}</div>
      ),
    },
    {
      id: "entryCount",
      header: () => <div className="text-center">Entries</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.original.entryCount ?? 0}</div>
      ),
    },
    {
      id: "type",
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isBuiltIn ? (
            <Badge variant="secondary">Built-in</Badge>
          ) : (
            <Badge>Custom</Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const type = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/settings/post-types/${type._id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {!type.isBuiltIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePostType(type)}
                disabled={deletingId === type._id}
              >
                {deletingId === type._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const taxonomyColumns: ColumnDef<TaxonomyDefinition>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Taxonomy",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "hierarchical",
        header: "Structure",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.hierarchical ? "Hierarchical" : "Flat"}
          </Badge>
        ),
      },
      {
        id: "assignment",
        header: "Assigned",
        cell: ({ row }) => (
          <Switch
            checked={assignedTaxonomies.includes(row.original.slug)}
            onCheckedChange={(checked) =>
              handleToggleTaxonomyAssignment(row.original.slug, checked)
            }
            disabled={!selectedTaxonomyPostType}
          />
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="text-sm text-muted-foreground">
            {row.original.description || "No description"}
          </p>
        ),
      },
    ],
    [assignedTaxonomies, handleToggleTaxonomyAssignment, selectedTaxonomyPostType],
  );

  const addTaxonomyDialog = (
    <Dialog open={isTaxonomyDialogOpen} onOpenChange={setIsTaxonomyDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" />
          Add Taxonomy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Taxonomy</DialogTitle>
          <DialogDescription>
            Create a taxonomy that can be assigned to this post type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="taxonomy-name">Name</Label>
            <Input
              id="taxonomy-name"
              value={taxonomyForm.name}
              onChange={(event) =>
                setTaxonomyForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="e.g., Industries"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taxonomy-slug">Slug</Label>
            <Input
              id="taxonomy-slug"
              value={taxonomyForm.slug}
              onChange={(event) =>
                setTaxonomyForm((prev) => ({
                  ...prev,
                  slug: event.target.value,
                }))
              }
              placeholder="e.g., industries"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taxonomy-description">Description</Label>
            <Textarea
              id="taxonomy-description"
              value={taxonomyForm.description}
              onChange={(event) =>
                setTaxonomyForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="How is this taxonomy used?"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="taxonomy-hierarchical"
              checked={taxonomyForm.hierarchical}
              onCheckedChange={(checked) =>
                setTaxonomyForm((prev) => ({
                  ...prev,
                  hierarchical: checked,
                }))
              }
            />
            <Label htmlFor="taxonomy-hierarchical">
              Hierarchical (like categories)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddTaxonomy}
            disabled={!taxonomyForm.name.trim()}
          >
            Save Taxonomy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const taxonomyActions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={taxonomyPostType ?? ""}
        onValueChange={(value) => setTaxonomyPostType(value)}
        disabled={!postTypesQuery.length}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select post type" />
        </SelectTrigger>
        <SelectContent>
          {postTypesQuery.map((type) => (
            <SelectItem key={type.slug} value={type.slug}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {addTaxonomyDialog}
    </div>
  );

  const taxonomyTitle = selectedTaxonomyPostType
    ? `Taxonomies for ${selectedTaxonomyPostType.name}`
    : "Taxonomies";

  const fieldColumns: ColumnDef<Doc<"postTypeFields">>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Field",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.description ? (
              <div className="text-xs text-muted-foreground">
                {row.original.description}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "key",
        header: "Meta Key",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.key}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="capitalize">
            {FIELD_TYPE_OPTIONS.find(
              (option) => option.value === (row.original.type as FieldType),
            )?.label ?? row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "required",
        header: "Required",
        cell: ({ row }) =>
          row.original.required ? (
            <Badge>Required</Badge>
          ) : (
            <Badge variant="outline">Optional</Badge>
          ),
      },
      {
        accessorKey: "searchable",
        header: "Searchable",
        cell: ({ row }) => (row.original.searchable ? "Yes" : "No"),
      },
      {
        accessorKey: "filterable",
        header: "Filterable",
        cell: ({ row }) => (row.original.filterable ? "Yes" : "No"),
      },
      {
        accessorKey: "isSystem",
        header: "Source",
        cell: ({ row }) => (
          <Badge variant={row.original.isSystem ? "secondary" : "default"}>
            {row.original.isSystem ? "System" : "Custom"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" disabled>
              <Edit className="h-4 w-4" />
            </Button>
            {!row.original.isSystem && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleRemoveField(row.original._id, row.original.isSystem)
                }
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleRemoveField],
  );

  const addFieldDialog = (
    <Dialog
      open={isFieldDialogOpen}
      onOpenChange={(open) => {
        setIsFieldDialogOpen(open);
        if (!open) {
          resetFieldForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={!selectedPostType}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
          <DialogDescription>
            Attach a new meta field to the {selectedPostType?.name ?? "selected"}{" "}
            post type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="field-name">Field Label</Label>
            <Input
              id="field-name"
              value={fieldForm.name}
              onChange={(event) =>
                handleFieldFormChange("name", event.target.value)
              }
              placeholder="e.g., Hero Heading"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="field-key">Meta Key</Label>
            <Input
              id="field-key"
              value={fieldForm.key}
              onChange={(event) =>
                handleFieldFormChange(
                  "key",
                  normalizeMetaKey(event.target.value),
                )
              }
              placeholder="e.g., hero_heading"
            />
            <p className="text-xs text-muted-foreground">
              Used in the API and stored alongside `post_meta`.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select
              value={fieldForm.type}
              onValueChange={(value: FieldType) =>
                handleFieldFormChange("type", value)
              }
            >
              <SelectTrigger id="field-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="field-description">Description</Label>
            <Textarea
              id="field-description"
              value={fieldForm.description}
              onChange={(event) =>
                handleFieldFormChange("description", event.target.value)
              }
              placeholder="Explain how editors should use this field."
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="field-required"
                checked={fieldForm.required}
                onCheckedChange={(checked) =>
                  handleFieldFormChange("required", checked)
                }
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="field-searchable"
                checked={fieldForm.searchable}
                onCheckedChange={(checked) =>
                  handleFieldFormChange("searchable", checked)
                }
              />
              <Label htmlFor="field-searchable">Include in search index</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="field-filterable"
                checked={fieldForm.filterable}
                onCheckedChange={(checked) =>
                  handleFieldFormChange("filterable", checked)
                }
              />
              <Label htmlFor="field-filterable">
                Expose as filter/facet
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleAddField}
            disabled={
              !selectedType || !fieldForm.name.trim() || !fieldForm.key.trim()
            }
          >
            Save Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const fieldActions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={selectedType ?? ""}
        onValueChange={handlePostTypeChange}
        disabled={!postTypesQuery.length}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select post type" />
        </SelectTrigger>
        <SelectContent>
          {postTypesQuery.map((type) => (
            <SelectItem key={type._id} value={type.slug}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {addFieldDialog}
    </div>
  );

  const fieldEmptyState = selectedPostType ? (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
      <p>No custom fields yet. Click “Add Field” to register the first meta key.</p>
      <Button onClick={() => setIsFieldDialogOpen(true)}>Add Field</Button>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <p className="text-muted-foreground">
        Create a post type to begin attaching custom fields.
      </p>
      <Button onClick={() => setActiveTab("types")}>Go to Post Types</Button>
    </div>
  );

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Post Types</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Define and manage custom post types and their structure
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="types">Post Types</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="taxonomies">Taxonomies</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <Card>
            <CardContent className="p-6">
              <EntityList<PostType>
                data={postTypes}
                columns={postTypeColumns}
                title="All Post Types"
                description="Overview of your built-in and custom content types"
                actions={postTypeListActions}
                isLoading={postTypesLoading}
                enableSearch
                viewModes={["list"]}
                emptyState={postTypesEmptyState}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxonomies">
          <p className="mb-4 text-sm text-muted-foreground">
            Assign hierarchical or flat taxonomies to each post type—just like
            WordPress categories and tags.
          </p>
          <Card>
            <CardContent className="p-6">
              <EntityList<TaxonomyDefinition>
                data={selectedTaxonomyPostType ? taxonomies : []}
                columns={taxonomyColumns}
                title={taxonomyTitle}
                description={
                  selectedTaxonomyPostType
                    ? `Toggle which taxonomies apply to ${selectedTaxonomyPostType.name}.`
                    : undefined
                }
                actions={taxonomyActions}
                enableSearch={false}
                viewModes={["list"]}
                emptyState={
                  <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <p className="text-muted-foreground">
                      Choose a post type to manage taxonomy relationships.
                    </p>
                    <Button onClick={() => setActiveTab("types")}>
                      Go to Post Types
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <p className="mb-4 text-sm text-muted-foreground">
            Define field metadata, meta keys, and storage options similar to
            WordPress custom fields.
          </p>
          <Card>
            <CardContent className="p-6">
              <EntityList<Doc<"postTypeFields">>
                data={selectedPostType ? currentFields : []}
                columns={fieldColumns}
                title={
                  selectedPostType
                    ? `Fields for ${selectedPostType.name}`
                    : "Fields"
                }
                description={
                  selectedPostType
                    ? `Manage custom meta for ${selectedPostType.name}.`
                    : undefined
                }
                actions={fieldActions}
                isLoading={postTypeFieldsLoading}
                enableSearch
                viewModes={["list"]}
                emptyState={fieldEmptyState}
              />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
