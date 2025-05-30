import type { SanitizedCollectionConfig } from "@convexcms/core";

export type DefaultListViewProps = {
  collectionSlug: SanitizedCollectionConfig["slug"];
  listSearchableFields: SanitizedCollectionConfig["admin"]["listSearchableFields"];
};

export type ListIndexProps = {
  collection: SanitizedCollectionConfig;
};
