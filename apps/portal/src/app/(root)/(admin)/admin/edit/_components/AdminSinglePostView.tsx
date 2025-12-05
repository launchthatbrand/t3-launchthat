"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  PenSquare,
  Pencil,
  Save,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@acme/ui/card";
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type {
  PluginMetaBoxRendererProps,
  PluginPostSingleViewConfig,
  PluginSingleViewTabDefinition,
} from "~/lib/plugins/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  createLexicalStateFromPlainText,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import {
  generateSlugFromTitle,
  useCreatePost,
  useUpdatePost,
} from "@/lib/blog";
import {
  getFrontendProvidersForPostType,
  wrapWithFrontendProviders,
} from "~/lib/plugins/frontendProviders";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@acme/ui/button";
import { Editor } from "~/components/blocks/editor-x/editor";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { PlaceholderState } from "./PlaceholderState";
import type { ReactNode } from "react";
import type { SerializedEditorState } from "lexical";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import { formatDistanceToNow } from "date-fns";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { getFrontendBaseUrl } from "./permalink";
import { getTenantScopedPageIdentifier } from "~/utils/pageIdentifier";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { useMetaBoxState } from "../_state/useMetaBoxState";
import { usePostTypeFields } from "../../settings/post-types/_api/postTypes";
import { useQuery } from "convex/react";

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

const buildCustomFieldControlId = (fieldId: string, suffix?: string) =>
  `custom-field-${fieldId}${suffix ? `-${suffix}` : ""}`;

interface NormalizedMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: "main" | "sidebar";
  priority: number;
  fields: Doc<"postTypeFields">[];
  rendererKey?: string | null;
}

interface ResolvedMetaBox {
  id: string;
  title: string;
  description?: string | null;
  location: "main" | "sidebar";
  priority: number;
  render: () => ReactNode;
}

type ExternalMetaBoxRenderer = (props: PluginMetaBoxRendererProps) => ReactNode;

const pickMetaBoxes = (
  allowedIds: string[] | undefined,
  fallback: NormalizedMetaBox[],
  registry: Record<string, NormalizedMetaBox>,
  useFallback: boolean,
) => {
  if (allowedIds === undefined) {
    return useFallback ? fallback : [];
  }
  if (allowedIds.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const selections: NormalizedMetaBox[] = [];
  for (const id of allowedIds) {
    if (seen.has(id)) continue;
    const resolved = registry[id] ?? fallback.find((box) => box.id === id);
    if (resolved) {
      selections.push(resolved);
      seen.add(id);
    }
  }
  return selections;
};

const sortMetaBoxes = <T extends { priority: number; title: string }>(
  metaBoxes: T[],
) =>
  [...metaBoxes].sort((a, b) =>
    a.priority === b.priority
      ? a.title.localeCompare(b.title)
      : a.priority - b.priority,
  );

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
  const pluginTabs: PluginSingleViewTabDefinition[] =
    pluginSingleView?.config.tabs ?? [];
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

  const frontendProviders = useMemo(
    () => getFrontendProvidersForPostType(slug),
    [slug],
  );

  const wrapWithPostTypeProviders = useCallback(
    (node: ReactNode) => wrapWithFrontendProviders(node, frontendProviders),
    [frontendProviders],
  );

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

  const fieldRegistry = useMemo(() => {
    const map = new Map<string, Doc<"postTypeFields">>();
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
      const fields: Doc<"postTypeFields">[] = [];
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
      field: Doc<"postTypeFields">,
      options?: {
        idSuffix?: string;
      },
    ) => {
      const controlId = buildCustomFieldControlId(field._id, options?.idSuffix);
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

  const renderFieldBlock = useCallback(
    (
      field: Doc<"postTypeFields">,
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
            <span className="text-muted-foreground text-xs tracking-wide uppercase">
              {field.type}
            </span>
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
                handleCustomFieldChange(fieldKey, value),
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

    if (shouldShowGeneral) {
      resolvedMetaBoxes.push({
        id: "core-general",
        title: "General",
        description: `Fundamental settings for this ${headerLabel} entry.`,
        location: "main",
        priority: 0,
        render: () => (
          <>
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
          </>
        ),
      });
    }

    if (shouldShowCustomFields) {
      resolvedMetaBoxes.push({
        id: "core-custom-fields",
        title: "Custom Fields",
        description:
          "Fields defined in Post Type settings are stored as post_meta records.",
        location: "main",
        priority: 90,
        render: () => {
          if (postTypeFieldsLoading) {
            return (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching the latest custom fields for this post type.
              </div>
            );
          }

          if (unassignedFields.length === 0) {
            return (
              <div className="space-y-3">
                <Button variant="outline" asChild>
                  <Link
                    href={`/admin/settings/post-types?tab=fields&post_type=${slug}`}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Configure Fields
                  </Link>
                </Button>
                <p className="text-muted-foreground text-sm">
                  Custom fields mirror WordPress&apos; post_meta table so
                  plugins can rely on a familiar contract.
                </p>
              </div>
            );
          }

          return (
            <>
              {unassignedFields.map((field) => (
                <div
                  key={field._id}
                  className="space-y-2 rounded-md border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor={buildCustomFieldControlId(field._id)}>
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
                  <Label htmlFor="custom-field-puck-data">
                    Puck Data (JSON)
                  </Label>
                  <span className="text-muted-foreground text-xs tracking-wide uppercase">
                    system
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Read-only representation of the stored Puck layout. Updates
                  are managed automatically when using the Puck editor.
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
            </>
          );
        },
      });
    }

    resolvedMetaBoxes.push(...visibleFieldMetaBoxes);

    return (
      <div className="space-y-6">
        {saveError && <p className="text-destructive text-sm">{saveError}</p>}
        {renderMetaBoxList(resolvedMetaBoxes, "main")}
      </div>
    );
  };

  const renderSidebar = (options?: {
    metaBoxIds?: string[];
    sidebarMetaBoxIds?: string[];
    useDefaultSidebarMetaBoxes?: boolean;
  }) => {
    const resolvedMetaBoxes: ResolvedMetaBox[] = [
      {
        id: "core-actions",
        title: "Actions",
        description: "Save, duplicate, or preview this entry.",
        location: "sidebar",
        priority: 0,
        render: () => (
          <div className="space-y-3">
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
          </div>
        ),
      },
      {
        id: "core-metadata",
        title: "Metadata",
        description: "High-level attributes for this entry.",
        location: "sidebar",
        priority: 10,
        render: () => (
          <div className="text-muted-foreground space-y-3 text-sm">
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
          </div>
        ),
      },
    ];

    const pluginMetaBoxes = pickMetaBoxes(
      options?.sidebarMetaBoxIds ?? options?.metaBoxIds,
      sidebarMetaBoxes,
      allMetaBoxesMap,
      options?.useDefaultSidebarMetaBoxes ?? true,
    ).map(buildFieldMetaBox);

    resolvedMetaBoxes.push(...pluginMetaBoxes);

    return renderMetaBoxList(resolvedMetaBoxes, "sidebar");
  };

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
      </AdminLayout>,
    );
  }

  return wrapWithPostTypeProviders(
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
    </AdminLayout>,
  );
}
