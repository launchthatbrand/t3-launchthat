import { createJSONStorage, persist } from "zustand/middleware";

import { create } from "zustand";

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
  shipToDifferentAddress: boolean;
  shipping: CheckoutShippingDraft;
  delivery: CheckoutShippingDraft;
};

const emptyDraft = (): CheckoutDraft => ({
  email: "",
  paymentMethodId: "",
  shipToDifferentAddress: false,
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
  delivery: {
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
  setShipToDifferentAddress: (orgKey: string, enabled: boolean) => void;
  setShipping: (
    orgKey: string,
    updates: Partial<CheckoutShippingDraft>,
  ) => void;
  setDelivery: (
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
                delivery: {
                  ...current.delivery,
                  ...(next.delivery ?? {}),
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
      setShipToDifferentAddress: (orgKey, enabled) => {
        get().setDraft(orgKey, { shipToDifferentAddress: enabled });
      },
      setShipping: (orgKey, updates) => {
        get().setDraft(orgKey, { shipping: updates as CheckoutShippingDraft });
      },
      setDelivery: (orgKey, updates) => {
        get().setDraft(orgKey, { delivery: updates as CheckoutShippingDraft });
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
      version: 3,
      migrate: (persisted: unknown, version) => {
        // v1 -> v2: add `delivery` draft (default empty), keep existing shipping values.
        // v2 -> v3: add `shipToDifferentAddress` boolean (default false).
        if (!persisted || typeof persisted !== "object") {
          return { draftsByOrg: {} };
        }
        const anyState = persisted as any;
        const draftsByOrgRaw =
          anyState && typeof anyState.draftsByOrg === "object"
            ? (anyState.draftsByOrg as Record<string, unknown>)
            : {};

        if (version >= 3) return { draftsByOrg: draftsByOrgRaw as any };

        const nextDrafts: Record<string, CheckoutDraft> = {};
        for (const [orgKey, draftRaw] of Object.entries(draftsByOrgRaw)) {
          const d =
            draftRaw && typeof draftRaw === "object" ? (draftRaw as any) : {};
          const shipping = d.shipping ?? EMPTY_CHECKOUT_DRAFT.shipping;
          nextDrafts[orgKey] = {
            ...EMPTY_CHECKOUT_DRAFT,
            ...(d as Partial<CheckoutDraft>),
            shipToDifferentAddress: Boolean(d.shipToDifferentAddress),
            shipping: {
              ...EMPTY_CHECKOUT_DRAFT.shipping,
              ...(shipping ?? {}),
            },
            delivery: {
              ...EMPTY_CHECKOUT_DRAFT.delivery,
              ...((d.delivery ?? {}) as Partial<CheckoutShippingDraft>),
            },
          };
        }
        return { draftsByOrg: nextDrafts };
      },
    },
  ),
);
