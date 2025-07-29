import { defineSchema } from "convex/server";

import { balancesSchema } from "./balancesSchema";
import { cartSchema } from "./cartSchema";
import { categoriesSchema } from "./categoriesSchema";
import { chargebacksSchema } from "./chargebacksSchema";
import { checkoutsSchema } from "./checkoutsSchema";
import { couponsSchema } from "./couponsSchema";
import { ordersSchema } from "./ordersSchema";
import { paymentMethodsSchema } from "./paymentMethodsSchema";
import { productReviewsSchema } from "./productReviewsSchema";
import { productsSchema } from "./productsSchema";
import { shippingMethodsSchema } from "./shippingMethodsSchema";
import { subscriptionsSchema } from "./subscriptionsSchema";
import { taxRatesSchema } from "./taxRatesSchema";
import { transactionsSchema } from "./transactionsSchema";
import { wishlistSchema } from "./wishlistSchema";

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
  ...checkoutsSchema,
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
