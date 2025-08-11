/**
 * Ecommerce Mutations
 *
 * This file consolidates all mutation functions from ecommerce subdirectories
 * to enable organized access via api.ecommerce.mutations.*
 */
// Products mutations
export { createProduct, updateProduct, deleteProduct, } from "./products/mutations";
// Categories mutations
export { createCategory, updateCategory, deleteCategory, } from "./categories/mutations";
// Orders mutations
export { createOrder, updateOrderStatus, deleteOrder, } from "./orders/mutations";
// Balances mutations
export { createJunctionTableEntries, addOrdersToTransfer, removeOrdersFromTransfer, createBankAccount, updateBankAccount, createTransfer, updateStoreBalance, deleteBankAccount, } from "./balances/mutations";
// Cart mutations - if any exist
// export {} from "./cart/index";
// Checkout mutations - if any exist
// export {} from "./checkout/index";
