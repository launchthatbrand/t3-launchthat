"use client";

import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  ArrowLeft,
  Eye,
  Info,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
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
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import {
  generateSlugFromTitle,
  useCreatePost,
  useGetAllPosts,
  useUpdatePost,
} from "@/lib/blog";
import {
  useCreateTaxonomyTerm,
  useDeleteTaxonomyTerm,
  useEnsureBuiltInTaxonomies,
  useTaxonomyBySlug,
  useTaxonomyTerms,
  useUpdateTaxonomyTerm,
} from "../../settings/taxonomies/_api/taxonomies";
import { useMutation, useQuery } from "convex/react";
import {
  usePostTypeFields,
  usePostTypes,
} from "../../settings/post-types/_api/postTypes";
import { useRouter, useSearchParams } from "next/navigation";

import AdminCoursesPage from "../../lms/courses/page";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Image from "next/image";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import type { PluginPostSingleViewConfig } from "~/lib/plugins/types";
import { Switch } from "@acme/ui/switch";
import type { TaxonomyTerm } from "../../settings/taxonomies/_api/taxonomies";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { toast } from "sonner";
import { useAdminPostContext } from "../../_providers/AdminPostProvider";
import { useTenant } from "~/context/TenantContext";

const DEFAULT_POST_TYPE = "course";
const PERMALINK_OPTION_KEY = "permalink_settings";
const CONFIGURED_SITE_URL = "";
const BUILTIN_TAXONOMY_SLUGS = new Set(["category", "post_tag"]);

interface PlaceholderRow {
  id: string;
  title: string;
  status: "Published" | "Draft";
  author: string;
  updatedAt: number;
}

const FALLBACK_ROWS: PlaceholderRow[] = Array.from(
  { length: 5 },
  (_, index): PlaceholderRow => ({
    id: `placeholder-${index}`,
    title: `Sample item ${index + 1}`,
    status: index % 2 === 0 ? "Published" : "Draft",
    author: "System",
    updatedAt: Date.now() - index * 1000 * 60 * 60,
  }),
);

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type PostDoc = Doc<"posts">;
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type PostTypeDoc = Doc<"postTypes">;
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type MediaItemDoc = Doc<"mediaItems"> & { url?: string | null };
type TaxonomyTermRow = TaxonomyTerm;
type ArchiveRow = PostDoc | PlaceholderRow;

const isPostRow = (row: ArchiveRow): row is PostDoc => "_id" in row;
type PermalinkStructure =
  | "plain"
  | "day-name"
  | "month-name"
  | "numeric"
  | "post-name"
  | "custom";

const PERMALINK_STRUCTURE_VALUES: readonly PermalinkStructure[] = [
  "plain",
  "day-name",
  "month-name",
  "numeric",
  "post-name",
  "custom",
];

interface PermalinkSettings {
  structure: PermalinkStructure;
  customStructure: string;
  categoryBase: string;
  tagBase: string;
  trailingSlash: boolean;
}

const defaultPermalinkSettings: PermalinkSettings = {
  structure: "post-name",
  customStructure: "/%category%/%postname%/",
  categoryBase: "",
  tagBase: "",
  trailingSlash: true,
};

type CustomFieldValue = string | number | boolean | null;

const normalizeFieldOptions = (
  options: Doc<"postTypeFields">["options"],
): { label: string; value: string }[] | null => {
  if (!options) {
    return null;
  }
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (
        option &&
        typeof option === "object" &&
        "label" in option &&
        "value" in option
      ) {
        const typed = option as { label: string; value: string | number };
        return {
          label: String(typed.label),
          value: String(typed.value),
        };
      }
      return {
        label: String(option),
        value: String(option),
      };
    });
  }
  if (typeof options === "object") {
    return Object.entries(options).map(([key, value]) => ({
      label: key,
      value: String(value),
    }));
  }
  return null;
};

const formatTimestamp = (timestamp?: number | null) => {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return "";
  }
  return new Date(timestamp).toISOString();
};

const deriveSystemFieldValue = (
  field: Doc<"postTypeFields">,
  post: PostDoc | null | undefined,
  isNewRecord: boolean,
): CustomFieldValue => {
  if (!post) {
    return isNewRecord ? "Will be generated on save" : "";
  }

  switch (field.key) {
    case "_id":
      return post._id;
    case "_creationTime":
      return formatTimestamp(post._creationTime);
    case "createdAt":
      return formatTimestamp(post.createdAt ?? post._creationTime);
    case "updatedAt":
      return formatTimestamp(post.updatedAt ?? post._creationTime);
    case "slug":
      return post.slug ?? "";
    case "status":
      return post.status ?? "";
    default:
      return "";
  }
};

function AdminEditPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const { data: postTypesResponse } = usePostTypes();
  const postTypes = useMemo(() => postTypesResponse ?? [], [postTypesResponse]);
  const pluginParam = searchParams.get("plugin")?.toLowerCase().trim() ?? "";
  const pluginPage =
    searchParams.get("page")?.toLowerCase().trim() ?? "settings";
  const pluginDefinition = useMemo(() => {
    if (!pluginParam) return null;
    return (
      pluginDefinitions.find(
        (candidate) => candidate.id.toLowerCase() === pluginParam,
      ) ?? null
    );
  }, [pluginParam]);
  const pluginSetting = useMemo(() => {
    if (!pluginDefinition || !pluginDefinition.settingsPages) {
      return null;
    }
    return (
      pluginDefinition.settingsPages.find(
        (setting) => setting.slug === pluginPage,
      ) ??
      pluginDefinition.settingsPages[0] ??
      null
    );
  }, [pluginDefinition, pluginPage]);
  const organizationId = useMemo(
    () => getTenantOrganizationId(tenant ?? undefined),
    [tenant],
  );
  const pluginSettingContent = useMemo(() => {
    if (!pluginDefinition || !pluginSetting) return null;
    return pluginSetting.render({
      pluginId: pluginDefinition.id,
      pluginName: pluginDefinition.name,
      settingId: pluginSetting.id,
      organizationId,
    });
  }, [pluginDefinition, pluginSetting, organizationId]);
  const { viewMode, post, postType, postTypeSlug, isLoading, isNewRecord } =
    useAdminPostContext();
  const permalinkOption = useQuery(api.core.options.get, {
    metaKey: PERMALINK_OPTION_KEY,
    type: "site",
  } as const);
  const taxonomySlugParam =
    searchParams.get("taxonomy")?.toLowerCase().trim() ?? "";

  const resolvedSlug = (postTypeSlug ?? DEFAULT_POST_TYPE).toLowerCase();
  const permalinkSettings = useMemo<PermalinkSettings>(() => {
    const rawValue = permalinkOption?.metaValue as unknown;
    if (isPermalinkSettingsValue(rawValue)) {
      return { ...defaultPermalinkSettings, ...rawValue };
    }
    return defaultPermalinkSettings;
  }, [permalinkOption]);

  const hydratedPostType = useMemo(() => {
    if (postType) return postType;
    return (
      postTypes.find((pt: PostTypeDoc) => pt.slug === resolvedSlug) ?? null
    );
  }, [postType, postTypes, resolvedSlug]);

  const handlePostTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("post_type", value);
    params.delete("post_id");
    router.replace(`/admin/edit?${params.toString()}`);
  };
  if (pluginParam && !pluginDefinition) {
    return (
      <AdminLayoutContent>
        <AdminLayoutMain>
          <Card>
            <CardHeader>
              <CardTitle>Plugin not found</CardTitle>
              <CardDescription>
                The requested plugin could not be located.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/admin/integrations/plugins">Back to plugins</Link>
              </Button>
            </CardContent>
          </Card>
        </AdminLayoutMain>
      </AdminLayoutContent>
    );
  }

  if (pluginParam && pluginDefinition && pluginSetting) {
    return (
      <AdminLayoutContent>
        <AdminLayoutMain>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Admin / Integrations / {pluginDefinition.name}
                </p>
                <h1 className="text-3xl font-bold">
                  {pluginDefinition.name} Settings
                </h1>
                <p className="text-muted-foreground">
                  {pluginDefinition.longDescription ??
                    pluginDefinition.description}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/integrations/plugins">Back to plugins</Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{pluginSetting.label}</CardTitle>
                {pluginSetting.description ? (
                  <CardDescription>{pluginSetting.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                {pluginSettingContent ?? (
                  <p className="text-sm text-muted-foreground">
                    This plugin does not expose configurable settings yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    );
  }

  if (taxonomySlugParam) {
    return (
      <TaxonomyTermsView
        taxonomySlug={taxonomySlugParam}
        postTypeSlug={resolvedSlug}
        postTypes={postTypes}
        onPostTypeChange={handlePostTypeChange}
      />
    );
  }

  const pluginSingleView = useMemo(() => {
    if (!hydratedPostType) return null;
    return getPluginSingleViewForSlug(hydratedPostType.slug);
  }, [hydratedPostType]);

  if (viewMode === "single") {
    return (
      <AdminSinglePostView
        post={post}
        postType={hydratedPostType}
        slug={resolvedSlug}
        isNewRecord={isNewRecord}
        organizationId={organizationId ?? undefined}
        pluginSingleView={pluginSingleView}
        onBack={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("post_id");
          router.replace(`/admin/edit?${params.toString()}`);
        }}
      />
    );
  }

  if (resolvedSlug === "course") {
    return <AdminCoursesPage />;
  }

  if (resolvedSlug === "attachment" || resolvedSlug === "attachments") {
    return (
      <AttachmentsArchiveView
        slug={resolvedSlug}
        postType={hydratedPostType}
        options={postTypes}
        onPostTypeChange={handlePostTypeChange}
      />
    );
  }

  return (
    <GenericArchiveView
      slug={resolvedSlug}
      postType={hydratedPostType}
      options={postTypes}
      isLoading={isLoading}
      permalinkSettings={permalinkSettings}
      onPostTypeChange={handlePostTypeChange}
      onCreate={() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("post_type", resolvedSlug);
        params.set("post_id", "new");
        router.replace(`/admin/edit?${params.toString()}`);
      }}
    />
  );
}

export default function AdminEditPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading editor…</div>}>
      <AdminEditPageBody />
    </Suspense>
  );
}

