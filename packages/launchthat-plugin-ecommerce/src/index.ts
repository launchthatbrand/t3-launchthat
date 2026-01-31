import { ecommercePlugin } from "./plugin";

export {
  PLUGIN_ID,
  type PluginId,
  createEcommercePluginDefinition,
  type CreateEcommercePluginDefinitionOptions,
  ecommercePlugin,
} from "./plugin";
export { getEcommercePageTemplates } from "./frontend/pageTemplates";
export { CheckoutClient } from "./frontend/ui/checkout/CheckoutClient";
export { EcommerceCouponsPage } from "./admin/pages/EcommerceCouponsPage";
export { EcommerceOrdersPage } from "./admin/pages/EcommerceOrdersPage";
export { EcommerceProductsPage } from "./admin/pages/EcommerceProductsPage";
export * from "./payments/registry";
export default ecommercePlugin;
