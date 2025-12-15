"use client";

/* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-assignment */
import "./metaBoxes/attachments";
import "./metaBoxes/general";
import "./metaBoxes/content";
import "./metaBoxes/customFields";
import "./metaBoxes/actions";
import "./metaBoxes/metadata";
import "./metaBoxes/vimeo";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { SerializedEditorState } from "lexical";
import type { ReactNode } from "react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  generateSlugFromTitle,
  useCreatePost,
  useUpdatePost,
} from "@/lib/blog";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import type { MetaBoxLocation, RegisteredMetaBox } from "@acme/admin-runtime";
import { collectRegisteredMetaBoxes } from "@acme/admin-runtime";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
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

import type { ExternalMetaBoxRenderer } from "./metaBoxes/utils";
import type {
  AdminMetaBoxContext,
  AdminPostStatus,
  CustomFieldsMetaBoxData,
  CustomFieldValue,
  EditorCustomField,
  GeneralMetaBoxData,
  MetaBoxVisibilityConfig,
  NormalizedMetaBox,
  PostStatusOption,
  ResolvedMetaBox,
  SidebarActionsMetaBoxData,
  SidebarMetadataMetaBoxData,
} from "./types";
import type {
  PluginSingleViewInstance,
  PluginSingleViewSlotRegistration,
} from "~/lib/plugins/helpers";
import type {
  PluginSingleViewSlotLocation,
  PluginSingleViewTabDefinition,
} from "~/lib/plugins/types";
import type { CommerceComponentPostMeta } from "~/lib/postTypes/customAdapters";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { extractVimeoVideoId } from "~/components/editor/utils/oembed";
import { env } from "~/env";
import {
  createLexicalStateFromPlainText,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import {
  getFrontendProvidersForPostType,
  wrapWithFrontendProviders,
} from "~/lib/plugins/frontendProviders";
import {
  getPluginFieldDefinitionsForSlug,
  getPluginSingleViewSlotsForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { adaptCommercePostMetaToPortal } from "~/lib/postTypes/customAdapters";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { useMetaBoxState } from "../_state/useMetaBoxState";
import { usePostTypeFields } from "../../settings/post-types/_api/postTypes";
import { useAttachmentsMetaBox } from "./hooks/useAttachmentsMetaBox";
import { ATTACHMENTS_META_KEY } from "./metaBoxes/constants";
import {
  deriveSystemFieldValue,
  pickMetaBoxes,
  sortMetaBoxes,
} from "./metaBoxes/utils";
import { getFrontendBaseUrl } from "./permalink";
import { PlaceholderState } from "./PlaceholderState";

const stripHtmlTags = (text: string) => text.replace(/<[^>]*>/g, "");
const resolveSupportFlag = (
  supports: Doc<"postTypes">["supports"] | undefined,
  key: string,
) => {
  if (!supports) {
    return false;
  }
  const record = supports as Record<string, unknown>;
  return typeof record[key] === "boolean" ? (record[key] as boolean) : false;
};

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

const formatCustomFieldLabel = (key: string) =>
  key.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const buildSyntheticFieldId = (
  source: string,
  slug: string,
  key: string,
): Id<"postTypeFields"> =>
  `${source}-${slug}-${key}` as unknown as Id<"postTypeFields">;

const createSyntheticField = (
  slug: string,
  key: string,
  overrides: Partial<EditorCustomField> = {},
): EditorCustomField => ({
  _id: buildSyntheticFieldId(overrides.__source ?? "synthetic", slug, key),
  key,
  name: overrides.name ?? formatCustomFieldLabel(key),
  description: overrides.description ?? undefined,
  type: overrides.type ?? "text",
  required: overrides.required ?? false,
  options: overrides.options ?? null,
  defaultValue: overrides.defaultValue ?? null,
  isSystem: overrides.isSystem ?? false,
  order: overrides.order ?? 1000,
  __source: overrides.__source ?? "detected",
  __pluginName: overrides.__pluginName,
  __readOnly: overrides.__readOnly ?? false,
  createdAt: overrides.createdAt,
  updatedAt: overrides.updatedAt,
});

const buildCustomFieldControlId = (fieldId: string, suffix?: string) =>
  `custom-field-${fieldId}${suffix ? `-${suffix}` : ""}`;

interface SerializedLexicalNodeWithChildren {
  type?: string;
  url?: string;
  html?: string;
  providerName?: string;
  videoId?: string;
  thumbnailUrl?: string;
  children?: SerializedLexicalNodeWithChildren[];
}

interface ExtractedVimeoMeta {
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

const VIMEO_META_POST_TYPES = new Set(["lessons", "topics", "quizzes"]);

const isSerializedNodeArray = (
  value: unknown,
): value is SerializedLexicalNodeWithChildren[] =>
  Array.isArray(value) &&
  value.every(
    (entry) => entry && typeof entry === "object" && !Array.isArray(entry),
  );

const extractEmbedUrlFromHtml = (html?: string) => {
  if (!html) {
    return null;
  }
  const match = /src="([^"]+)"/i.exec(html);
  return match ? (match[1] ?? null) : null;
};

const isVimeoEmbedNode = (node: SerializedLexicalNodeWithChildren) => {
  const url = typeof node.url === "string" ? node.url : "";
  const html = typeof node.html === "string" ? node.html : "";
  const provider =
    typeof node.providerName === "string" ? node.providerName : "";
  return (
    /vimeo\.com/i.test(url) ||
    /vimeo\.com/i.test(html) ||
    provider.toLowerCase() === "vimeo"
  );
};

const deriveVimeoMetaFromContent = (
  content: string | null | undefined,
): ExtractedVimeoMeta | null => {
  if (!content) {
    return null;
  }
  try {
    const parsed = JSON.parse(content) as SerializedEditorState;
    const rootChildren = parsed?.root?.children;
    if (!isSerializedNodeArray(rootChildren)) {
      return null;
    }
    const queue: SerializedLexicalNodeWithChildren[] = [...rootChildren];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) {
        continue;
      }
      if (isSerializedNodeArray(node.children)) {
        queue.push(...node.children);
      }
      if (node.type === "oembed" && isVimeoEmbedNode(node)) {
        const embedUrl =
          (typeof node.url === "string" && node.url) ||
          extractEmbedUrlFromHtml(node.html ?? undefined) ||
          undefined;
        const videoId =
          (node.videoId || extractVimeoVideoId(embedUrl ?? node.html ?? "")) ??
          undefined;
        const thumbnailUrl =
          typeof node.thumbnailUrl === "string" ? node.thumbnailUrl : undefined;
        return {
          videoId,
          embedUrl,
          thumbnailUrl,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
};

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
  const isDev = env.NODE_ENV !== "production";
  const log = useCallback(
    (...args: unknown[]) => {
      if (isDev) {
        console.log("[AdminSinglePostView]", ...args);
      }
    },
    [isDev],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slugValue, setSlugValue] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [postStatus, setPostStatus] = useState<AdminPostStatus>(
    (post?.status as AdminPostStatus) ?? "draft",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const createSupportPost = useMutation(
    api.plugins.support.mutations.createSupportPost,
  );
  const updateSupportPost = useMutation(
    api.plugins.support.mutations.updateSupportPost,
  );

  const normalizedSlug = slug.toLowerCase();
  type StorageKind = "posts" | "custom" | "component";
  const storageKind: StorageKind =
    (postType?.storageKind as StorageKind | undefined) ??
    (post?._id?.startsWith("custom:") ? "component" : "posts");
  const isCustomStorage = storageKind === "custom";
  const isComponentStorage = storageKind === "component";
  const isSyntheticPostId = Boolean(post?._id?.startsWith("custom:"));
  const supportsPostsTable =
    storageKind === "posts" && (!!postType || isBuiltInPostTypeSlug(slug));
  const canSaveRecord =
    supportsPostsTable || isCustomStorage || isComponentStorage;
  const supportsAttachments =
    supportsPostsTable &&
    (resolveSupportFlag(postType?.supports, "attachments") ||
      resolveSupportFlag(postType?.supports, "featuredImage"));
  const commerceOrganizationId = organizationId
    ? (organizationId as unknown as string)
    : undefined;
  const pluginTabs: PluginSingleViewTabDefinition[] =
    pluginSingleView?.config.tabs ?? [];
  const pluginSlotRegistrations = useMemo<PluginSingleViewSlotRegistration[]>(
    () => getPluginSingleViewSlotsForSlug(slug),
    [slug],
  );
  const pluginMatch = useMemo(
    () => findPostTypeBySlug(postType?.slug ?? slug),
    [postType?.slug, slug],
  );
  const { metaBoxStates, setMetaBoxState } = useMetaBoxState();
  const defaultTab =
    pluginSingleView?.config.defaultTab ?? pluginTabs[0]?.slug ?? "edit";
  const tabParam =
    searchParams.get("tab") ?? searchParams.get("page") ?? undefined;
  const queriedTab = (tabParam ?? defaultTab).toLowerCase();
  const normalizedTab = pluginTabs.some((tab) => tab.slug === queriedTab)
    ? queriedTab
    : defaultTab;
  const [activeTab, setActiveTab] = useState(normalizedTab);
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

  const { data: postTypeFields = [], isLoading: postTypeFieldsLoading } =
    usePostTypeFields(slug, true);
  const standardMetaArgs =
    post?._id && supportsPostsTable && !isSyntheticPostId
      ? organizationId
        ? ({ postId: post._id, organizationId } as const)
        : ({ postId: post._id } as const)
      : "skip";
  const standardMetaResult = useQuery(
    api.core.posts.queries.getPostMeta,
    standardMetaArgs,
  ) as Doc<"postsMeta">[] | undefined;

  const supportMetaArgs =
    post?._id && isComponentStorage && normalizedSlug === "helpdeskarticles"
      ? ({
          postId: post._id,
          organizationId,
          postTypeSlug: normalizedSlug,
        } as const)
      : "skip";
  const supportMetaResult = useQuery(
    api.core.posts.queries.getPostMeta,
    supportMetaArgs,
  ) as Doc<"postsMeta">[] | null | undefined;

  const commerceMetaArgs =
    post?._id && isComponentStorage && normalizedSlug !== "helpdeskarticles"
      ? ({
          postId: post._id as unknown as string,
          organizationId: commerceOrganizationId,
        } as const)
      : "skip";
  const commerceMetaResult = useQuery(
    api.plugins.commerce.queries.getPostMeta,
    commerceMetaArgs,
  ) as CommerceComponentPostMeta[] | null | undefined;
  const postMeta = useMemo(() => {
    if (isComponentStorage) {
      if (normalizedSlug === "helpdeskarticles") {
        if (supportMetaResult === undefined) {
          return undefined;
        }
        if (supportMetaResult === null) {
          return [] as Doc<"postsMeta">[];
        }
        return supportMetaResult ?? [];
      }
      if (commerceMetaResult === undefined) {
        return undefined;
      }
      if (commerceMetaResult === null) {
        return [] as Doc<"postsMeta">[];
      }
      const slugSource = post?.postTypeSlug ?? normalizedSlug;
      return commerceMetaResult.map((entry) =>
        adaptCommercePostMetaToPortal(entry, slugSource),
      );
    }
    return standardMetaResult ?? undefined;
  }, [
    commerceMetaResult,
    isComponentStorage,
    supportMetaResult,
    normalizedSlug,
    post?.postTypeSlug,
    standardMetaResult,
  ]);

  const postMetaMap = useMemo<Record<string, CustomFieldValue>>(() => {
    if (!postMeta) {
      return {};
    }
    return postMeta.reduce<Record<string, CustomFieldValue>>((acc, meta) => {
      const normalizedValue = (meta.value ?? "") as CustomFieldValue;
      acc[meta.key] = normalizedValue;
      return acc;
    }, {});
  }, [postMeta]);

  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, CustomFieldValue>
  >({});
  const getMetaValue = useCallback(
    (key: string) => customFieldValues[key],
    [customFieldValues],
  );
  const setMetaValue = useCallback((key: string, value: unknown) => {
    setCustomFieldValues((prev) => {
      if (value === undefined) {
        if (!(key in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const normalizedValue: CustomFieldValue =
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
          ? (value as CustomFieldValue)
          : (JSON.stringify(value) as CustomFieldValue);
      if (prev[key] === normalizedValue) {
        return prev;
      }
      return { ...prev, [key]: normalizedValue };
    });
  }, []);
  const {
    context: attachmentsContext,
    serializedValue: attachmentsSerializedValue,
  } = useAttachmentsMetaBox({
    postMetaMap,
    supportsAttachments,
  });
  const headerLabel = postType?.name ?? slug;

  const schemaFields = useMemo<EditorCustomField[]>(
    () =>
      postTypeFields.map((field) => ({
        ...field,
        __source: "schema" as const,
      })),
    [postTypeFields],
  );

  const pluginFieldDefinitions = useMemo<EditorCustomField[]>(() => {
    const seen = new Set(schemaFields.map((field) => field.key));
    const registrations = getPluginFieldDefinitionsForSlug(slug);
    const fields: EditorCustomField[] = [];
    registrations.forEach(({ pluginName, field }, index) => {
      if (!field.key || seen.has(field.key)) {
        return;
      }
      fields.push(
        createSyntheticField(slug, field.key, {
          name: field.name,
          description: field.description,
          type: field.type ?? "text",
          required: field.required ?? false,
          options: (field.options ?? null) as EditorCustomField["options"],
          defaultValue: field.defaultValue ?? null,
          order: 2000 + index,
          __source: "plugin",
          __pluginName: pluginName,
          __readOnly: field.readOnly ?? true,
        }),
      );
      seen.add(field.key);
    });
    return fields;
  }, [schemaFields, slug]);

  const detectedFields = useMemo<EditorCustomField[]>(() => {
    const seen = new Set<string>([
      ...schemaFields.map((field) => field.key),
      ...pluginFieldDefinitions.map((field) => field.key),
    ]);
    const fields: EditorCustomField[] = [];
    Object.entries(postMetaMap).forEach(([key, value], index) => {
      if (seen.has(key) || key === "puck_data") {
        return;
      }
      fields.push(
        createSyntheticField(slug, key, {
          type: typeof value === "boolean" ? "boolean" : "text",
          description: "Detected post meta value",
          order: 3000 + index,
          __source: "detected",
          __readOnly: false,
        }),
      );
      seen.add(key);
    });
    return fields;
  }, [pluginFieldDefinitions, postMetaMap, schemaFields, slug]);

  const combinedFields = useMemo(
    () => [...schemaFields, ...pluginFieldDefinitions, ...detectedFields],
    [schemaFields, pluginFieldDefinitions, detectedFields],
  );

  const shouldTrackVimeoMeta = VIMEO_META_POST_TYPES.has(slug);
  const resolvedVimeoMeta = useMemo(
    () => (shouldTrackVimeoMeta ? deriveVimeoMetaFromContent(content) : null),
    [content, shouldTrackVimeoMeta],
  );

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

  const beforeSaveHandlers = useRef<Set<() => Promise<void> | void>>(new Set());
  const metaPayloadCollectors = useRef<
    Map<number, () => Record<string, unknown> | null | undefined>
  >(new Map());
  const metaPayloadCollectorId = useRef(0);
  const registerBeforeSave = useCallback(
    (handler: () => Promise<void> | void) => {
      log("registerBeforeSave called");
      beforeSaveHandlers.current.add(handler);
      return () => {
        log("registerBeforeSave cleanup");
        beforeSaveHandlers.current.delete(handler);
      };
    },
    [log],
  );
  const registerMetaPayloadCollector = useCallback(
    (collector: () => Record<string, unknown> | null | undefined) => {
      const collectorId = metaPayloadCollectorId.current++;
      metaPayloadCollectors.current.set(collectorId, collector);
      return () => {
        metaPayloadCollectors.current.delete(collectorId);
      };
    },
    [],
  );
  const metaBoxAssetsRef = useRef<{
    scripts: Map<number, ReactNode>;
    styles: Map<number, ReactNode>;
  }>({
    scripts: new Map(),
    styles: new Map(),
  });
  const metaBoxAssetId = useRef(0);
  const [metaBoxAssetVersion, setMetaBoxAssetVersion] = useState(0);
  const enqueueMetaBoxAsset = useCallback(
    (type: "scripts" | "styles", node: ReactNode) => {
      const id = metaBoxAssetId.current++;
      metaBoxAssetsRef.current[type].set(id, node);
      setMetaBoxAssetVersion((version) => version + 1);
      return () => {
        if (metaBoxAssetsRef.current[type].delete(id)) {
          setMetaBoxAssetVersion((version) => version + 1);
        }
      };
    },
    [],
  );
  const enqueueScript = useCallback(
    (node: ReactNode) => enqueueMetaBoxAsset("scripts", node),
    [enqueueMetaBoxAsset],
  );
  const enqueueStyle = useCallback(
    (node: ReactNode) => enqueueMetaBoxAsset("styles", node),
    [enqueueMetaBoxAsset],
  );
  const metaBoxScripts = useMemo(() => {
    if (metaBoxAssetVersion < 0) {
      return [];
    }
    return Array.from(metaBoxAssetsRef.current.scripts.entries());
  }, [metaBoxAssetVersion]);
  const metaBoxStyles = useMemo(() => {
    if (metaBoxAssetVersion < 0) {
      return [];
    }
    return Array.from(metaBoxAssetsRef.current.styles.entries());
  }, [metaBoxAssetVersion]);

  const generalMetaBoxData = useMemo<GeneralMetaBoxData>(
    () => ({
      headerLabel,
      originalSlug: post?.slug ?? "",
      title,
      setTitle,
      slugValue,
      setSlugValue,
      slugPreviewUrl,
      supportsPostsTable,
      editorKey,
      derivedEditorState,
      setContent,
      organizationId,
      excerpt,
      setExcerpt,
    }),
    [
      derivedEditorState,
      editorKey,
      excerpt,
      headerLabel,
      organizationId,
      post?.slug,
      setContent,
      setExcerpt,
      setSlugValue,
      setTitle,
      slugPreviewUrl,
      slugValue,
      supportsPostsTable,
      title,
    ],
  );

  const statusOptions = useMemo<PostStatusOption[]>(
    () => [
      {
        value: "draft",
        label: "Draft",
        description: "Keep editing privately until you're ready to share.",
      },
      {
        value: "published",
        label: "Published",
        description: "Live and visible to anyone with access.",
      },
      {
        value: "archived",
        label: "Archived",
        description: "Hidden from learners but retained for reference.",
      },
    ],
    [],
  );

  const frontendProviders = useMemo(
    () => getFrontendProvidersForPostType(slug),
    [slug],
  );

  const wrapWithPostTypeProviders = useCallback(
    (node: ReactNode) => wrapWithFrontendProviders(node, frontendProviders),
    [frontendProviders],
  );

  const generalHydrationRef = useRef("");
  const customFieldHydrationRef = useRef({
    fieldSig: "",
    metaSig: "",
    postSig: "",
    slug,
  });

  const fieldDefinitionSignature = useMemo(
    () =>
      combinedFields
        .map(
          (field) =>
            `${field.key}-${field.__source ?? "schema"}-${
              field.updatedAt ?? field.createdAt ?? 0
            }`,
        )
        .join("|"),
    [combinedFields],
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
      customFieldHydrationRef.current.fieldSig !== fieldDefinitionSignature ||
      customFieldHydrationRef.current.metaSig !== postMetaSignature ||
      customFieldHydrationRef.current.slug !== slug ||
      customFieldHydrationRef.current.postSig !== postIdentitySignature;
    if (!shouldHydrate) {
      return;
    }

    customFieldHydrationRef.current = {
      fieldSig: fieldDefinitionSignature,
      metaSig: postMetaSignature,
      postSig: postIdentitySignature,
      slug,
    };

    setCustomFieldValues(() => {
      const next: Record<string, CustomFieldValue> = {};
      combinedFields.forEach((field) => {
        if (field.isSystem) {
          next[field.key] = deriveSystemFieldValue(field, post, isNewRecord);
          return;
        }
        const storedValue = postMetaMap[field.key];
        if (storedValue !== undefined) {
          next[field.key] = storedValue;
        } else if (
          field.defaultValue !== undefined &&
          field.__source !== "detected"
        ) {
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
    combinedFields,
    fieldDefinitionSignature,
    isNewRecord,
    post,
    postIdentitySignature,
    postMetaMap,
    postMetaSignature,
    slug,
  ]);

  const sortedCustomFields = useMemo(
    () => [...combinedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [combinedFields],
  );

  const fieldRegistry = useMemo(() => {
    const map = new Map<string, EditorCustomField>();
    sortedCustomFields.forEach((field) => {
      map.set(field.key, field);
    });
    return map;
  }, [sortedCustomFields]);

  const normalizedMetaBoxes = useMemo<NormalizedMetaBox[]>(() => {
    if (!postType?.metaBoxes?.length) {
      return [];
    }
    const boxes: NormalizedMetaBox[] = [];
    for (const box of postType.metaBoxes) {
      const fields: EditorCustomField[] = [];
      for (const key of box.fieldKeys ?? []) {
        const matchedField = fieldRegistry.get(key);
        if (matchedField) {
          fields.push(matchedField);
        }
      }
      if (fields.length === 0 && !box.rendererKey) {
        continue;
      }
      boxes.push({
        id: box.id,
        title: box.title,
        description: box.description ?? null,
        location: box.location ?? "sidebar",
        priority: box.priority ?? 50,
        fields,
        rendererKey: box.rendererKey ?? null,
      });
    }
    return boxes.sort((a, b) => {
      if (a.priority === b.priority) {
        return a.title.localeCompare(b.title);
      }
      return a.priority - b.priority;
    });
  }, [fieldRegistry, postType?.metaBoxes]);

  const mainMetaBoxes = useMemo(
    () => normalizedMetaBoxes.filter((box) => box.location === "main"),
    [normalizedMetaBoxes],
  );
  const sidebarMetaBoxes = useMemo(
    () => normalizedMetaBoxes.filter((box) => box.location === "sidebar"),
    [normalizedMetaBoxes],
  );

  const assignedFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const box of postType?.metaBoxes ?? []) {
      for (const key of box.fieldKeys ?? []) {
        keys.add(key);
      }
    }
    return keys;
  }, [postType?.metaBoxes]);

  const unassignedFields = useMemo(
    () =>
      sortedCustomFields.filter((field) => !assignedFieldKeys.has(field.key)),
    [assignedFieldKeys, sortedCustomFields],
  );

  const allMetaBoxesMap = useMemo(() => {
    const map: Record<string, NormalizedMetaBox> = {};
    [...mainMetaBoxes, ...sidebarMetaBoxes].forEach((box) => {
      map[box.id] = box;
    });
    return map;
  }, [mainMetaBoxes, sidebarMetaBoxes]);

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
    (
      field: EditorCustomField,
      options?: {
        idSuffix?: string;
      },
    ) => {
      const controlId = buildCustomFieldControlId(field._id, options?.idSuffix);
      const value = customFieldValues[field.key];
      const normalizedOptions = normalizeFieldOptions(field.options);
      const isReadOnly = field.__readOnly ?? false;

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

      const sharedInputProps = {
        id: controlId,
        readOnly: isReadOnly,
        disabled: isReadOnly,
      };

      switch (field.type) {
        case "textarea":
        case "richText":
          return (
            <Textarea
              {...sharedInputProps}
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
                disabled={isReadOnly}
              />
              <span className="text-muted-foreground text-sm">
                {value === true ? "Enabled" : "Disabled"}
              </span>
            </div>
          );
        case "number":
          return (
            <Input
              {...sharedInputProps}
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
              {...sharedInputProps}
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
              {...sharedInputProps}
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
                disabled={isReadOnly}
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
              {...sharedInputProps}
              value={value == null ? "" : String(value)}
              onChange={(event) =>
                handleCustomFieldChange(field.key, event.target.value)
              }
            />
          );
        default:
          return (
            <Input
              {...sharedInputProps}
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

  const renderFieldBlock = useCallback(
    (
      field: EditorCustomField,
      options?: {
        idSuffix?: string;
      },
    ) => {
      const key =
        options?.idSuffix !== undefined
          ? `${field._id}-${options.idSuffix}`
          : field._id;
      return (
        <div key={key} className="space-y-2 rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor={buildCustomFieldControlId(field._id)}>
              {field.name}
              {field.required ? " *" : ""}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                {field.type}
              </span>
              {field.__source === "plugin" ? (
                <Badge variant="outline">
                  Plugin{field.__pluginName ? ` · ${field.__pluginName}` : ""}
                </Badge>
              ) : field.__source === "detected" ? (
                <Badge variant="secondary">Detected</Badge>
              ) : null}
            </div>
          </div>
          {field.description ? (
            <p className="text-muted-foreground text-sm">{field.description}</p>
          ) : null}
          {renderCustomFieldControl(field, options)}
        </div>
      );
    },
    [renderCustomFieldControl],
  );

  const customFieldsMetaBoxData = useMemo<CustomFieldsMetaBoxData>(
    () => ({
      postTypeFieldsLoading,
      unassignedFields,
      renderCustomFieldControl,
      renderFieldBlock,
      postMetaMap,
      slug,
    }),
    [
      postMetaMap,
      postTypeFieldsLoading,
      renderCustomFieldControl,
      renderFieldBlock,
      slug,
      unassignedFields,
    ],
  );

  const renderFieldByKey = useCallback(
    (
      fieldKey: string,
      options?: {
        idSuffix?: string;
      },
    ) => {
      const field = fieldRegistry.get(fieldKey);
      if (!field) return null;
      return renderFieldBlock(field, options);
    },
    [fieldRegistry, renderFieldBlock],
  );

  const renderFieldControlByKey = useCallback(
    (
      fieldKey: string,
      options?: {
        idSuffix?: string;
      },
    ) => {
      const field = fieldRegistry.get(fieldKey);
      if (!field) return null;
      return renderCustomFieldControl(field, options);
    },
    [fieldRegistry, renderCustomFieldControl],
  );

  const buildFieldMetaBox = useCallback(
    (metaBox: NormalizedMetaBox): ResolvedMetaBox => {
      const rendererKey = metaBox.rendererKey;
      const customRenderer: ExternalMetaBoxRenderer | null =
        rendererKey && pluginMatch?.postType.metaBoxRenderers
          ? ((pluginMatch.postType.metaBoxRenderers[rendererKey] as
              | ExternalMetaBoxRenderer
              | undefined) ?? null)
          : null;

      const baseMeta: Omit<ResolvedMetaBox, "render"> = {
        id: metaBox.id,
        title: metaBox.title,
        description: metaBox.description ?? undefined,
        location: metaBox.location,
        priority: metaBox.priority,
      };

      if (typeof customRenderer === "function" && pluginMatch) {
        return {
          ...baseMeta,
          render: () =>
            customRenderer({
              context: {
                pluginId: pluginMatch.plugin.id,
                pluginName: pluginMatch.plugin.name,
                postTypeSlug: pluginMatch.postType.slug,
                organizationId,
                postId: post?._id,
                isNewRecord,
                post,
                postType,
              },
              metaBox: {
                id: metaBox.id,
                title: metaBox.title,
                description: metaBox.description ?? undefined,
                location: metaBox.location,
              },
              fields: metaBox.fields.map((field) => ({
                key: field.key,
                name: field.name,
                description: field.description ?? null,
                type: field.type,
                required: field.required ?? false,
                options: field.options ?? null,
              })),
              getValue: (fieldKey) => customFieldValues[fieldKey],
              setValue: (fieldKey, value) =>
                handleCustomFieldChange(fieldKey, value as CustomFieldValue),
              renderField: (fieldKey, options) =>
                renderFieldByKey(fieldKey, options),
              renderFieldControl: (fieldKey, options) =>
                renderFieldControlByKey(fieldKey, options),
            }),
        };
      }

      return {
        ...baseMeta,
        render: () =>
          metaBox.fields.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No fields are assigned to this meta box.
            </p>
          ) : (
            <div className="space-y-4">
              {metaBox.fields.map((field) => renderFieldBlock(field))}
            </div>
          ),
      };
    },
    [
      customFieldValues,
      handleCustomFieldChange,
      isNewRecord,
      organizationId,
      pluginMatch,
      post,
      postType,
      renderFieldBlock,
      renderFieldByKey,
      renderFieldControlByKey,
    ],
  );

  const renderMetaBoxList = (
    metaBoxes: ResolvedMetaBox[],
    _location: "main" | "sidebar",
  ) => {
    if (metaBoxes.length === 0) {
      return null;
    }
    const sortedBoxes = sortMetaBoxes(metaBoxes);
    return (
      <div className="space-y-4">
        {sortedBoxes.map((metaBox) => {
          const storageKey = `${slug}:${metaBox.id}`;
          const isOpen = metaBoxStates[storageKey] ?? true;
          return (
            <Accordion
              type="single"
              collapsible
              value={isOpen ? metaBox.id : undefined}
              onValueChange={(value) =>
                setMetaBoxState(storageKey, Boolean(value))
              }
              key={metaBox.id}
              className="rounded-lg border"
            >
              <AccordionItem value={metaBox.id} className="border-none">
                <AccordionTrigger className="px-4 py-3 text-left">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">{metaBox.title}</span>
                    {metaBox.description ? (
                      <span className="text-muted-foreground text-sm">
                        {metaBox.description}
                      </span>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-0 pb-4">
                  <div className="space-y-4 pt-2">{metaBox.render()}</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
      </div>
    );
  };

  const renderPluginSlots = useCallback(
    (location: PluginSingleViewSlotLocation) => {
      if (pluginSlotRegistrations.length === 0) {
        return null;
      }
      const nodes = pluginSlotRegistrations
        .filter((registration) => registration.slot.location === location)
        .map((registration) => {
          const element = registration.slot.render({
            pluginId: registration.pluginId,
            pluginName: registration.pluginName,
            postId: post?._id ?? undefined,
            postTypeSlug: slug,
            organizationId,
            mediaPickerContext: undefined,
            isNewRecord,
            post,
            postType,
          });
          if (!element) {
            return null;
          }
          return (
            <div
              key={`${registration.pluginId}-${registration.slot.id}`}
              className="w-full"
            >
              {wrapWithPluginProviders(element, registration.pluginId)}
            </div>
          );
        })
        .filter((node) => node !== null) as ReactNode[];
      if (nodes.length === 0) {
        return null;
      }
      return <div className="space-y-4">{nodes}</div>;
    },
    [
      isNewRecord,
      organizationId,
      pluginSlotRegistrations,
      post,
      postType,
      slug,
    ],
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

    if (supportsAttachments) {
      if (attachmentsSerializedValue) {
        payload[ATTACHMENTS_META_KEY] = attachmentsSerializedValue;
      } else if (postMetaMap[ATTACHMENTS_META_KEY] !== undefined) {
        payload[ATTACHMENTS_META_KEY] = "";
      }
    }

    if (shouldTrackVimeoMeta) {
      if (resolvedVimeoMeta?.videoId) {
        payload.vimeoVideoId = resolvedVimeoMeta.videoId;
      } else if (postMetaMap.vimeoVideoId !== undefined) {
        payload.vimeoVideoId = "";
      }

      if (resolvedVimeoMeta?.embedUrl) {
        payload.vimeoEmbedUrl = resolvedVimeoMeta.embedUrl;
      } else if (postMetaMap.vimeoEmbedUrl !== undefined) {
        payload.vimeoEmbedUrl = "";
      }

      if (resolvedVimeoMeta?.thumbnailUrl) {
        payload.vimeoThumbnailUrl = resolvedVimeoMeta.thumbnailUrl;
      } else if (postMetaMap.vimeoThumbnailUrl !== undefined) {
        payload.vimeoThumbnailUrl = "";
      }

      if (resolvedVimeoMeta) {
        payload.source = "vimeo";
      } else if (postMetaMap.source === "vimeo") {
        payload.source = "";
      }
    }

    metaPayloadCollectors.current.forEach((collector) => {
      try {
        const result = collector();
        if (!result) {
          return;
        }
        Object.entries(result).forEach(([key, value]) => {
          payload[key] = value as CustomFieldValue;
        });
      } catch (error) {
        console.error(
          "[AdminSinglePostView] meta payload collector failed",
          error,
        );
      }
    });

    return payload;
  }, [
    attachmentsSerializedValue,
    customFieldValues,
    postMetaMap,
    resolvedVimeoMeta,
    shouldTrackVimeoMeta,
    sortedCustomFields,
    supportsAttachments,
  ]);

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
    const signature = post
      ? [
          post._id,
          post.title ?? "",
          post.slug ?? "",
          post.excerpt ?? "",
          post.content ?? "",
          post.status ?? "",
        ].join("|")
      : isNewRecord
        ? "new-record"
        : "no-post";

    if (generalHydrationRef.current === signature) {
      return;
    }
    generalHydrationRef.current = signature;

    if (post) {
      setTitle(post.title ?? "");
      setSlugValue(post.slug ?? "");
      setExcerpt(post.excerpt ?? "");
      setContent(post.content ?? "");
      setPostStatus((post.status as AdminPostStatus) ?? "draft");
      return;
    }
    if (isNewRecord) {
      setTitle("");
      setSlugValue("");
      setExcerpt("");
      setContent("");
      setPostStatus("draft");
    }
  }, [isNewRecord, post]);

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

  const handleSave = useCallback(async () => {
    if (!canSaveRecord) {
      setSaveError("Saving is not yet available for this post type.");
      return;
    }

    const normalizedTitle = title.trim();
    const requiresTitle = storageKind === "posts";
    if (requiresTitle && !normalizedTitle) {
      setSaveError("Title is required.");
      return;
    }

    setIsSaving(true);
    try {
      for (const handler of beforeSaveHandlers.current) {
        log("Running beforeSave handler", handler.name ?? "anonymous");
        await handler();
      }
      if (isComponentStorage && normalizedSlug === "helpdeskarticles") {
        log("Component storage detected, saving via support component posts", {
          storageKind,
          normalizedSlug,
        });
        const metaPayload = buildMetaPayload();
        const metaEntries = Object.entries(metaPayload).map(([key, value]) => ({
          key,
          value,
        }));
        const manualSlug = slugValue.trim();
        const baseSlug =
          manualSlug || generateSlugFromTitle(normalizedTitle) || "";
        const normalizedSlugValue =
          generateSlugFromTitle(baseSlug) || `post-${Date.now()}`;
        setSlugValue(normalizedSlugValue);
        const status = postStatus;

        if (isNewRecord) {
          const newId = await createSupportPost({
            organizationId: organizationId as unknown as string,
            postTypeSlug: normalizedSlug,
            title: normalizedTitle,
            content,
            excerpt,
            slug: normalizedSlugValue,
            status,
            meta: metaEntries,
          });
          setSaveError(null);
          router.replace(
            `/admin/edit?post_type=${slug}&post_id=${newId as string}`,
          );
          return;
        }

        if (post?._id) {
          await updateSupportPost({
            id: post._id as unknown as string,
            organizationId: organizationId as unknown as string,
            postTypeSlug: normalizedSlug,
            title: normalizedTitle,
            content,
            excerpt,
            slug: normalizedSlugValue,
            status,
            meta: metaEntries,
          });
          setSaveError(null);
        }
        return;
      }

      if (isCustomStorage || isComponentStorage) {
        log("External storage detected, skipping core save", { storageKind });
        setSaveError(null);
        return;
      }
      const metaPayload = buildMetaPayload();
      const hasMetaEntries = Object.keys(metaPayload).length > 0;
      const manualSlug = slugValue.trim();
      const baseSlug =
        manualSlug || generateSlugFromTitle(normalizedTitle) || "";
      const normalizedSlugValueCore =
        generateSlugFromTitle(baseSlug) || `post-${Date.now()}`;
      setSlugValue(normalizedSlugValueCore);
      const status = postStatus;

      if (isNewRecord) {
        log("Creating core post", {
          slug: normalizedSlug,
          status,
          metaPayload,
        });
        const newId = await createPost({
          title: normalizedTitle,
          content,
          excerpt,
          slug: normalizedSlugValueCore,
          status,
          postTypeSlug: slug,
          ...(hasMetaEntries ? { meta: metaPayload } : {}),
        });
        setSaveError(null);
        router.replace(`/admin/edit?post_type=${slug}&post_id=${newId}`);
        return;
      }

      if (post?._id) {
        log("Updating core post", {
          postId: post._id,
          status,
          metaPayload,
        });
        await updatePost({
          id: post._id,
          title: normalizedTitle,
          content,
          excerpt,
          status,
          postTypeSlug: slug,
          slug: normalizedSlugValueCore,
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
  }, [
    buildMetaPayload,
    canSaveRecord,
    content,
    createPost,
    createSupportPost,
    excerpt,
    isComponentStorage,
    isCustomStorage,
    isNewRecord,
    log,
    normalizedSlug,
    organizationId,
    post,
    postStatus,
    router,
    setIsSaving,
    setSaveError,
    setSlugValue,
    slug,
    slugValue,
    storageKind,
    title,
    updatePost,
    updateSupportPost,
  ]);

  const renderSaveButton = useCallback(
    (options?: { fullWidth?: boolean }) => (
      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !canSaveRecord}
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
    ),
    [canSaveRecord, handleSave, isSaving],
  );

  const handleDuplicate = useCallback(async () => {
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
  }, [
    buildMetaPayload,
    content,
    createPost,
    excerpt,
    headerLabel,
    isNewRecord,
    post?._id,
    post?.slug,
    post?.status,
    post?.title,
    router,
    slug,
    slugValue,
    supportsPostsTable,
    title,
  ]);

  const sidebarActionsMetaBoxData = useMemo<SidebarActionsMetaBoxData>(
    () => ({
      renderSaveButton,
      handleDuplicate,
      isDuplicating,
      isSaving,
      supportsPostsTable,
      puckEditorHref,
      isNewRecord,
      canSaveRecord,
      postStatus,
      setPostStatus,
      statusOptions,
    }),
    [
      canSaveRecord,
      handleDuplicate,
      isDuplicating,
      isNewRecord,
      isSaving,
      puckEditorHref,
      postStatus,
      renderSaveButton,
      supportsPostsTable,
      statusOptions,
      setPostStatus,
    ],
  );

  const sidebarMetadataMetaBoxData = useMemo<SidebarMetadataMetaBoxData>(
    () => ({
      headerLabel,
      post,
      postType,
      isNewRecord,
    }),
    [headerLabel, isNewRecord, post, postType],
  );

  const metaBoxContext = useMemo<AdminMetaBoxContext>(
    () => ({
      post,
      postType,
      slug,
      isNewRecord,
      organizationId,
      attachmentsContext,
      general: generalMetaBoxData,
      customFields: customFieldsMetaBoxData,
      sidebar: {
        actions: sidebarActionsMetaBoxData,
        metadata: sidebarMetadataMetaBoxData,
      },
      registerBeforeSave,
      registerMetaPayloadCollector,
      getMetaValue,
      setMetaValue,
      enqueueScript,
      enqueueStyle,
    }),
    [
      attachmentsContext,
      customFieldsMetaBoxData,
      enqueueScript,
      enqueueStyle,
      generalMetaBoxData,
      getMetaValue,
      isNewRecord,
      organizationId,
      post,
      postType,
      registerMetaPayloadCollector,
      sidebarActionsMetaBoxData,
      sidebarMetadataMetaBoxData,
      setMetaValue,
      registerBeforeSave,
      slug,
    ],
  );
  const metaBoxAssetNodes = useMemo(
    () => ({
      styles: metaBoxStyles.map(([id, node]) => (
        <Fragment key={`meta-style-${id}`}>{node}</Fragment>
      )),
      scripts: metaBoxScripts.map(([id, node]) => (
        <Fragment key={`meta-script-${id}`}>{node}</Fragment>
      )),
    }),
    [metaBoxScripts, metaBoxStyles],
  );

  const appendRegisteredMetaBoxes = useCallback(
    (
      target: ResolvedMetaBox[],
      location: MetaBoxLocation,
      visibilityOverride?: Partial<MetaBoxVisibilityConfig>,
    ) => {
      const contextForHooks: AdminMetaBoxContext = visibilityOverride
        ? {
            ...metaBoxContext,
            visibility: {
              ...metaBoxContext.visibility,
              ...visibilityOverride,
            },
          }
        : metaBoxContext;

      const registeredMetaBoxes: RegisteredMetaBox<AdminMetaBoxContext>[] =
        collectRegisteredMetaBoxes<AdminMetaBoxContext>(
          location,
          contextForHooks,
        );

      registeredMetaBoxes.forEach((registeredMetaBox) => {
        target.push({
          id: registeredMetaBox.id,
          title: registeredMetaBox.title,
          description: registeredMetaBox.description,
          location: registeredMetaBox.location,
          priority: registeredMetaBox.priority ?? 50,
          render: () => registeredMetaBox.render(contextForHooks),
        });
      });
    },
    [metaBoxContext],
  );

  const renderDefaultContent = (options?: {
    showGeneralPanel?: boolean;
    showCustomFieldsPanel?: boolean;
    metaBoxIds?: string[];
    mainMetaBoxIds?: string[];
    useDefaultMainMetaBoxes?: boolean;
  }) => {
    const shouldShowGeneral = options?.showGeneralPanel ?? true;
    const shouldShowCustomFields = options?.showCustomFieldsPanel ?? true;
    const visibleFieldMetaBoxes = pickMetaBoxes(
      options?.mainMetaBoxIds ?? options?.metaBoxIds,
      mainMetaBoxes,
      allMetaBoxesMap,
      options?.useDefaultMainMetaBoxes ?? true,
    ).map(buildFieldMetaBox);

    const resolvedMetaBoxes: ResolvedMetaBox[] = [];

    appendRegisteredMetaBoxes(resolvedMetaBoxes, "main", {
      showGeneralPanel: shouldShowGeneral,
      showCustomFieldsPanel: shouldShowCustomFields,
    });

    resolvedMetaBoxes.push(...visibleFieldMetaBoxes);
    const afterContentSlots = renderPluginSlots("afterMainContent");

    return (
      <div className="space-y-6">
        {saveError && <p className="text-destructive text-sm">{saveError}</p>}
        {renderMetaBoxList(resolvedMetaBoxes, "main")}
        {afterContentSlots}
      </div>
    );
  };

  const renderSidebar = (options?: {
    metaBoxIds?: string[];
    sidebarMetaBoxIds?: string[];
    useDefaultSidebarMetaBoxes?: boolean;
  }) => {
    const resolvedMetaBoxes: ResolvedMetaBox[] = [];

    appendRegisteredMetaBoxes(resolvedMetaBoxes, "sidebar", {
      showSidebarActions: options?.useDefaultSidebarMetaBoxes ?? true,
      showSidebarMetadata: options?.useDefaultSidebarMetaBoxes ?? true,
    });

    const pluginMetaBoxes = pickMetaBoxes(
      options?.sidebarMetaBoxIds ?? options?.metaBoxIds,
      sidebarMetaBoxes,
      allMetaBoxesMap,
      options?.useDefaultSidebarMetaBoxes ?? true,
    ).map(buildFieldMetaBox);

    resolvedMetaBoxes.push(...pluginMetaBoxes);

    const sidebarTopSlots = renderPluginSlots("sidebarTop");
    const sidebarBottomSlots = renderPluginSlots("sidebarBottom");

    return (
      <div className="space-y-4">
        {sidebarTopSlots}
        {renderMetaBoxList(resolvedMetaBoxes, "sidebar")}
        {sidebarBottomSlots}
      </div>
    );
  };

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

  if (pluginSingleView && pluginTabs.length > 0) {
    const activeTabDefinition =
      pluginTabs.find((tab) => tab.slug === activeTab) ?? pluginTabs[0];
    const showSidebar = activeTabDefinition?.usesDefaultEditor ?? false;
    const defaultTabOptions = {
      showGeneralPanel: activeTabDefinition?.showGeneralPanel ?? true,
      showCustomFieldsPanel: activeTabDefinition?.showCustomFieldsPanel ?? true,
      metaBoxIds: activeTabDefinition?.metaBoxIds,
      mainMetaBoxIds: activeTabDefinition?.mainMetaBoxIds,
      useDefaultMainMetaBoxes:
        activeTabDefinition?.useDefaultMainMetaBoxes ?? true,
    };
    const sidebarTabOptions = {
      metaBoxIds: activeTabDefinition?.metaBoxIds,
      sidebarMetaBoxIds: activeTabDefinition?.sidebarMetaBoxIds,
      useDefaultSidebarMetaBoxes:
        activeTabDefinition?.useDefaultSidebarMetaBoxes ?? true,
    };
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

    return wrapWithPostTypeProviders(
      <>
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
                  renderDefaultContent(defaultTabOptions)
                ) : activeTabDefinition?.render ? (
                  activeTabDefinition.render(pluginTabProps)
                ) : (
                  <PlaceholderState label={activeTabDefinition?.label ?? ""} />
                )}
              </div>
            </AdminLayoutMain>
            {showSidebar && (
              <AdminLayoutSidebar className="border-l p-4">
                {renderSidebar(sidebarTabOptions)}
              </AdminLayoutSidebar>
            )}
          </AdminLayoutContent>
        </AdminLayout>
        {metaBoxAssetNodes.styles}
        {metaBoxAssetNodes.scripts}
      </>,
    );
  }

  return wrapWithPostTypeProviders(
    <>
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
            {renderSidebar()}
          </AdminLayoutSidebar>
        </AdminLayoutContent>
      </AdminLayout>
      {metaBoxAssetNodes.styles}
      {metaBoxAssetNodes.scripts}
    </>,
  );
}
