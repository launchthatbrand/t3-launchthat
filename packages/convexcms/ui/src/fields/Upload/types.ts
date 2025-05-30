import type { PaginatedDocs } from "@convexcms/core";

export type PopulateDocs = (
  ids: (number | string)[],
  relatedCollectionSlug: string,
) => Promise<null | PaginatedDocs>;

export type ReloadDoc = (
  docID: number | string,
  collectionSlug: string,
) => Promise<void>;
