"use client";

import type {
  CommerceClient,
  CommerceHooks,
  UseMutationHook,
  UseQueryHook,
} from "launchthat-plugin-commerce";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { CommerceProvider } from "launchthat-plugin-commerce";

import { useConvexUser } from "~/hooks/useConvexUser";

export function PortalCommerceProvider({ children }: { children: ReactNode }) {
  const { convexId } = useConvexUser();

  const hooks: CommerceHooks = useMemo(() => {
    const useQueryHook: UseQueryHook = (queryRef, args) => {
      return useQuery(queryRef as any, args as any) as any;
    };

    const useMutationHook: UseMutationHook = (mutationRef) => {
      return useMutation(mutationRef as any) as any;
    };

    return {
      useQuery: useQueryHook,
      useMutation: useMutationHook,
      useAuth: () => ({ userId: convexId ?? null }),
    };
  }, [convexId]);

  const client: CommerceClient = useMemo(() => {
    // Provide a stable, minimal API surface that matches what `launchthat-plugin-commerce`
    // components expect (`commerceApi.cart.*`, `commerceApi.core.options.*`, etc).
    const mappedApi: Record<string, unknown> = {
      cart: {
        getCart: api.plugins.commerce.cart.queries.getCart,
        addToCart: api.plugins.commerce.cart.mutations.addToCart,
        addToGuestCart: api.plugins.commerce.cart.mutations.addToGuestCart,
        removeFromCart: api.plugins.commerce.cart.mutations.removeFromCart,
        removeFromGuestCart: api.plugins.commerce.cart.mutations.removeFromGuestCart,
        updateCartItemQuantity:
          api.plugins.commerce.cart.mutations.updateCartItemQuantity,
        clearCart: api.plugins.commerce.cart.mutations.clearCart,
      },
      core: api.core,
      integrations: api.integrations,
      posts: {
        getAllPosts: api.plugins.commerce.getAllPosts,
        getPostById: api.plugins.commerce.getPostById,
        getPostBySlug: api.plugins.commerce.getPostBySlug,
        getPostMeta: api.plugins.commerce.getPostMeta,
        searchPosts: api.plugins.commerce.searchPosts,
        getPostTags: api.plugins.commerce.getPostTags,
        getPostCategories: api.plugins.commerce.getPostCategories,
      },
      products: {
        listProducts: api.plugins.commerce.products.queries.listProducts,
        getProductById: api.plugins.commerce.products.queries.getProductById,
      },
      commerce: {
        ensureDefaultPagesAndAssign:
          api.plugins.commerce.mutations.ensureDefaultPagesAndAssign,
      },
      chargebacks: {
        evidence: {
          getChargebackEvidence:
            api.plugins.commerce.chargebacks.evidence.queries.getChargebackEvidence,
          getEvidenceSummary:
            api.plugins.commerce.chargebacks.evidence.queries.getEvidenceSummary,
          createEvidence:
            api.plugins.commerce.chargebacks.evidence.mutations.createEvidence,
          deleteEvidence:
            api.plugins.commerce.chargebacks.evidence.mutations.deleteEvidence,
        },
      },
    };

    return { api: mappedApi, hooks };
  }, [hooks]);

  return <CommerceProvider value={client}>{children}</CommerceProvider>;
}
