"use client";

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export type TaxonomyDoc = Doc<"taxonomies">;
export interface TaxonomyTerm {
  _creationTime: number;
  taxonomyId: Id<"taxonomies">;
  organizationId: Id<"organizations">;
  _id: Id<"taxonomyTerms">;
  name: string;
  slug: string;
  description?: string;
  parentId?: Id<"taxonomyTerms">;
  postTypeSlugs?: string[];
  metadata?: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt?: number;
}

export function useTaxonomies(organizationId?: Id<"organizations">) {
  const result = useQuery(api.core.taxonomies.queries.listTaxonomies, {
    organizationId,
  });
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}

export function useTaxonomyBySlug(
  slug?: string,
  organizationId?: Id<"organizations">,
) {
  const result = useQuery(
    api.core.taxonomies.queries.getTaxonomyBySlug,
    slug ? { slug, organizationId } : "skip",
  );
  if (result === undefined) {
    return undefined;
  }
  return result ?? null;
}

export function useTaxonomyTerms(
  taxonomySlug: string | undefined,
  organizationId: Id<"organizations"> | undefined,
  postTypeSlug?: string,
) {
  const result = useQuery(
    api.core.taxonomies.queries.listTermsByTaxonomy,
    taxonomySlug && organizationId
      ? { taxonomySlug, organizationId, postTypeSlug }
      : "skip",
  );
  if (result === undefined) {
    return undefined;
  }
  return result;
}

export function useCreateTaxonomy() {
  return useMutation(api.core.taxonomies.mutations.createTaxonomy);
}

export function useUpdateTaxonomy() {
  return useMutation(api.core.taxonomies.mutations.updateTaxonomy);
}

export function useDeleteTaxonomy() {
  return useMutation(api.core.taxonomies.mutations.deleteTaxonomy);
}

export function useCreateTaxonomyTerm() {
  return useMutation(api.core.taxonomies.mutations.createTerm);
}

export function useUpdateTaxonomyTerm() {
  return useMutation(api.core.taxonomies.mutations.updateTerm);
}

export function useDeleteTaxonomyTerm() {
  return useMutation(api.core.taxonomies.mutations.deleteTerm);
}

export function useEnsureBuiltInTaxonomies() {
  return useMutation(api.core.taxonomies.mutations.ensureBuiltInTaxonomies);
}
