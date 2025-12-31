"use client";

/**
 * Ensure payment-method plugins register themselves in the browser bundle.
 *
 * Payment processor plugins register their methods via module side-effects
 * (they call `registerPaymentMethod(...)` at import-time).
 *
 * Checkout UI (`launchthat-plugin-ecommerce`'s `CheckoutClient`) reads from the
 * in-memory registry, so these must be imported somewhere that always loads
 * on the frontend (including canvas pages like `/checkout` where the Portal
 * header/sidebar may not render).
 */

import "launchthat-plugin-ecommerce-authorizenet";
import "launchthat-plugin-ecommerce-stripe";


