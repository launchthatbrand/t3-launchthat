import type { ConfirmDialog, ToastType } from "../store";

import { useEmailParserStore } from "../store";

// We need to access the store through its hook to ensure reactivity
// These functions provide a more convenient API than using the store directly
export const showToast = (type: ToastType, message: string): void => {
  // Get the showToast function from the store
  const showToastFn = useEmailParserStore.getState().showToast;
  showToastFn(type, message);
};

export const showConfirmDialog = (dialog: ConfirmDialog): void => {
  // Get the showConfirmDialog function from the store
  const showConfirmDialogFn = useEmailParserStore.getState().showConfirmDialog;
  showConfirmDialogFn(dialog);
};
