export type EntityStatus = string;

export type EntityRecord = {
  id: string;
  postTypeSlug: string;
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  status?: EntityStatus;
  category?: string | null;
  tags?: string[] | null;
  featuredImageUrl?: string | null;
  organizationId?: string | null;
  authorId?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  meta?: Record<string, unknown> | null;
};

export type EntityFilters = {
  status?: EntityStatus;
  category?: string;
  authorId?: string;
  limit?: number;
  slug?: string;
};

export type EntitySaveInput = {
  title: string;
  content?: string;
  excerpt?: string;
  slug: string;
  status: EntityStatus;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  meta?: Record<string, string | number | boolean | null>;
  organizationId?: string;
};

export type EntityFiltersInput = {
  status?: EntityStatus;
  category?: string;
  authorId?: string;
  limit?: number;
  slug?: string;
};
