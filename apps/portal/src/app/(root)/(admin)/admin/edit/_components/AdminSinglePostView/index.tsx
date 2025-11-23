"use client";

import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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

import { AdminSinglePostDefaultContent } from "./AdminSinglePostDefaultContent";
import { AdminSinglePostHeader } from "./AdminSinglePostHeader";
import { AdminSinglePostSidebar } from "./AdminSinglePostSidebar";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { PlaceholderState } from "../PlaceholderState";
import type { PluginPostSingleViewConfig } from "~/lib/plugins/types";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { getFrontendBaseUrl } from "../permalink";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { usePostTypeFields } from "../../../settings/post-types/_api/postTypes";
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
              <p className="mb-4 text-muted-foreground">The requested entry was not found or no longer exists.</p>
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
      const baseSlug = manualSlug || generateSlugFromTitle(normalizedTitle) || "";
      const normalizedSlug = generateSlugFromTitle(baseSlug) || `post-${Date.now()}`;
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
      setSaveError(error instanceof Error ? error.message : "Failed to save post.");
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

  const puckDataJson =
    typeof postMetaMap.puck_data === "string" ? postMetaMap.puck_data : "";

  const sidebar = (
    <AdminSinglePostSidebar
      supportsPostsTable={supportsPostsTable}
      puckEditorHref={puckEditorHref}
      isNewRecord={isNewRecord}
      saveButton={renderSaveButton({ fullWidth: true })}
      headerLabel={headerLabel}
      post={post}
    />
  );

  const headerHeading = isNewRecord ? `New ${headerLabel}` : title || headerLabel;
  const headerDescription =
    postType?.description ?? "Update metadata for this entry.";

  const renderDefaultContentNode = () => (
    <AdminSinglePostDefaultContent
      headerLabel={headerLabel}
      postTypeSlug={slug}
      saveError={saveError}
      title={title}
      onTitleChange={setTitle}
      supportsPostsTable={supportsPostsTable}
      isSlugEditing={isSlugEditing}
      onSlugEditingChange={setIsSlugEditing}
      slugValue={slugValue}
      onSlugValueChange={setSlugValue}
      slugInputRef={slugInputRef}
      slugPreviewUrl={slugPreviewUrl}
      isPublished={isPublished}
      onPublishedChange={setIsPublished}
      content={content}
      onContentChange={setContent}
      excerpt={excerpt}
      onExcerptChange={setExcerpt}
      postTypeFieldsLoading={postTypeFieldsLoading}
      sortedCustomFields={sortedCustomFields}
      renderCustomFieldControl={renderCustomFieldControl}
      puckDataJson={puckDataJson}
      initialSlugValue={post?.slug ?? ""}
    />
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

    const tabsSlot = (
      <TabsList className="inline-flex flex-wrap items-start justify-start w-auto">
        {pluginTabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.slug}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    );

    return (
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <AdminLayoutContent withSidebar={showSidebar}>
          <AdminLayoutMain>
            <AdminSinglePostHeader
              pluginBreadcrumb={pluginBreadcrumb}
              heading={headerHeading}
              description={headerDescription}
              onBack={onBack}
              showActions={showSidebar}
              tabsSlot={tabsSlot}
            />
            <div className="container py-6">
              {pluginTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.slug} className="space-y-6">
                  {tab.usesDefaultEditor
                    ? renderDefaultContentNode()
                    : tab.render
                    ? tab.render(pluginTabProps)
                    : <PlaceholderState label={tab.label} />}
                </TabsContent>
              ))}
            </div>
          </AdminLayoutMain>
          {showSidebar && (
            <AdminLayoutSidebar>{sidebar}</AdminLayoutSidebar>
          )}
        </AdminLayoutContent>
      </Tabs>
    );
  }

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>
        <AdminSinglePostHeader
          pluginBreadcrumb={pluginBreadcrumb}
          heading={headerHeading}
          description={headerDescription}
          onBack={onBack}
          showActions
        />
        <div className="container py-6">{renderDefaultContentNode()}</div>
      </AdminLayoutMain>
      <AdminLayoutSidebar>{sidebar}</AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}
