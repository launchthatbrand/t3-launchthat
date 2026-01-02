"use client";

import type { PluginDefinition } from "~/lib/plugins/types";
import { pluginDefinitions } from "~/lib/plugins/definitions";

export interface PostStatusOption {
  value: string;
  label: string;
  description?: string;
}

const CORE_STATUS_OPTIONS: PostStatusOption[] = [
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
];

const normalizePostTypeSlugs = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const slugs = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return slugs.length > 0 ? slugs : null;
};

export const getPostStatusOptionsForPostType = (
  postTypeSlug: string,
  plugins: PluginDefinition[] = pluginDefinitions,
): PostStatusOption[] => {
  const out: PostStatusOption[] = [...CORE_STATUS_OPTIONS];
  const seen = new Set(out.map((s) => s.value));

  plugins.forEach((plugin) => {
    const statuses = (plugin as unknown as { postStatuses?: unknown })
      .postStatuses;
    if (!Array.isArray(statuses)) return;

    statuses.forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const record = raw as Record<string, unknown>;
      const value = typeof record.value === "string" ? record.value.trim() : "";
      const label = typeof record.label === "string" ? record.label.trim() : "";
      if (!value || !label) return;

      const appliesTo = normalizePostTypeSlugs(record.postTypeSlugs);
      if (appliesTo && !appliesTo.includes(postTypeSlug)) return;

      if (seen.has(value)) return;
      seen.add(value);
      out.push({
        value,
        label,
        description:
          typeof record.description === "string"
            ? record.description
            : undefined,
      });
    });
  });

  return out;
};







