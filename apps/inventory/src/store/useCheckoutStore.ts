import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CheckoutStep =
  | "shipping"
  | "billing"
  | "payment"
  | "review"
  | "confirmation";

// Define a type for the address
export interface AddressData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface PaymentMethod {
  type: "credit_card" | "paypal" | "bank_transfer";
  details: Record<string, string>;
}

interface CheckoutState {
  // State
  checkoutId: string | null;
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

  // Actions
  setCheckoutId: (id: string) => void;
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

      // Actions
      setCheckoutId: (id) => {
        if (id === get().checkoutId) return;
        set({ checkoutId: id });
      },

      setCurrentStep: (step) => {
        if (step === get().currentStep) return;
        set({ currentStep: step });
      },

      setShippingAddress: (address) => {
        set({ shippingAddress: address });

        // Also update billing address if they are set to be the same
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

        // If setting to true, copy shipping address to billing
        if (isSame && get().shippingAddress) {
          set({ billingAddress: get().shippingAddress });
        }
      },

      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },

      updateOrderSummary: (summary) => {
        set((state) => {
          const updatedSummary = {
            ...state.orderSummary,
            ...summary,
          };

          // Recalculate total if any of the components have changed
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
        // Preserve the checkout ID but reset everything else
        const { checkoutId } = get();
        set({ ...initialState, checkoutId });
      },
    }),
    {
      name: "checkout-store",
      // Only persist specific fields to avoid keeping sensitive information
      partialize: (state) => ({
        checkoutId: state.checkoutId,
        currentStep: state.currentStep,
        isBillingSameAsShipping: state.isBillingSameAsShipping,
        orderSummary: state.orderSummary,
      }),
    },
  ),
);
