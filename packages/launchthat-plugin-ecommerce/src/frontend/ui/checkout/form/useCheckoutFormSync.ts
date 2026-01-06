"use client";

import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { CheckoutShippingDraft } from "../../../state/useCheckoutDraftStore";
import { EMPTY_CHECKOUT_DRAFT } from "../../../state/useCheckoutDraftStore";
import type { UseFormReturn } from "react-hook-form";

export type CheckoutFormValues = {
  email: string;
  shipping: CheckoutShippingDraft;
  delivery: CheckoutShippingDraft;
};

export const useCheckoutFormSync = (args: {
  orgKey: string;
  email: string;
  shipping: CheckoutShippingDraft;
  delivery: CheckoutShippingDraft;
  setEmail: (orgKey: string, email: string) => void;
  setShippingDraft: (orgKey: string, updates: CheckoutShippingDraft) => void;
  setDeliveryDraft: (orgKey: string, updates: CheckoutShippingDraft) => void;
}): {
  form: UseFormReturn<CheckoutFormValues>;
  formEmail: string;
  formShippingPhone: string;
} => {
  const {
    orgKey,
    email,
    shipping,
    delivery,
    setEmail,
    setShippingDraft,
    setDeliveryDraft,
  } = args;

  const form = useForm<CheckoutFormValues>({
    defaultValues: { email, shipping, delivery },
    mode: "onChange",
  });
  const { control, reset, formState, watch } = form;

  const formEmail = useWatch({ control, name: "email" }) ?? email;
  const formShippingPhone =
    useWatch({ control, name: "shipping.phone" }) ?? shipping.phone;

  const lastSyncedRef = useRef<{
    email: string;
    shippingJson: string;
    deliveryJson: string;
  }>({
    email,
    shippingJson: JSON.stringify(shipping),
    deliveryJson: JSON.stringify(delivery),
  });
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!formState.isDirty) {
      reset({ email, shipping, delivery });
      lastSyncedRef.current = {
        email,
        shippingJson: JSON.stringify(shipping),
        deliveryJson: JSON.stringify(delivery),
      };
    }
  }, [delivery, email, formState.isDirty, reset, shipping]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(() => {
        const nextEmail = typeof values.email === "string" ? values.email : "";
        const rawShipping =
          values.shipping && typeof values.shipping === "object"
            ? (values.shipping as Partial<CheckoutShippingDraft>)
            : {};
        const base = EMPTY_CHECKOUT_DRAFT.shipping as CheckoutShippingDraft;
        const nextShipping: CheckoutShippingDraft = {
          country:
            typeof rawShipping.country === "string"
              ? rawShipping.country
              : base.country,
          firstName:
            typeof rawShipping.firstName === "string"
              ? rawShipping.firstName
              : base.firstName,
          lastName:
            typeof rawShipping.lastName === "string"
              ? rawShipping.lastName
              : base.lastName,
          phone:
            typeof rawShipping.phone === "string"
              ? rawShipping.phone
              : base.phone,
          address1:
            typeof rawShipping.address1 === "string"
              ? rawShipping.address1
              : base.address1,
          address2:
            typeof rawShipping.address2 === "string"
              ? rawShipping.address2
              : base.address2,
          city:
            typeof rawShipping.city === "string" ? rawShipping.city : base.city,
          state:
            typeof rawShipping.state === "string"
              ? rawShipping.state
              : base.state,
          postcode:
            typeof rawShipping.postcode === "string"
              ? rawShipping.postcode
              : base.postcode,
        };

        const rawDelivery =
          values.delivery && typeof values.delivery === "object"
            ? (values.delivery as Partial<CheckoutShippingDraft>)
            : {};
        const baseDelivery =
          EMPTY_CHECKOUT_DRAFT.delivery as CheckoutShippingDraft;
        const nextDelivery: CheckoutShippingDraft = {
          country:
            typeof rawDelivery.country === "string"
              ? rawDelivery.country
              : baseDelivery.country,
          firstName:
            typeof rawDelivery.firstName === "string"
              ? rawDelivery.firstName
              : baseDelivery.firstName,
          lastName:
            typeof rawDelivery.lastName === "string"
              ? rawDelivery.lastName
              : baseDelivery.lastName,
          phone:
            typeof rawDelivery.phone === "string"
              ? rawDelivery.phone
              : baseDelivery.phone,
          address1:
            typeof rawDelivery.address1 === "string"
              ? rawDelivery.address1
              : baseDelivery.address1,
          address2:
            typeof rawDelivery.address2 === "string"
              ? rawDelivery.address2
              : baseDelivery.address2,
          city:
            typeof rawDelivery.city === "string"
              ? rawDelivery.city
              : baseDelivery.city,
          state:
            typeof rawDelivery.state === "string"
              ? rawDelivery.state
              : baseDelivery.state,
          postcode:
            typeof rawDelivery.postcode === "string"
              ? rawDelivery.postcode
              : baseDelivery.postcode,
        };

        const nextShippingJson = JSON.stringify(nextShipping);
        const nextDeliveryJson = JSON.stringify(nextDelivery);
        const prev = lastSyncedRef.current;
        if (
          prev.email === nextEmail &&
          prev.shippingJson === nextShippingJson &&
          prev.deliveryJson === nextDeliveryJson
        ) {
          return;
        }
        lastSyncedRef.current = {
          email: nextEmail,
          shippingJson: nextShippingJson,
          deliveryJson: nextDeliveryJson,
        };

        setEmail(orgKey, nextEmail);
        setShippingDraft(orgKey, nextShipping);
        setDeliveryDraft(orgKey, nextDelivery);
      }, 200);
    });

    return () => {
      subscription.unsubscribe();
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [orgKey, setDeliveryDraft, setEmail, setShippingDraft, watch]);

  return { form, formEmail, formShippingPhone };
};
