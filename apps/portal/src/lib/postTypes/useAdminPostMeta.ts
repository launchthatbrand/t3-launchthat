import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import type { AdminMetaEntry, AdminMetaMap } from "./metaTypes";

type StorageKind = "posts" | "custom" | "component";

const normalizeToMap = (entries: AdminMetaEntry[] | undefined): AdminMetaMap => {
  if (!entries) {
    return {};
  }

  const map: AdminMetaMap = {};
  for (const entry of entries) {
    const raw = entry.value ?? "";
    const normalized =
      typeof raw === "string" ||
      typeof raw === "number" ||
      typeof raw === "boolean" ||
      raw === null
        ? (raw as AdminMetaMap[string])
        : (JSON.stringify(raw) as AdminMetaMap[string]);
    map[entry.key] = normalized;
  }
  return map;
};

const normalizeCoreMeta = (
  meta: Doc<"postsMeta">[] | undefined,
): AdminMetaEntry[] | undefined => {
  if (!meta) return meta;
  return meta.map((row) => ({ key: row.key, value: row.value ?? null }));
};

const normalizeComponentMeta = (
  meta: { key: string; value: unknown }[] | null | undefined,
): AdminMetaEntry[] | undefined => {
  if (meta === undefined) return undefined;
  if (meta === null) return [];
  return meta.map((row) => ({ key: row.key, value: row.value ?? null }));
};

interface Params {
  postId?: string;
  postTypeSlug: string;
  postType?: Doc<"postTypes"> | null;
  organizationId?: Id<"organizations">;
  storageKind: StorageKind;
}

export const useAdminPostMeta = (params: Params): {
  metaEntries: AdminMetaEntry[] | undefined;
  metaMap: AdminMetaMap;
} => {
  const storageComponent =
    typeof (params.postType as any)?.storageComponent === "string"
      ? ((params.postType as any).storageComponent as string)
      : undefined;

  // Core posts + custom tables currently share the same meta API in the portal.
  const shouldUseCoreMeta =
    params.storageKind === "posts" || params.storageKind === "custom";

  const coreArgs =
    params.postId && params.organizationId
      ? ({
          postId: params.postId,
          organizationId: params.organizationId,
          postTypeSlug: params.postTypeSlug,
        } as const)
      : "skip";

  const coreMeta = useQuery(
    api.core.posts.postMeta.getPostMeta,
    shouldUseCoreMeta ? coreArgs : "skip",
  ) as Doc<"postsMeta">[] | undefined;

  const crmContactMeta = useQuery(
    (api as any).plugins.crm.contacts.queries.getContactMeta,
    params.storageKind === "custom" && params.postTypeSlug === "contact" && params.postId
      ? { contactId: params.postId }
      : "skip",
  ) as { key: string; value: unknown }[] | null | undefined;

  // Component meta: we currently have explicit public query surfaces for commerce + lms.
  const componentArgs = params.postId
    ? ({
        postId: params.postId as unknown as string,
        organizationId: params.organizationId
          ? (params.organizationId as unknown as string)
          : undefined,
      } as const)
    : "skip";

  const commerceMeta = useQuery(
    api.plugins.commerce.queries.getPostMeta,
    params.storageKind === "component" &&
      storageComponent === "launchthat_ecommerce"
      ? (componentArgs as any)
      : "skip",
  ) as { key: string; value: unknown }[] | null | undefined;

  const lmsMeta = useQuery(
    api.plugins.lms.posts.queries.getPostMeta,
    params.storageKind === "component" && storageComponent === "launchthat_lms"
      ? (componentArgs as any)
      : "skip",
  ) as { key: string; value: unknown }[] | null | undefined;

  const supportMeta = useQuery(
    api.plugins.support.posts.queries.getPostMeta,
    params.storageKind === "component" &&
      storageComponent === "launchthat_support"
      ? (componentArgs as any)
      : "skip",
  ) as { key: string; value: unknown }[] | null | undefined;

  const metaEntries = useMemo<AdminMetaEntry[] | undefined>(() => {
    if (params.storageKind === "custom" && params.postTypeSlug === "contact") {
      return normalizeComponentMeta(crmContactMeta);
    }

    if (shouldUseCoreMeta) {
      return normalizeCoreMeta(coreMeta);
    }

    if (params.storageKind !== "component") {
      return [];
    }

    if (storageComponent === "launchthat_ecommerce") {
      return normalizeComponentMeta(commerceMeta);
    }

    if (storageComponent === "launchthat_lms") {
      return normalizeComponentMeta(lmsMeta);
    }

    if (storageComponent === "launchthat_support") {
      return normalizeComponentMeta(supportMeta);
    }

    // Unknown component: return empty.
    if (params.postId) {
      return [];
    }
    return undefined;
  }, [
    commerceMeta,
    coreMeta,
    crmContactMeta,
    lmsMeta,
    supportMeta,
    params.postId,
    params.storageKind,
    params.postTypeSlug,
    shouldUseCoreMeta,
    storageComponent,
  ]);

  const metaMap = useMemo(() => normalizeToMap(metaEntries), [metaEntries]);

  return { metaEntries, metaMap };
};


