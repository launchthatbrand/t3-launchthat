/**
 * Ecommerce Schema
 *
 * This file consolidates all schema definitions from ecommerce subdirectories
 */

// Import and re-export the main ecommerce schema as default
import ecommerceSchemaDefault from "./schema/index";

export default ecommerceSchemaDefault;

// Re-export the main ecommerce schema with a named export too
export { default as ecommerceSchema } from "./schema/index";

// Re-export individual schema components for specific usage
export * from "./schema/cartSchema";
export * from "./schema/ordersSchema";
export * from "./schema/productsSchema";
export * from "./schema/categoriesSchema";
export * from "./schema/balancesSchema";
export * from "./schema/chargebacksSchema";
export * from "./schema/checkoutsSchema";
export * from "./schema/couponsSchema";
export * from "./schema/paymentMethodsSchema";
export * from "./schema/productReviewsSchema";
export * from "./schema/shippingMethodsSchema";
export * from "./schema/subscriptionsSchema";
export * from "./schema/taxRatesSchema";
export * from "./schema/transactionsSchema";
export * from "./schema/wishlistSchema";
