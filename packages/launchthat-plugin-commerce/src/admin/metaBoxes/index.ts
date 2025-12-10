import { registerChargebackMetaBoxes } from "./chargebacks";
import { registerOrderMetaBoxes } from "./orders";

export { registerOrderMetaBoxes } from "./orders";
export { registerChargebackMetaBoxes } from "./chargebacks";

let commerceMetaBoxesRegistered = false;

export const registerCommerceAdminMetaBoxes = () => {
  if (commerceMetaBoxesRegistered) {
    return;
  }

  registerOrderMetaBoxes();
  registerChargebackMetaBoxes();

  commerceMetaBoxesRegistered = true;
};
