"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { PluginSettingComponentProps } from "~/lib/plugins/types";
import { SupportSystemClient } from "~/app/(root)/(admin)/admin/support/[[...segments]]/SupportSystemClient";

type SupportPluginPageSlug =
  | "dashboard"
  | "conversations"
  | "settings"
  | "helpdesk-articles";

interface SupportPluginPageProps extends PluginSettingComponentProps {
  page: SupportPluginPageSlug;
}

const pluginHrefForSlug = (slug: string) => {
  if (!slug || slug === "dashboard") {
    return "/admin/edit?plugin=support&page=dashboard";
  }
  return `/admin/edit?plugin=support&page=${slug}`;
};

export function SupportPluginPage({ page }: SupportPluginPageProps) {
  const nextSearchParams = useSearchParams();

  const searchParamsObject = useMemo(() => {
    const entries = Array.from(nextSearchParams.entries());
    return entries.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }, [nextSearchParams]);

  const params = useMemo(() => {
    if (page === "dashboard") {
      return { segments: [] };
    }
    if (page === "helpdesk-articles") {
      return { segments: ["articles"] };
    }
    return {
      segments: [page],
    };
  }, [page]);

  const buildNavHref = useMemo(
    () => (slug: string) => {
      if (!slug || slug === "conversations") {
        return pluginHrefForSlug("conversations");
      }
      if (slug === "articles" || slug === "helpdesk-articles") {
        return pluginHrefForSlug("helpdesk-articles");
      }
      if (slug === "") {
        return pluginHrefForSlug("dashboard");
      }
      if (slug === "settings") {
        return pluginHrefForSlug("settings");
      }
      return slug ? `/admin/support/${slug}` : "/admin/support";
    },
    [],
  );

  return (
    <div className="bg-card rounded-md border">
      <SupportSystemClient
        params={params}
        searchParams={searchParamsObject}
        buildNavHref={buildNavHref}
      />
    </div>
  );
}
