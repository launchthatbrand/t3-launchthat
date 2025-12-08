export { default as StoreDashboardView } from "./page";

// Orders
export { default as StoreOrdersView } from "./orders/page";
export { default as StoreOrderDetailView } from "./orders/[orderId]/page";
export { default as StoreOrdersNewView } from "./orders/new/page";
export { default as StoreOrdersAnalyticsView } from "./orders/analytics/page";
export { default as StoreOrdersSettingsView } from "./orders/settings/page";

// Chargebacks
export { default as StoreChargebacksView } from "./chargebacks/page";
export { default as StoreChargebackDetailView } from "./chargebacks/[chargebackId]/page";

// Plans / Coupons / Chargebacks (plans already plugin-native)
export { default as StorePlansView } from "./plans/page";

// Products
export { default as StoreProductsView } from "./products/page";
export { default as StoreProductDetailView } from "./products/[productId]/page";
export { default as StoreProductsCatalogView } from "./products/catalog/page";

export { default as StoreProductCreateView } from "./products/create/page";
export { default as StoreProductEditView } from "./products/edit/[id]/page";

// Product helpers
export { default as StoreProductForm } from "./products/components/product-form";

// Balance / payouts
export { default as StoreBalancesView } from "./balances/page";
export { default as StoreTransfersView } from "./balances/transfers/page";
export { default as StoreTransferDetailView } from "./balances/transfers/[transferId]/page";

// Checkouts
export { default as StoreCheckoutsView } from "./checkouts/page";
export { default as StoreCheckoutDetailView } from "./checkouts/[id]/page";

// Funnels
// export { default as StoreFunnelsView } from "./funnels/page";
// export { default as StoreFunnelDetailView } from "./funnels/[id]/page";
// export { default as StoreFunnelStepsView } from "./funnels/[id]/steps/page";
// export { default as StoreFunnelStepDetailView } from "./funnels/[id]/steps/[stepId]/page";

// Settings
export { default as StoreSettingsView } from "./settings/page";
