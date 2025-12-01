"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unnecessary-type-assertion */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { SerializedEditorState } from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  generateSlugFromTitle,
  useCreatePost,
  useUpdatePost,
} from "@/lib/blog";
import { PortalSocialFeedProvider } from "@/src/providers/SocialFeedProvider";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  PenSquare,
  Save,
  Sparkles,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

import type { PluginPostSingleViewConfig } from "~/lib/plugins/types";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { Editor } from "~/components/blocks/editor-x/editor";
import {
  createLexicalStateFromPlainText,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { usePostTypeFields } from "../../settings/post-types/_api/postTypes";
import { getFrontendBaseUrl } from "./permalink";
import { PlaceholderState } from "./PlaceholderState";

type CustomFieldValue = string | number | boolean | null;

const stripHtmlTags = (text: string) => text.replace(/<[^>]*>/g, "");

const normalizeFieldOptions = (
  options: Doc<"postTypeFields">["options"],
): { label: string; value: string }[] | null => {
  if (!options) return null;
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (
        typeof option === "object" &&
        option !== null &&
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
      value:
        typeof value === "string" || typeof value === "number"
          ? String(value)
          : "",
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
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supportsPostsTable = !!postType || isBuiltInPostTypeSlug(slug);
  const pluginTabs = pluginSingleView?.config.tabs ?? [];
  const defaultTab =
    pluginSingleView?.config.defaultTab ?? pluginTabs[0]?.slug ?? "edit";
  const tabParam =
    searchParams.get("tab") ?? searchParams.get("page") ?? undefined;
  const queriedTab = (tabParam ?? defaultTab).toLowerCase();
  const normalizedTab = pluginTabs.some((tab) => tab.slug === queriedTab)
    ? queriedTab
    : defaultTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const slugInputRef = useRef<HTMLInputElement | null>(null);
  const derivedEditorState = useMemo<SerializedEditorState | undefined>(() => {
    console.log("[AdminSinglePostView] deriving editor state", {
      postId: post?._id,
      hasContent: Boolean(post?.content),
    });
    const parsed = parseLexicalSerializedState(post?.content ?? null);
    if (parsed) {
      console.log("[AdminSinglePostView] parsed lexical content", {
        postId: post?._id,
      });
      return parsed;
    }
    if (!post?.content) {
      console.log("[AdminSinglePostView] no content to derive", {
        postId: post?._id,
      });
      return undefined;
    }
    const fallbackText = stripHtmlTags(post.content);
    if (!fallbackText) {
      console.log("[AdminSinglePostView] stripped content empty", {
        postId: post?._id,
      });
      return undefined;
    }
    console.log(
      "[AdminSinglePostView] creating lexical state from plain text",
      {
        postId: post?._id,
      },
    );
    return createLexicalStateFromPlainText(fallbackText);
  }, [post]);
  const editorKey = useMemo(() => {
    const base = post?._id ?? (isNewRecord ? "new" : slug);
    const contentHash = post?.content ? post.content.length : 0;
    return `${base}-${contentHash}`;
  }, [isNewRecord, post?._id, post?.content, slug]);

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

    const previewPost = (
      post
        ? { ...post, slug: slugValue }
        : ({
            _id: slugValue || "preview-id",
            slug: slugValue,
          } as Doc<"posts">)
    ) as Doc<"posts">;

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
                checked={value === true}
                onCheckedChange={(checked) =>
                  handleCustomFieldChange(field.key, checked)
                }
              />
              <span className="text-muted-foreground text-sm">
                {value === true ? "Enabled" : "Disabled"}
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
        params.delete("page");
      } else {
        params.set("tab", value);
        params.delete("page");
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

    const params = new URLSearchParams({
      pageIdentifier,
      postId: post._id,
      postType: slug,
      title: title || headerLabel,
    });

    return `/puck/edit?${params.toString()}`;
  }, [headerLabel, pageIdentifier, post?._id, slug, title]);

  if (!isNewRecord && post === undefined) {
    return (
      <div className="text-muted-foreground flex min-h-[60vh] items-center justify-center">
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
              <p className="text-muted-foreground mb-4">
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

  const renderSaveButton = (options?: { fullWidth?: boolean }) => (
    <Button
      type="button"
      onClick={handleSave}
      disabled={isSaving || !supportsPostsTable}
      className={options?.fullWidth ? "w-full" : undefined}
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
  );

  const handleDuplicate = async () => {
    if (!supportsPostsTable || !post?._id || isNewRecord) {
      return;
    }
    setIsDuplicating(true);
    try {
      const duplicateTitle =
        title.trim() || `${post.title ?? headerLabel} (copy)`;
      const baseSlug =
        slugValue.trim() ||
        post.slug ||
        generateSlugFromTitle(duplicateTitle) ||
        "";
      const duplicateSlug =
        generateSlugFromTitle(`${baseSlug}-copy`) ||
        `${baseSlug}-${Date.now()}`;
      const allowedStatuses = new Set(["draft", "published", "archived"]);
      const duplicateStatus: "draft" | "published" | "archived" =
        allowedStatuses.has(post.status ?? "")
          ? (post.status as "draft" | "published" | "archived")
          : "draft";
      const metaPayload = buildMetaPayload();
      const hasMetaEntries = Object.keys(metaPayload).length > 0;
      const newId = await createPost({
        title: duplicateTitle,
        content,
        excerpt,
        slug: duplicateSlug,
        status: duplicateStatus,
        postTypeSlug: slug,
        ...(hasMetaEntries ? { meta: metaPayload } : {}),
      });
      router.replace(`/admin/edit?post_type=${slug}&post_id=${newId}`);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to duplicate this entry.",
      );
    } finally {
      setIsDuplicating(false);
    }
  };

  const renderDefaultContent = () => (
    <div className="space-y-6">
      {saveError && <p className="text-destructive text-sm">{saveError}</p>}
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
                <div className="border-input bg-muted/40 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  {slugPreviewUrl ? (
                    <a
                      className="text-primary min-w-0 flex-1 truncate font-medium hover:underline"
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
              <p className="text-muted-foreground text-xs">
                Must be unique; determines the public URL.
              </p>
            </div>
          )}
          <div className="absolute top-0 right-6 space-y-2">
            {/* <Label htmlFor="post-status">Status</Label> */}
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-muted-foreground text-xs">
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
            <Label>Content</Label>
            <Editor
              key={editorKey}
              editorSerializedState={derivedEditorState}
              onSerializedChange={(state) => {
                setContent(JSON.stringify(state));
              }}
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
          <CardContent className="text-muted-foreground flex items-center gap-2 text-sm">
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
                  <span className="text-muted-foreground text-xs tracking-wide uppercase">
                    {field.type}
                  </span>
                </div>
                {field.description ? (
                  <p className="text-muted-foreground text-sm">
                    {field.description}
                  </p>
                ) : null}
                {renderCustomFieldControl(field)}
              </div>
            ))}
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="custom-field-puck-data">Puck Data (JSON)</Label>
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  system
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
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
            <Sparkles className="text-muted-foreground h-5 w-5" />
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
            <p className="text-muted-foreground text-sm">
              Custom fields mirror WordPress&apos; post_meta table so plugins
              can rely on a familiar contract.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const defaultSidebar = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Save or publish this entry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderSaveButton({ fullWidth: true })}
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={
              isDuplicating || isSaving || isNewRecord || !supportsPostsTable
            }
            onClick={handleDuplicate}
          >
            {isDuplicating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicating…
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Duplicate Entry
              </>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={!puckEditorHref || isNewRecord}
            asChild={!!(puckEditorHref && !isNewRecord)}
            className="w-full gap-2"
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
          {!supportsPostsTable ? (
            <p className="text-muted-foreground text-xs">
              Saving is not available for this post type.
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Saved content is available across all tabs.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            High-level attributes for this entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <div>
            <p className="text-foreground font-medium">Post Type</p>
            <p>{headerLabel}</p>
          </div>
          {!isNewRecord && post ? (
            <>
              <div>
                <p className="text-foreground font-medium">Status</p>
                <p className="capitalize">{post.status ?? "draft"}</p>
              </div>
              <div>
                <p className="text-foreground font-medium">Updated</p>
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
    </div>
  );

  const wrapWithSocialProvider = (node: JSX.Element) =>
    pluginSingleView?.pluginId === "socialfeed" ? (
      <PortalSocialFeedProvider>{node}</PortalSocialFeedProvider>
    ) : (
      node
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
    const layoutTabs = pluginTabs.map((tab) => ({
      value: tab.slug,
      label: tab.label,
      onClick: () => handleTabChange(tab.slug),
    }));

    return wrapWithSocialProvider(
      <AdminLayout
        title={`Edit ${headerLabel}`}
        description={postType?.description ?? "Manage this post entry."}
        activeTab={activeTab}
        pathname={pathname}
      >
        <AdminLayoutContent withSidebar={showSidebar}>
          <AdminLayoutMain>
            <AdminLayoutHeader customTabs={layoutTabs} />
            <div className="container py-6">
              {activeTabDefinition?.usesDefaultEditor ? (
                renderDefaultContent()
              ) : activeTabDefinition?.render ? (
                activeTabDefinition.render(pluginTabProps)
              ) : (
                <PlaceholderState label={activeTabDefinition?.label ?? ""} />
              )}
            </div>
          </AdminLayoutMain>
          {showSidebar && (
            <AdminLayoutSidebar className="border-l p-4">
              {defaultSidebar}
            </AdminLayoutSidebar>
          )}
        </AdminLayoutContent>
      </AdminLayout>,
    );
  }

  return wrapWithSocialProvider(
    <AdminLayout
      title={`Edit ${headerLabel}`}
      description={postType?.description ?? "Manage this post entry."}
      pathname={pathname}
    >
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain>
          <AdminLayoutHeader />
          <div className="container py-6">{renderDefaultContent()}</div>
        </AdminLayoutMain>
        <AdminLayoutSidebar className="border-l p-4">
          {defaultSidebar}
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>,
  );
}
