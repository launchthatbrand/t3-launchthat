import type { PluginDefinition } from "launchthat-plugin-core";

export const PLUGIN_ID = "ecommerce" as const;
export type PluginId = typeof PLUGIN_ID;

const ECOMMERCE_COMPONENT_TABLES = [
  "launchthat_ecommerce:posts",
  "launchthat_ecommerce:postsMeta",
] as const;

export type CreateEcommercePluginDefinitionOptions = Record<string, never>;

const defaultOptions: CreateEcommercePluginDefinitionOptions = {};

export const createEcommercePluginDefinition = (
  _options: CreateEcommercePluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Ecommerce",
  description: "Storefront products and orders.",
  longDescription:
    "Adds a component-scoped ecommerce content layer (products + orders) backed by Convex Components.",
  features: ["Products post type", "Orders post type"],
  adminMenus: [
    {
      label: "Ecommerce",
      slug: "ecommerce",
      icon: "ShoppingCart",
      position: 40,
      group: "ecommerce",
    },
  ],
  postTypes: [
    {
      name: "Products",
      slug: "products",
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
      storageComponent: "launchthat_ecommerce",
    },
    {
      name: "Orders",
      slug: "orders",
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
      storageComponent: "launchthat_ecommerce",
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
});

export const ecommercePlugin: PluginDefinition =
  createEcommercePluginDefinition();
