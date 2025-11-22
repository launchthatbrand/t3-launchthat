"use client";

import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  PenSquare,
  Pencil,
  Save,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
  generateSlugFromTitle,
  useCreatePost,
  useUpdatePost,
} from "@/lib/blog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { PlaceholderState } from "./PlaceholderState";
import type { PluginPostSingleViewConfig } from "~/lib/plugins/types";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { getFrontendBaseUrl } from "./permalink";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { usePostTypeFields } from "../../settings/post-types/_api/postTypes";
import { useQuery } from "convex/react";

type CustomFieldValue = string | number | boolean | null;

const normalizeFieldOptions = (
  options: Doc<"postTypeFields">["options"],
): { label: string; value: string }[] | null => {
  if (!options) return null;
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (
        option &&
        typeof option === "object" &&
        "label" in option &&
        "value" in option
      ) {
        const typed = option as { label: string; value: string | number };
        return { label: String(typed.label), value: String(typed.value) };
      }
      return { label: String(option), value: String(option) };
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
  post: Doc<"posts"> | null | undefined,
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

export interface PluginSingleViewInstance {
  pluginId: string;
  pluginName: string;
  config: PluginPostSingleViewConfig;
}

export interface AdminSinglePostViewProps {
  post?: Doc<"posts"> | null;
  postType: Doc<"postTypes"> | null;
  slug: string;
  isNewRecord: boolean;
  organizationId?: Id<"organizations">;
  pluginSingleView?: PluginSingleViewInstance | null;
  onBack: () => void;
}

export function AdminSinglePostView({
  post,
  postType,
  slug,
  isNewRecord,
  organizationId,
  pluginSingleView,
  onBack,
}: AdminSinglePostViewProps) {
  const router = useRouter();
  const pathname = usePathname();
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
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const slugInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setActiveTab(normalizedTab);
  }, [normalizedTab]);

  useEffect(() => {
    if (isSlugEditing) {
      slugInputRef.current?.focus();
      slugInputRef.current?.select();
    }
  }, [isSlugEditing]);

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

  const slugPreviewUrl = useMemo(() => {
    if (!slugValue) {
      return null;
    }

    const previewPost = (post
      ? { ...post, slug: slugValue }
      : ({
          _id: slugValue || "preview-id",
          slug: slugValue,
        } as Doc<"posts">)) as Doc<"posts">;

    const path = getCanonicalPostPath(previewPost, postType ?? null, true);
    if (!path) {
      return null;
    }
    const baseUrl = getFrontendBaseUrl();
    return baseUrl ? `${baseUrl}${path}` : path;
  }, [post, postType, slugValue]);

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
        const storedValue = postMetaMap[field.key];
        if (storedValue !== undefined) {
          next[field.key] = storedValue;
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
    isNewRecord,
    post,
    postIdentitySignature,
    postMetaMap,
    postMetaSignature,
    postTypeFieldSignature,
    postTypeFields,
    slug,
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
        const displayValue = value == null ? "" : String(value);
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
              value={value == null ? "" : String(value)}
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
              value={value == null ? "" : String(value)}
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
                  : value == null
                  ? ""
                  : String(value)
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
      if (field.isSystem) return;
      const value = customFieldValues[field.key];
      if (value === undefined) return;

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

  const headerLabel = postType?.name ?? slug;
  const pluginBreadcrumb = pluginSingleView
    ? pluginSingleView.pluginName
    : "Edit";
  const pageIdentifier = useMemo(
    () =>
      getTenantScopedPageIdentifier(pathname, {
        organizationId,
        entityId: post?._id ?? null,
      }),
    [pathname, organizationId, post?._id],
  );

  const puckEditorHref = useMemo(() => {
    if (!pageIdentifier || !post?._id) {
      return null;
    }

    const scopedOrg = organizationId ?? "public";
    const params = new URLSearchParams({
      pageIdentifier,
      organizationId: scopedOrg,
      postId: post._id,
      postType: slug,
      title: title || headerLabel,
    });

    return `/puck/edit?${params.toString()}`;
  }, [headerLabel, organizationId, pageIdentifier, post?._id, slug, title]);

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
          variant="outline"
          disabled={!puckEditorHref || isNewRecord}
          asChild={Boolean(puckEditorHref && !isNewRecord)}
          className="gap-2"
        >
          {puckEditorHref && !isNewRecord ? (
            <Link href={puckEditorHref} target="_blank" rel="noreferrer">
              <PenSquare className="h-4 w-4" />
              Edit with Puck
            </Link>
          ) : (
            <>
              <PenSquare className="h-4 w-4" />
              Edit with Puck
            </>
          )}
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
      <Card className="relative">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Fundamental settings for this {headerLabel} entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="grid gap-4 md:grid-cols-2"> */}
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
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="post-slug">Frontend Slug</Label>
            {!isSlugEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSlugEditing(true)}
                className="text-xs"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
          {isSlugEditing ? (
            <Input
              id="post-slug"
              ref={slugInputRef}
              value={slugValue}
              onChange={(event) => setSlugValue(event.target.value)}
              placeholder="friendly-url-slug"
              onBlur={() => setIsSlugEditing(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  slugInputRef.current?.blur();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setSlugValue(post?.slug ?? "");
                  setIsSlugEditing(false);
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
              {slugPreviewUrl ? (
                <a
                  className="min-w-0 flex-1 truncate font-medium text-primary hover:underline"
                  href={slugPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {slugPreviewUrl}
                </a>
              ) : (
                <span className="text-muted-foreground">
                  Slug will be generated after saving.
                </span>
              )}
              {slugPreviewUrl ? (
                <a
                  href={slugPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  aria-label="Open public page"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          )}
              <p className="text-xs text-muted-foreground">
                Must be unique; determines the public URL.
              </p>
            </div>
          )}
          <div className="absolute right-6 top-0 space-y-2">
            {/* <Label htmlFor="post-status">Status</Label> */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
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
          {/* </div> */}
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
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="custom-field-puck-data">Puck Data (JSON)</Label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  system
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only representation of the stored Puck layout. Updates are
                managed automatically when using the Puck editor.
              </p>
              <Textarea
                id="custom-field-puck-data"
                value={
                  typeof postMetaMap.puck_data === "string"
                    ? postMetaMap.puck_data
                    : ""
                }
                readOnly
                rows={8}
                className="font-mono text-xs"
              />
            </div>
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
      asdasdasd asdasd
      asd
      asd
      asd
      <AdminLayoutSidebar>{defaultSidebar}</AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}

