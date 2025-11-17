"use client";

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export type TaxonomyDoc = Doc<"taxonomies">;
export interface TaxonomyTerm {
  taxonomyId: Id<"taxonomies">;
  source: "categories" | "tags" | "custom";
  _id: Id<"categories"> | Id<"tags"> | Id<"taxonomyTerms">;
  name: string;
  slug: string;
  description?: string;
  parentId?: Id<"categories"> | Id<"taxonomyTerms"> | null;
  metadata?: Record<string, string | number | boolean>;
}

export function useTaxonomies() {
  const result = useQuery(api.core.taxonomies.queries.listTaxonomies, {});
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}

export function useTaxonomyBySlug(slug?: string) {
  const result = useQuery(
    api.core.taxonomies.queries.getTaxonomyBySlug,
    slug ? { slug } : "skip",
  );
  if (result === undefined) {
    return undefined;
  }
  return result ?? null;
}

export function useTaxonomyTerms(slug?: string) {
  const result = useQuery(
    api.core.taxonomies.queries.listTermsByTaxonomy,
    slug ? { slug } : "skip",
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
