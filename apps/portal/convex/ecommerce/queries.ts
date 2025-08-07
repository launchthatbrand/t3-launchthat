/**
 * Ecommerce Queries
 *
 * This file consolidates all query functions from ecommerce subdirectories
 * to enable organized access via api.ecommerce.queries.*
 */

// Products queries
export { listProducts, getProduct, getProductCount } from "./products/queries";

// Categories queries
export {
  getProductCategories,
  getCategoryTree,
  getCategory,
  getCategoryBySlug,
  getCategoryBreadcrumbs,
  getCategoryCount,
} from "./categories/queries";

// Orders queries
export { listOrders, getOrder, getOrdersCount } from "./orders/queries";

// Balances queries
export { getTransferWithOrders, getBankAccount } from "./balances/queries";

// Cart queries - if any exist
// export {} from "./cart/index";

// Checkout queries - if any exist
// export {} from "./checkout/index";