interface GenericArchiveViewProps {
  slug: string;
  postType: PostTypeDoc | null;
  options: PostTypeDoc[];
  isLoading: boolean;
  permalinkSettings: PermalinkSettings;
  onPostTypeChange: (slug: string) => void;
  onCreate: () => void;
}

function GenericArchiveView({
  slug,
  postType,
  options,
  isLoading,
  permalinkSettings,
  onPostTypeChange,
  onCreate,
}: GenericArchiveViewProps) {
  const label = postType?.name ?? slug.replace(/-/g, " ");
  const description =
    postType?.description ?? "Manage structured entries for this post type.";
  const normalizedSlug = slug.toLowerCase();
  const shouldLoadPosts = postType
    ? true
    : isBuiltInPostTypeSlug(normalizedSlug);
  const { posts, isLoading: postsLoading } = useGetAllPosts(
    shouldLoadPosts ? { postTypeSlug: normalizedSlug } : undefined,
  );
  const rows: ArchiveRow[] = shouldLoadPosts
    ? (posts as ArchiveRow[])
    : FALLBACK_ROWS;
  const tableLoading = shouldLoadPosts ? postsLoading : isLoading;

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Admin / Edit</p>
              <h1 className="text-3xl font-bold">{label}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={slug} onValueChange={onPostTypeChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option: PostTypeDoc) => (
                    <SelectItem key={option._id} value={option.slug}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="gap-2" type="button" onClick={onCreate}>
                <Plus className="h-4 w-4" /> Add New {label}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>{label} overview</CardTitle>
                  <CardDescription>
                    WordPress-style management powered by reusable post type
                    scaffolding.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tableLoading ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                      entries…
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="text-right">Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No entries yet. Click “Add New” to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map((row) => {
                            if (isPostRow(row)) {
                              const statusValue = row.status ?? "draft";
                              const updatedValue =
                                row.updatedAt ?? row.createdAt ?? Date.now();
                              const permalink = buildPermalink(
                                row,
                                permalinkSettings,
                                postType,
                              );
                              return (
                                <TableRow key={row._id}>
                                  <TableCell className="font-medium">
                                    <Link
                                      href={`/admin/edit?post_type=${slug}&post_id=${row._id}`}
                                      className="hover:underline"
                                    >
                                      {row.title || "Untitled"}
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        statusValue === "published"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {statusValue}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{row.authorId ?? "—"}</TableCell>
                                  <TableCell className="text-right text-sm text-muted-foreground">
                                    {formatDistanceToNow(updatedValue, {
                                      addSuffix: true,
                                    })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                      <Link
                                        href={permalink}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">
                                  {row.title}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      row.status === "Published"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {row.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{row.author}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {formatDistanceToNow(row.updatedAt, {
                                    addSuffix: true,
                                  })}
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  —
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="drafts">
              <PlaceholderState label="Drafts" />
            </TabsContent>
            <TabsContent value="scheduled">
              <PlaceholderState label="Scheduled" />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Info className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Need custom fields?</CardTitle>
              <CardDescription>
                Connect post types to marketing tags, menus, and integrations.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" asChild>
              <Link href="/admin/settings/post-types">
                <Sparkles className="mr-2 h-4 w-4" /> Configure Post Types
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              This scaffold reuses the same Shadcn table primitives as the LMS
              Courses view so every post type feels consistent.
            </p>
          </CardContent>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}

interface TaxonomyTermsViewProps {
  taxonomySlug: string;
  postTypeSlug: string;
  postTypes: PostTypeDoc[];
  onPostTypeChange: (slug: string) => void;
}

const EMPTY_TERM_STATE = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

function TaxonomyTermsView({
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!taxonomyDoc) {
    return (
      <AdminLayoutContent>
        <AdminLayoutMain>
          <Card>
            <CardHeader>
              <CardTitle>Taxonomy not found</CardTitle>
              <CardDescription>
                The requested taxonomy does not exist.
              </CardDescription>
            </CardHeader>
          </Card>
        </AdminLayoutMain>
      </AdminLayoutContent>
    );
  }

  return (
    <>
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Taxonomy
                </p>
                <h1 className="text-3xl font-bold">{taxonomyDoc.name}</h1>
                <p className="text-muted-foreground">
                  {taxonomyDoc.description ??
                    "Manage terms associated with this taxonomy."}
                </p>
              </div>
              <Button onClick={openCreateTerm}>
                <Plus className="mr-2 h-4 w-4" />
                Add term
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
                <CardDescription>
                  {taxonomyDoc.hierarchical
                    ? "Organize parent and child terms."
                    : "Flat list of tags for quick classification."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {terms.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No terms yet. Add your first term to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          {taxonomyDoc.hierarchical ? (
                            <TableHead>Parent</TableHead>
                          ) : null}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {terms.map((term) => {
                          const parent =
                            term.parentId &&
                            parentLookup.get(term.parentId as string);
                          return (
                            <TableRow key={term._id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {term.name}
                                  </span>
                                  {term.description ? (
                                    <span className="text-xs text-muted-foreground">
                                      {term.description}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {term.slug}
                              </TableCell>
                              {taxonomyDoc.hierarchical ? (
                                <TableCell>
                                  {parent ? parent.name : "—"}
                                </TableCell>
                              ) : null}
                              <TableCell className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditTerm(term)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteTerm(term)}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminLayoutMain>
        <AdminLayoutSidebar>
          <Card>
            <CardHeader>
              <CardTitle>Post type</CardTitle>
              <CardDescription>
                Switch between post types that reference this taxonomy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  {taxonomyDoc.postTypeSlugs?.length ? (
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
                    {taxonomyDoc.hierarchical ? "Hierarchical" : "Flat"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </AdminLayoutSidebar>
      </AdminLayoutContent>

      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTerm ? "Edit term" : "Add term"}</DialogTitle>
            <DialogDescription>
              {taxonomyDoc.hierarchical
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
            {taxonomyDoc.hierarchical ? (
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

interface AttachmentsArchiveViewProps {
  slug: string;
  postType: PostTypeDoc | null;
  options: PostTypeDoc[];
  onPostTypeChange: (slug: string) => void;
}

function AttachmentsArchiveView({
  slug,
  postType,
  options,
  onPostTypeChange,
}: AttachmentsArchiveViewProps) {
  const label = postType?.name ?? "Attachments";
  const description =
    postType?.description ??
    "Upload and manage media files used throughout your site.";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(
    api.core.media.mutations.generateUploadUrl,
  );
  const saveMedia = useMutation(api.core.media.mutations.saveMedia);

  const mediaResponse = useQuery(api.media.queries.listMediaItemsWithUrl, {
    paginationOpts: { numItems: 60, cursor: null },
  });
  const mediaItems: MediaItemDoc[] =
    (mediaResponse?.page as MediaItemDoc[]) ?? [];
  const isLoading = mediaResponse === undefined;

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadError(null);
      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          const uploadUrl = await generateUploadUrl();
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload file.");
          }
          const { storageId } = (await uploadResponse.json()) as {
            storageId: string;
          };
          await saveMedia({
            storageId: storageId as Id<"_storage">,
            title: file.name,
            status: "published",
          });
        }
      } catch (error) {
        console.error(error);
        setUploadError(
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [generateUploadUrl, saveMedia],
  );

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Admin / Media</p>
              <h1 className="text-3xl font-bold">{label}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={slug} onValueChange={onPostTypeChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option: PostTypeDoc) => (
                    <SelectItem key={option._id} value={option.slug}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2"
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading…" : "Upload from computer"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFilesSelected}
              />
            </div>
          </div>

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Media Grid</CardTitle>
              <CardDescription>
                Preview recently uploaded files. Click “Upload” to add new media
                directly from your computer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading attachments…
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="mb-2 h-6 w-6" />
                  <p>No attachments yet. Upload your first media item.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mediaItems.map((item) => (
                    <Card key={item._id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                          {item.url ? (
                            <Image
                              src={item.url}
                              alt={item.title ?? "Attachment"}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {item.title ?? "Untitled"}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.status ?? "draft"}</span>
                            <span>
                              {formatDistanceToNow(item._creationTime, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayoutMain>
      <AdminLayoutSidebar>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media tips</CardTitle>
            <CardDescription>
              Upload high-resolution assets for the best results. Attachments
              automatically land in your WordPress-style media library.
            </CardDescription>
          </CardHeader>
        </Card>
      </AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}

interface PluginSingleViewInstance {
  pluginId: string;
  pluginName: string;
  config: PluginPostSingleViewConfig;
}

function getPluginSingleViewForSlug(
  slug: string,
): PluginSingleViewInstance | null {
  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (postType?.singleView) {
      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        config: postType.singleView,
      };
    }
  }
  return null;
}

interface AdminSinglePostViewProps {
  post?: PostDoc | null;
  postType: PostTypeDoc | null;
  slug: string;
  isNewRecord: boolean;
  organizationId?: Id<"organizations">;
  pluginSingleView?: PluginSingleViewInstance | null;
  onBack: () => void;
}

function AdminSinglePostView({
  post,
  postType,
  slug,
  isNewRecord,
  organizationId,
  pluginSingleView,
  onBack,
}: AdminSinglePostViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slugValue, setSlugValue] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [isPublished, setIsPublished] = useState(post?.status === "published");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supportsPostsTable = Boolean(postType) || isBuiltInPostTypeSlug(slug);
  const pluginTabs = pluginSingleView?.config.tabs ?? [];
  const defaultTab =
    pluginSingleView?.config.defaultTab ?? pluginTabs[0]?.slug ?? "edit";
  const queriedTab = (searchParams.get("tab") ?? defaultTab).toLowerCase();
  const normalizedTab = pluginTabs.some((tab) => tab.slug === queriedTab)
    ? queriedTab
    : defaultTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    setActiveTab(normalizedTab);
  }, [normalizedTab]);

  const { data: postTypeFields = [], isLoading: postTypeFieldsLoading } =
    usePostTypeFields(slug, true);
  const postMeta = useQuery(
    api.core.posts.queries.getPostMeta,
    post?._id
      ? organizationId
        ? ({ postId: post._id, organizationId } as const)
        : ({ postId: post._id } as const)
      : "skip",
  ) as Doc<"postsMeta">[] | undefined;
  const postMetaMap = useMemo<Record<string, CustomFieldValue>>(() => {
    if (!postMeta) {
      return {};
    }
    return postMeta.reduce<Record<string, CustomFieldValue>>((acc, meta) => {
      acc[meta.key] = meta.value ?? "";
      return acc;
    }, {});
  }, [postMeta]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, CustomFieldValue>
  >({});
  const customFieldHydrationRef = useRef({
    fieldSig: "",
    metaSig: "",
    postSig: "",
    slug,
  });
  const postTypeFieldSignature = useMemo(
    () =>
      postTypeFields
        .map(
          (field) => `${field._id}-${field.updatedAt ?? field.createdAt ?? 0}`,
        )
        .join("|"),
    [postTypeFields],
  );
  const postMetaSignature = useMemo(
    () =>
      Object.entries(postMetaMap)
        .map(([key, value]) => `${key}:${value ?? ""}`)
        .sort()
        .join("|"),
    [postMetaMap],
  );
  const postIdentitySignature = useMemo(
    () =>
      [
        post?._id ?? "new",
        post?._creationTime ?? "",
        post?.updatedAt ?? "",
        post?.slug ?? "",
      ].join("|"),
    [post],
  );

  useEffect(() => {
    const shouldHydrate =
      customFieldHydrationRef.current.fieldSig !== postTypeFieldSignature ||
      customFieldHydrationRef.current.metaSig !== postMetaSignature ||
      customFieldHydrationRef.current.slug !== slug ||
      customFieldHydrationRef.current.postSig !== postIdentitySignature;
    if (!shouldHydrate) {
      return;
    }
    customFieldHydrationRef.current = {
      fieldSig: postTypeFieldSignature,
      metaSig: postMetaSignature,
      postSig: postIdentitySignature,
      slug,
    };
    setCustomFieldValues(() => {
      const next: Record<string, CustomFieldValue> = {};
      postTypeFields.forEach((field) => {
        if (field.isSystem) {
          next[field.key] = deriveSystemFieldValue(field, post, isNewRecord);
          return;
        }
        if (postMetaMap[field.key] !== undefined) {
          next[field.key] = postMetaMap[field.key];
        } else if (field.defaultValue !== undefined) {
          next[field.key] = field.defaultValue as CustomFieldValue;
        } else if (field.type === "boolean") {
          next[field.key] = false;
        } else {
          next[field.key] = "";
        }
      });
      return next;
    });
  }, [
    postMetaSignature,
    postMetaMap,
    postTypeFieldSignature,
    postTypeFields,
    slug,
    postIdentitySignature,
    post,
    isNewRecord,
  ]);

  const sortedCustomFields = useMemo(
    () => [...postTypeFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [postTypeFields],
  );

  const handleCustomFieldChange = useCallback(
    (key: string, value: CustomFieldValue) => {
      setCustomFieldValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const renderCustomFieldControl = useCallback(
    (field: Doc<"postTypeFields">) => {
      const controlId = `custom-field-${field._id}`;
      const value = customFieldValues[field.key];
      const normalizedOptions = normalizeFieldOptions(field.options);
      if (field.isSystem) {
        const displayValue =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : (value ?? "");
        return (
          <Input
            id={controlId}
            value={displayValue}
            readOnly
            disabled
            className="bg-muted text-muted-foreground"
          />
        );
      }
      switch (field.type) {
        case "textarea":
        case "richText":
          return (
            <Textarea
              id={controlId}
              rows={4}
              value={typeof value === "string" ? value : (value ?? "")}
              onChange={(event) =>
                handleCustomFieldChange(field.key, event.target.value)
              }
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          );
        case "boolean":
          return (
            <div className="flex items-center gap-2">
              <Switch
                id={controlId}
                checked={Boolean(value)}
                onCheckedChange={(checked) =>
                  handleCustomFieldChange(field.key, checked)
                }
              />
              <span className="text-sm text-muted-foreground">
                {Boolean(value) ? "Enabled" : "Disabled"}
              </span>
            </div>
          );
        case "number":
          return (
            <Input
              id={controlId}
              type="number"
              value={
                typeof value === "number" || typeof value === "string"
                  ? String(value ?? "")
                  : ""
              }
              onChange={(event) => {
                const nextValue = event.target.value;
                handleCustomFieldChange(
                  field.key,
                  nextValue === "" ? "" : Number(nextValue),
                );
              }}
              placeholder="0"
            />
          );
        case "date":
          return (
            <Input
              id={controlId}
              type="date"
              value={typeof value === "string" ? value : ""}
              onChange={(event) =>
                handleCustomFieldChange(field.key, event.target.value)
              }
            />
          );
        case "datetime":
          return (
            <Input
              id={controlId}
              type="datetime-local"
              value={typeof value === "string" ? value : ""}
              onChange={(event) =>
                handleCustomFieldChange(field.key, event.target.value)
              }
            />
          );
        case "select":
          if (normalizedOptions?.length) {
            return (
              <Select
                value={
                  typeof value === "string" || typeof value === "number"
                    ? String(value)
                    : ""
                }
                onValueChange={(selected) =>
                  handleCustomFieldChange(field.key, selected)
                }
              >
                <SelectTrigger id={controlId}>
                  <SelectValue placeholder={`Select ${field.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {normalizedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return (
            <Input
              id={controlId}
              value={typeof value === "string" ? value : (value ?? "")}
              onChange={(event) =>
                handleCustomFieldChange(field.key, event.target.value)
              }
            />
          );
        default:
          return (
            <Input
              id={controlId}
              value={
                typeof value === "string" || typeof value === "number"
                  ? String(value)
                  : (value ?? "")
              }
              onChange={(event) =>
                handleCustomFieldChange(field.key, event.target.value)
              }
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          );
      }
    },
    [customFieldValues, handleCustomFieldChange],
  );

  const buildMetaPayload = useCallback(() => {
    const payload: Record<string, CustomFieldValue> = {};
    sortedCustomFields.forEach((field) => {
      if (field.isSystem) {
        return;
      }
      const value = customFieldValues[field.key];
      if (value === undefined) {
        return;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
          if (field.required) {
            payload[field.key] = "";
          } else if (postMetaMap[field.key] !== undefined) {
            payload[field.key] = null;
          }
          return;
        }
        payload[field.key] = value;
        return;
      }
      payload[field.key] = value;
    });
    return payload;
  }, [customFieldValues, postMetaMap, sortedCustomFields]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      router.replace(`/admin/edit?${params.toString()}`, { scroll: false });
    },
    [defaultTab, router, searchParams],
  );

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlugValue(post.slug ?? "");
      setExcerpt(post.excerpt ?? "");
      setContent(post.content ?? "");
      setIsPublished(post.status === "published");
    } else if (isNewRecord) {
      setTitle("");
      setSlugValue("");
      setExcerpt("");
      setContent("");
      setIsPublished(false);
    }
  }, [post, isNewRecord]);

  if (!isNewRecord && post === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading entry…
      </div>
    );
  }

  if (!isNewRecord && post === null) {
    return (
      <AdminLayoutContent>
        <AdminLayoutMain>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">
                The requested entry was not found or no longer exists.
              </p>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to archive
              </Button>
            </CardContent>
          </Card>
        </AdminLayoutMain>
      </AdminLayoutContent>
    );
  }

  const headerLabel = postType?.name ?? slug;
  const handleSave = async () => {
    if (!supportsPostsTable) {
      setSaveError("Saving is not yet available for this post type.");
      return;
    }

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setSaveError("Title is required.");
      return;
    }

    setIsSaving(true);
    try {
      const metaPayload = buildMetaPayload();
      const hasMetaEntries = Object.keys(metaPayload).length > 0;
      const manualSlug = slugValue.trim();
      const baseSlug =
        manualSlug || generateSlugFromTitle(normalizedTitle) || "";
      const normalizedSlug =
        generateSlugFromTitle(baseSlug) || `post-${Date.now()}`;
      setSlugValue(normalizedSlug);
      const status = isPublished ? "published" : "draft";

      if (isNewRecord) {
        const newId = await createPost({
          title: normalizedTitle,
          content,
          excerpt,
          slug: normalizedSlug,
          status,
          postTypeSlug: slug,
          ...(hasMetaEntries ? { meta: metaPayload } : {}),
        });
        setSaveError(null);
        router.replace(`/admin/edit?post_type=${slug}&post_id=${newId}`);
        return;
      }

      if (post?._id) {
        await updatePost({
          id: post._id,
          title: normalizedTitle,
          content,
          excerpt,
          status,
          postTypeSlug: slug,
          slug: normalizedSlug,
          ...(hasMetaEntries ? { meta: metaPayload } : {}),
        });
        setSaveError(null);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save post.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const pluginBreadcrumb = pluginSingleView
    ? pluginSingleView.pluginName
    : "Edit";
  const defaultHeader = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Admin / {pluginBreadcrumb}
        </p>
        <h1 className="text-3xl font-bold">
          {isNewRecord ? `New ${headerLabel}` : title || headerLabel}
        </h1>
        <p className="text-muted-foreground">
          {postType?.description ?? "Update metadata for this entry."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !supportsPostsTable}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const defaultMain = (
    <div className="flex flex-col gap-6">
      {defaultHeader}
      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Fundamental settings for this {headerLabel} entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add a descriptive title"
              />
            </div>
            {supportsPostsTable && (
              <div className="space-y-2">
                <Label htmlFor="post-slug">Frontend Slug</Label>
                <Input
                  id="post-slug"
                  value={slugValue}
                  onChange={(event) => setSlugValue(event.target.value)}
                  placeholder="friendly-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique; determines the public URL.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="post-status">Status</Label>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">
                    Toggle visibility for this entry.
                  </p>
                </div>
                <Switch
                  id="post-status"
                  checked={isPublished}
                  onCheckedChange={(checked) => setIsPublished(checked)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-excerpt">Excerpt</Label>
            <Textarea
              id="post-excerpt"
              rows={3}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Short summary for listing views"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-content">Content</Label>
            <Textarea
              id="post-content"
              rows={8}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Compose the main body content"
            />
          </div>
        </CardContent>
      </Card>
      {postTypeFieldsLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>Loading field definitions…</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching the latest custom fields for this post type.
          </CardContent>
        </Card>
      ) : sortedCustomFields.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>
              These fields come from Post Type settings and save into post_meta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sortedCustomFields.map((field) => (
              <div key={field._id} className="space-y-2 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor={`custom-field-${field._id}`}>
                    {field.name}
                    {field.required ? " *" : ""}
                  </Label>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {field.type}
                  </span>
                </div>
                {field.description ? (
                  <p className="text-sm text-muted-foreground">
                    {field.description}
                  </p>
                ) : null}
                {renderCustomFieldControl(field)}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Need custom fields?</CardTitle>
              <CardDescription>
                Connect this post type to marketing tags, menu builders, or
                plugin data by defining post_meta keys.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" asChild>
              <Link
                href={`/admin/settings/post-types?tab=fields&post_type=${slug}`}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Configure Fields
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Custom fields mirror WordPress&apos; post_meta table so plugins
              can rely on a familiar contract.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const defaultSidebar = (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
        <CardDescription>High-level attributes for this entry.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">Post Type</p>
          <p>{headerLabel}</p>
        </div>
        {!isNewRecord && post ? (
          <>
            <div>
              <p className="font-medium text-foreground">Status</p>
              <p className="capitalize">{post.status ?? "draft"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Updated</p>
              <p>
                {post.updatedAt
                  ? formatDistanceToNow(post.updatedAt, { addSuffix: true })
                  : "Not updated"}
              </p>
            </div>
          </>
        ) : (
          <p>This entry has not been saved yet.</p>
        )}
      </CardContent>
    </Card>
  );

  if (pluginSingleView && pluginTabs.length > 0) {
    const activeTabDefinition =
      pluginTabs.find((tab) => tab.slug === activeTab) ?? pluginTabs[0];
    const showSidebar = activeTabDefinition?.usesDefaultEditor ?? false;
    const pluginTabProps = {
      pluginId: pluginSingleView.pluginId,
      pluginName: pluginSingleView.pluginName,
      postId: post?._id,
      postTypeSlug: slug,
      organizationId,
    };

    return (
      <AdminLayoutContent withSidebar={showSidebar}>
        <AdminLayoutMain>
          <div className="flex flex-col gap-6">
            {defaultHeader}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                {pluginTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.slug}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {pluginTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.slug}>
                  {tab.usesDefaultEditor ? (
                    defaultMain
                  ) : tab.render ? (
                    tab.render(pluginTabProps)
                  ) : (
                    <PlaceholderState label={tab.label} />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </AdminLayoutMain>
        {showSidebar && (
          <AdminLayoutSidebar>{defaultSidebar}</AdminLayoutSidebar>
        )}
      </AdminLayoutContent>
    );
  }

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>{defaultMain}</AdminLayoutMain>
      <AdminLayoutSidebar>{defaultSidebar}</AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}

function PlaceholderState({ label }: { label: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>
          This view reuses the same layout slots ready for future data hookups.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Nothing to show just yet.
      </CardContent>
    </Card>
  );
}

function isPermalinkSettingsValue(
  value: unknown,
): value is Partial<PermalinkSettings> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (
    record.structure &&
    (typeof record.structure !== "string" ||
      !PERMALINK_STRUCTURE_VALUES.includes(
        record.structure as PermalinkStructure,
      ))
  ) {
    return false;
  }
  return true;
}

function buildPermalink(
  post: PostDoc,
  settings: PermalinkSettings,
  postType?: PostTypeDoc | null,
) {
  if (postType?.rewrite?.singleSlug) {
    const canonicalPath = getCanonicalPostPath(
      post,
      postType,
      settings.trailingSlash,
    );
    const baseUrl = getFrontendBaseUrl();
    return baseUrl ? `${baseUrl}${canonicalPath}` : canonicalPath;
  }
  if (settings.structure === "plain") {
    return `${getFrontendBaseUrl()}/?p=${post._id}`;
  }

  const structurePattern = (() => {
    switch (settings.structure) {
      case "day-name":
        return "/%year%/%monthnum%/%day%/%postname%/";
      case "month-name":
        return "/%year%/%monthnum%/%postname%/";
      case "numeric":
        return "/archives/%post_id%/";
      case "custom":
        return settings.customStructure || "/%postname%/";
      case "post-name":
      default:
        return "/%postname%/";
    }
  })();

  const interpolated = interpolatePattern(structurePattern, post);
  const normalized = normalizePath(interpolated, settings.trailingSlash);
  const baseUrl = getFrontendBaseUrl();
  return baseUrl ? `${baseUrl}${normalized}` : normalized;
}

function interpolatePattern(pattern: string, post: PostDoc) {
  const date = new Date(post.createdAt ?? Date.now());
  const pad = (value: number, length = 2) =>
    value.toString().padStart(length, "0");
  const slug =
    post.slug ??
    (post.title ? generateSlugFromTitle(post.title) : post._id) ??
    "post";
  const replacements: Record<string, string> = {
    "%year%": date.getFullYear().toString(),
    "%monthnum%": pad(date.getMonth() + 1),
    "%day%": pad(date.getDate()),
    "%hour%": pad(date.getHours()),
    "%minute%": pad(date.getMinutes()),
    "%second%": pad(date.getSeconds()),
    "%post_id%": post._id,
    "%postname%": slug,
    "%category%": post.category ?? "uncategorized",
    "%author%": post.authorId ?? "author",
  };

  return ensureLeadingSlash(
    pattern.replace(/%[^%]+%/g, (token) => replacements[token] ?? token),
  );
}

function normalizePath(path: string, trailingSlash: boolean) {
  if (!trailingSlash) {
    return path.replace(/\/+$/, "") || "/";
  }
  return path.endsWith("/") ? path : `${path}/`;
}

function ensureLeadingSlash(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

function getFrontendBaseUrl() {
  if (CONFIGURED_SITE_URL) return CONFIGURED_SITE_URL;
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return "";
}
