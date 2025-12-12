export const ORDER_META_KEYS = {
  payload: "order:payload",
  subtotal: "order:subtotal",
  shipping: "order:shipping",
  tax: "order:tax",
  total: "order:total",
  email: "order:email",
  userId: "order:userId",
} as const;

export const PRODUCT_META_KEYS = {
  payload: "product:payload",
  price: "product:price",
  status: "product:status",
  sku: "product:sku",
  visibility: "product:visible",
} as const;

export const BALANCE_META_KEYS = {
  payload: "balance:payload",
  currency: "balance:currency",
  available: "balance:available",
  pending: "balance:pending",
  processor: "balance:processor",
  processorAccount: "balance:processor_account",
} as const;
