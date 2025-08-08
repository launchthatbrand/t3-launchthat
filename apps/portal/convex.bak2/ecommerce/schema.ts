// import { balancesSchema } from "./balances/schema";
// import { cartSchema } from "./cart/schema";
// import { categoriesSchema } from "./categories/schema";
// import { chargebacksSchemaExport as chargebacksSchema } from "./chargebacks/schema";
// import { checkoutsSchema } from "./checkout/schema";
// import { couponsSchema } from "./coupons/schema";
import { ordersSchema } from "./orders/schema";
// import { paymentMethodsSchema } from "./payments/schema";
// import { productReviewsSchema } from "./productReviews/schema";
import { productsSchema } from "./products/schema";

// import { shippingMethodsSchema } from "./shippingMethods/schema";
// import { subscriptionsSchema } from "./subscriptions/schema";
// import { taxRatesSchema } from "./taxRates/schema";
// import { transactionsSchema } from "./transactions/schema";
// import { wishlistSchema } from "./wishlist/schema";

// Keep the original export for backward compatibility
export const ecommerceSchema = {
  ...ordersSchema,
  ...productsSchema,
  // ...cartSchema,
  // ...categoriesSchema,
  // ...transactionsSchema,
  // ...subscriptionsSchema,
  // ...wishlistSchema,
  // ...productReviewsSchema,
  // ...paymentMethodsSchema,
  // ...shippingMethodsSchema,
  // ...taxRatesSchema,
  // ...couponsSchema,
  // ...checkoutsSchema,
  // ...chargebacksSchema,
  // ...balancesSchema,
};
