import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CheckoutStep =
  | "shipping"
  | "billing"
  | "payment"
  | "review"
  | "confirmation";

export interface AddressData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  stateOrProvince?: string;
  postalCode: string;
  country: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
}

interface PaymentMethod {
  type: "credit_card" | "paypal" | "bank_transfer";
  details: Record<string, string>;
}

interface CheckoutState {
  checkoutId: string | null;
  paymentIntentId: string | null;
  currentStep: CheckoutStep;
  shippingAddress: AddressData | null;
  billingAddress: AddressData | null;
  isBillingSameAsShipping: boolean;
  paymentMethod: PaymentMethod | null;
  orderSummary: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  setCheckoutId: (id: string) => void;
  setPaymentIntentId: (id: string | null) => void;
  setCurrentStep: (step: CheckoutStep) => void;
  setShippingAddress: (address: AddressData) => void;
  setBillingAddress: (address: AddressData) => void;
  setIsBillingSameAsShipping: (isSame: boolean) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  updateOrderSummary: (summary: Partial<CheckoutState["orderSummary"]>) => void;
  resetCheckout: () => void;
}

const initialState = {
  checkoutId: null,
  paymentIntentId: null,
  currentStep: "shipping" as CheckoutStep,
  shippingAddress: null,
  billingAddress: null,
  isBillingSameAsShipping: true,
  paymentMethod: null,
  orderSummary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  },
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCheckoutId: (id) => {
        if (id === get().checkoutId) return;
        set({ checkoutId: id });
      },
      setPaymentIntentId: (id) => {
        set({ paymentIntentId: id });
      },
      setCurrentStep: (step) => {
        if (step === get().currentStep) return;
        set({ currentStep: step });
      },
      setShippingAddress: (address) => {
        set({ shippingAddress: address });
        if (get().isBillingSameAsShipping) {
          set({ billingAddress: address });
        }
      },
      setBillingAddress: (address) => {
        set({ billingAddress: address });
      },
      setIsBillingSameAsShipping: (isSame) => {
        if (isSame === get().isBillingSameAsShipping) return;
        set({ isBillingSameAsShipping: isSame });
        if (isSame && get().shippingAddress) {
          set({ billingAddress: get().shippingAddress });
        }
      },
      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },
      updateOrderSummary: (summary) => {
        set((state) => {
          const updatedSummary = { ...state.orderSummary, ...summary };
          if (
            summary.subtotal !== undefined ||
            summary.tax !== undefined ||
            summary.shipping !== undefined
          ) {
            updatedSummary.total =
              (summary.subtotal ?? state.orderSummary.subtotal) +
              (summary.tax ?? state.orderSummary.tax) +
              (summary.shipping ?? state.orderSummary.shipping);
          }
          return { orderSummary: updatedSummary };
        });
      },
      resetCheckout: () => {
        const { checkoutId } = get();
        set({ ...initialState, checkoutId });
      },
    }),
    {
      name: "plugin-checkout-store",
      partialize: (state) => ({
        checkoutId: state.checkoutId,
        currentStep: state.currentStep,
        isBillingSameAsShipping: state.isBillingSameAsShipping,
        orderSummary: state.orderSummary,
      }),
    },
  ),
);

export default useCheckoutStore;
