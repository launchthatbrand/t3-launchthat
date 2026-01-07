import { v } from "convex/values";

import { api } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { PORTAL_TENANT_SLUG } from "../../constants";

const ECOMMERCE_COMPONENT_TABLES = [
  "launchthat_ecommerce:posts",
  "launchthat_ecommerce:postsMeta",
] as const;

const ECOMMERCE_COMPONENT_NAME = "launchthat_ecommerce";

export const ensureDefaultPagesAndAssign = mutation({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const org = args.organizationId ?? PORTAL_TENANT_SLUG;

    // Ensure component-backed post types exist for Products + Orders.
    await ctx.runMutation(api.core.postTypes.mutations.enableForOrganization, {
      slug: "products",
      organizationId: org,
      definition: {
        name: "Products",
        description: "Storefront products.",
        isPublic: true,
        enableApi: true,
        includeTimestamps: true,
        supports: {
          title: true,
          editor: true,
          excerpt: true,
          featuredImage: true,
          customFields: true,
          postMeta: true,
          taxonomy: true,
        },
        rewrite: {
          hasArchive: true,
          archiveSlug: "store",
          singleSlug: "product",
          withFront: true,
          feeds: false,
          pages: true,
        },
        adminMenu: {
          enabled: true,
          label: "Products",
          slug: "products",
          parent: "ecommerce",
          icon: "ShoppingBag",
          position: 40,
        },
        storageKind: "component",
        storageTables: [...ECOMMERCE_COMPONENT_TABLES],
        storageComponent: ECOMMERCE_COMPONENT_NAME,
      },
    });

    await ctx.runMutation(api.core.postTypes.mutations.enableForOrganization, {
      slug: "orders",
      organizationId: org,
      definition: {
        name: "Orders",
        description: "Customer orders.",
        isPublic: false,
        enableApi: true,
        includeTimestamps: true,
        supports: {
          title: true,
          customFields: true,
          postMeta: true,
        },
        rewrite: {
          hasArchive: false,
        },
        adminMenu: {
          enabled: true,
          label: "Orders",
          slug: "orders",
          parent: "ecommerce",
          icon: "Receipt",
          position: 41,
        },
        storageKind: "component",
        storageTables: [...ECOMMERCE_COMPONENT_TABLES],
        storageComponent: ECOMMERCE_COMPONENT_NAME,
      },
    });

    return { success: true };
  },
});


