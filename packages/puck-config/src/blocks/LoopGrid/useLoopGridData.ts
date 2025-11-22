import type { LoopGridItem, LoopGridProps, UseLoopGridDataResult } from "./types";
import { useEffect, useMemo, useRef, useState } from "react";

import { dataSourceRegistry } from "../../plugins/dataSourceRegistry";

const normalizeItems = (payload: unknown): LoopGridItem[] => {
  if (Array.isArray(payload)) {
    return payload as LoopGridItem[];
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as any).items)) {
    return (payload as { items: LoopGridItem[] }).items;
  }
  return [];
};

export const useLoopGridData = (props: LoopGridProps): UseLoopGridDataResult => {
  const [items, setItems] = useState<LoopGridItem[]>(() => normalizeItems(props.items));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);

  const rawConvexSettings = (props as any)?.convex_settings ?? {};
  const normalizedPostTypeSlug = useMemo(() => {
    const slug = rawConvexSettings.postTypeSlug;
    if (typeof slug === "string") {
      return slug;
    }
    if (slug?.value) {
      return slug.value;
    }
    return slug?.title ?? "";
  }, [rawConvexSettings.postTypeSlug]);

  const normalizedLimit = useMemo(() => {
    const value = rawConvexSettings.limit;
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, [rawConvexSettings.limit]);

  const fetchSignature = useMemo(() => {
    return JSON.stringify({
      dataSource: props.dataSource ?? "",
      postTypeSlug: normalizedPostTypeSlug ?? "",
      limit: normalizedLimit ?? null,
    });
  }, [props.dataSource, normalizedPostTypeSlug, normalizedLimit]);

  const providerInputs = useMemo(() => {
    const { puck: _puck, ...rest } = props;
    return rest;
  }, [
    props.dataSource,
    props.cardType,
    props.templateId,
    props.columns,
    props.gap,
    props.enableViewToggle,
    props.items,
    normalizedPostTypeSlug,
    normalizedLimit,
  ]);

  const provider = props.dataSource ? dataSourceRegistry.get(props.dataSource) : undefined;

  useEffect(() => {
    let cancelled = false;

    if (!props.dataSource) {
      setItems(normalizeItems(props.items));
      setError(null);
      setLoading(false);
      lastFetchKeyRef.current = null;
      return () => {};
    }

    if (!provider || typeof provider.fetchData !== "function") {
      setError(`Unknown data source: ${props.dataSource}`);
      setItems([]);
      setLoading(false);
      lastFetchKeyRef.current = null;
      return () => {};
    }

    if (fetchSignature === lastFetchKeyRef.current) {
      return () => {};
    }

    setLoading(true);
    Promise.resolve(provider.fetchData(providerInputs as any))
      .then((result) => {
        if (cancelled) return;
        const normalized =
          provider?.normalizeData?.(result, providerInputs as LoopGridProps) ??
          normalizeItems(result);
        setItems(normalized);
        setError(null);
        lastFetchKeyRef.current = fetchSignature;
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    fetchSignature,
    provider,
    providerInputs,
    props.dataSource,
    props.items,
  ]);

  return {
    items,
    loading,
    error,
  };
};

