import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CheckoutShippingDraft = {
  country: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
};

export type CheckoutDraft = {
  email: string;
  paymentMethodId: string;
  shipping: CheckoutShippingDraft;
};

const emptyDraft = (): CheckoutDraft => ({
  email: "",
  paymentMethodId: "",
  shipping: {
    country: "",
    firstName: "",
    lastName: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
  },
});

// IMPORTANT: This must be stable (no new object per render) to avoid React 19
// useSyncExternalStore "getSnapshot should be cached" infinite loop warnings.
export const EMPTY_CHECKOUT_DRAFT: CheckoutDraft = emptyDraft();

type CheckoutDraftStore = {
  draftsByOrg: Record<string, CheckoutDraft>;
  getDraft: (orgKey: string) => CheckoutDraft;
  setDraft: (orgKey: string, next: Partial<CheckoutDraft>) => void;
  setEmail: (orgKey: string, email: string) => void;
  setPaymentMethodId: (orgKey: string, paymentMethodId: string) => void;
  setShipping: (
    orgKey: string,
    updates: Partial<CheckoutShippingDraft>,
  ) => void;
  resetDraft: (orgKey: string) => void;
};

export const useCheckoutDraftStore = create<CheckoutDraftStore>()(
  persist(
    (set, get) => ({
      draftsByOrg: {},
      getDraft: (orgKey) => get().draftsByOrg[orgKey] ?? EMPTY_CHECKOUT_DRAFT,
      setDraft: (orgKey, next) => {
        set((state) => {
          const current = state.draftsByOrg[orgKey] ?? EMPTY_CHECKOUT_DRAFT;
          return {
            draftsByOrg: {
              ...state.draftsByOrg,
              [orgKey]: {
                ...current,
                ...next,
                shipping: {
                  ...current.shipping,
                  ...(next.shipping ?? {}),
                },
              },
            },
          };
        });
      },
      setEmail: (orgKey, email) => {
        get().setDraft(orgKey, { email });
      },
      setPaymentMethodId: (orgKey, paymentMethodId) => {
        get().setDraft(orgKey, { paymentMethodId });
      },
      setShipping: (orgKey, updates) => {
        get().setDraft(orgKey, { shipping: updates as CheckoutShippingDraft });
      },
      resetDraft: (orgKey) => {
        set((state) => {
          const next = { ...state.draftsByOrg };
          delete next[orgKey];
          return { draftsByOrg: next };
        });
      },
    }),
    {
      name: "launchthat-ecommerce-checkout-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ draftsByOrg: state.draftsByOrg }),
      version: 1,
    },
  ),
);


