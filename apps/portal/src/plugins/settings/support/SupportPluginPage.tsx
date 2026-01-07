"use client";

import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SupportSystemClient } from "~/app/(root)/(admin)/admin/support/[[...segments]]/SupportSystemClient";

const PAGE_TO_NAV_SLUG = {
  dashboard: "",
  conversations: "conversations",
  "helpdesk-articles": "articles",
  settings: "settings",
} as const;

const NAV_SLUG_TO_PAGE = {
  "": "dashboard",
  conversations: "conversations",
  articles: "helpdesk-articles",
  settings: "settings",
};

export type SupportPluginPageSlug = keyof typeof PAGE_TO_NAV_SLUG;

interface SupportPluginPageProps extends PluginSettingComponentProps {
  page: SupportPluginPageSlug;
}

export const SupportPluginPage = ({ page }: SupportPluginPageProps) => {
  const searchParams = useSearchParams();

  const activeNavSlug = PAGE_TO_NAV_SLUG[page] ?? "";
  const segments = activeNavSlug ? [activeNavSlug] : [];

  const searchParamsObject = useMemo(() => {
    if (!searchParams) {
      return undefined;
    }
    const entries: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }, [searchParams]);

  const buildNavHref = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString() ?? "");
      params.set("plugin", "support");
      const targetPage =
        NAV_SLUG_TO_PAGE[slug as keyof typeof NAV_SLUG_TO_PAGE] ?? "dashboard";
      params.set("page", targetPage);
      if (targetPage !== "settings") {
        params.delete("tab");
      }
      if (slug !== "conversations") {
        params.delete("sessionId");
      }
      return `/admin/edit?${params.toString()}`;
    },
    [searchParams],
  );

  return (
    <SupportSystemClient
      params={{ segments }}
      searchParams={searchParamsObject}
      buildNavHref={buildNavHref}
    />
  );
};
