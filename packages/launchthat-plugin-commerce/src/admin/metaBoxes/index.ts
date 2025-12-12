import { registerBalanceMetaBoxes } from "./balances";
import { registerChargebackMetaBoxes } from "./chargebacks";
import { registerOrderMetaBoxes } from "./orders";
import { registerProductMetaBoxes } from "./products";

export { registerOrderMetaBoxes } from "./orders";
export { registerChargebackMetaBoxes } from "./chargebacks";
export { registerProductMetaBoxes } from "./products";
export { registerBalanceMetaBoxes } from "./balances";

let commerceMetaBoxesRegistered = false;

export const registerCommerceAdminMetaBoxes = () => {
  if (commerceMetaBoxesRegistered) {
    return;
  }

  registerOrderMetaBoxes();
  registerChargebackMetaBoxes();
  registerProductMetaBoxes();
  registerBalanceMetaBoxes();

  commerceMetaBoxesRegistered = true;
};
