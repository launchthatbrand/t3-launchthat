import { useEffect, useState } from "react";

import type { HelpdeskArticle } from "../supportChat/types";

interface UseHelpdeskArticlesResult {
  articles: HelpdeskArticle[];
  isLoading: boolean;
}

export const useHelpdeskArticles = (
  apiPath: string,
  organizationId: string,
  limit = 6,
): UseHelpdeskArticlesResult => {
  const [articles, setArticles] = useState<HelpdeskArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!organizationId || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    async function loadArticles() {
      setIsLoading(true);
      try {
        const url = new URL(apiPath, window.location.origin);
        url.searchParams.set("organizationId", organizationId);
        url.searchParams.set("view", "helpdesk");
        url.searchParams.set("limit", String(limit));
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error("Failed to load helpdesk articles");
        }
        const data: { articles?: HelpdeskArticle[] } = await response.json();
        if (!cancelled) {
          setArticles(data.articles ?? []);
        }
      } catch (error) {
        console.error("[support-chat] failed to load helpdesk articles", error);
        if (!cancelled) {
          setArticles([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, [apiPath, organizationId, limit]);

  return { articles, isLoading };
};
