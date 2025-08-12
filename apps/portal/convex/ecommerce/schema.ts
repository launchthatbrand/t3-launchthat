import { defineSchema } from "convex/server";

import { balancesSchema } from "./balances/schema";
import { cartSchema } from "./cart/schema";
import { categoriesSchema } from "./categories/schema";
import { chargebacksSchemaExport as chargebacksSchema } from "./chargebacks/schema";
import { couponsSchema } from "./coupons/schema";
import { funnelsSchema } from "./funnels/schema";
import { ordersSchema } from "./orders/schema";
import { paymentMethodsSchema } from "./payments/schema";
import { productReviewsSchema } from "./productReviews/schema";
import { productsSchema } from "./products/schema";
import { shippingMethodsSchema } from "./shippingMethods/schema";
import { subscriptionsSchema } from "./subscriptions/schema";
import { taxRatesSchema } from "./taxRates/schema";
import { transactionsSchema } from "./transactions/schema";
import { wishlistSchema } from "./wishlist/schema";

// Export as a proper Convex schema using defineSchema
export default defineSchema({
  ...cartSchema,
  ...productsSchema,
  ...categoriesSchema,
  ...ordersSchema,
  ...transactionsSchema,
  ...subscriptionsSchema,
  ...wishlistSchema,
  ...productReviewsSchema,
  ...paymentMethodsSchema,
  ...shippingMethodsSchema,
  ...taxRatesSchema,
  ...couponsSchema,
  ...funnelsSchema,
  ...chargebacksSchema,
  ...balancesSchema,
});

// Keep the original export for backward compatibility
// export const ecommerceSchema = {
//   ...cartSchema,
//   ...productsSchema,
//   ...categoriesSchema,
//   ...ordersSchema,
//   ...transactionsSchema,
//   ...subscriptionsSchema,
//   ...wishlistSchema,
//   ...productReviewsSchema,
//   ...paymentMethodsSchema,
//   ...shippingMethodsSchema,
//   ...taxRatesSchema,
//   ...couponsSchema,
//   ...checkoutsSchema,
//   ...chargebacksSchema,
//   ...balancesSchema,
// };
