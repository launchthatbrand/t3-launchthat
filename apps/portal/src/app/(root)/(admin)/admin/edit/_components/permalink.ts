"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { generateSlugFromTitle } from "@/lib/blog";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";

type PostDoc = Doc<"posts">;
type PostTypeDoc = Doc<"postTypes">;

export type PermalinkStructure =
  | "plain"
  | "day-name"
  | "month-name"
  | "numeric"
  | "post-name"
  | "custom";

export const PERMALINK_STRUCTURE_VALUES: readonly PermalinkStructure[] = [
  "plain",
  "day-name",
  "month-name",
  "numeric",
  "post-name",
  "custom",
];

export interface PermalinkSettings {
  structure: PermalinkStructure;
  customStructure: string;
  categoryBase: string;
  tagBase: string;
  trailingSlash: boolean;
}

export const defaultPermalinkSettings: PermalinkSettings = {
  structure: "post-name",
  customStructure: "/%category%/%postname%/",
  categoryBase: "",
  tagBase: "",
  trailingSlash: true,
};

const CONFIGURED_SITE_URL = "";

export const isPermalinkSettingsValue = (
  value: unknown,
): value is Partial<PermalinkSettings> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (
    record.structure &&
    (typeof record.structure !== "string" ||
      !PERMALINK_STRUCTURE_VALUES.includes(
        record.structure as PermalinkStructure,
      ))
  ) {
    return false;
  }
  return true;
};

export const buildPermalink = (
  post: PostDoc,
  settings: PermalinkSettings,
  postType?: PostTypeDoc | null,
) => {
  if (postType?.rewrite?.singleSlug) {
    const canonicalPath = getCanonicalPostPath(
      post,
      postType,
      settings.trailingSlash,
    );
    const baseUrl = getFrontendBaseUrl();
    return baseUrl ? `${baseUrl}${canonicalPath}` : canonicalPath;
  }
  if (settings.structure === "plain") {
    return `${getFrontendBaseUrl()}/?p=${post._id}`;
  }

  const structurePattern = (() => {
    switch (settings.structure) {
      case "day-name":
        return "/%year%/%monthnum%/%day%/%postname%/";
      case "month-name":
        return "/%year%/%monthnum%/%postname%/";
      case "numeric":
        return "/archives/%post_id%/";
      case "custom":
        return settings.customStructure || "/%postname%/";
      case "post-name":
      default:
        return "/%postname%/";
    }
  })();

  const interpolated = interpolatePattern(structurePattern, post);
  const normalized = normalizePath(interpolated, settings.trailingSlash);
  const baseUrl = getFrontendBaseUrl();
  return baseUrl ? `${baseUrl}${normalized}` : normalized;
};

const interpolatePattern = (pattern: string, post: PostDoc) => {
  const date = new Date(post.createdAt ?? Date.now());
  const pad = (value: number, length = 2) =>
    value.toString().padStart(length, "0");
  const slug =
    post.slug ??
    (post.title ? generateSlugFromTitle(post.title) : post._id) ??
    "post";
  const replacements: Record<string, string> = {
    "%year%": date.getFullYear().toString(),
    "%monthnum%": pad(date.getMonth() + 1),
    "%day%": pad(date.getDate()),
    "%hour%": pad(date.getHours()),
    "%minute%": pad(date.getMinutes()),
    "%second%": pad(date.getSeconds()),
    "%post_id%": post._id,
    "%postname%": slug,
    "%category%": post.category ?? "uncategorized",
    "%author%": post.authorId ?? "author",
  };

  return ensureLeadingSlash(
    pattern.replace(/%[^%]+%/g, (token) => replacements[token] ?? token),
  );
};

export const normalizePath = (path: string, trailingSlash: boolean) => {
  if (!trailingSlash) {
    return path.replace(/\/+$/, "") || "/";
  }
  return path.endsWith("/") ? path : `${path}/`;
};

export const ensureLeadingSlash = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

export const getFrontendBaseUrl = () => {
  if (CONFIGURED_SITE_URL) return CONFIGURED_SITE_URL;
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return "";
};

