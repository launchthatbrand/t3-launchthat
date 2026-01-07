"use client";

import type { UseFormReturn } from "react-hook-form";
import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type {
  CheckoutDraft,
  CheckoutShippingDraft,
} from "../../../state/useCheckoutDraftStore";
import { createCheckoutFormSchema } from "./schema";

export type CheckoutFormValues = {
  email: string;
  paymentMethodId: string;
  shipToDifferentAddress: boolean;
  shipping: CheckoutShippingDraft;
  delivery: CheckoutShippingDraft;
};

export const useCheckoutFormSync = (args: {
  orgKey: string;
  draft: CheckoutDraft;
  setDraft: (orgKey: string, next: Partial<CheckoutDraft>) => void;
  allowDifferentShipping: boolean;
  isFreeOrder: boolean;
  enabledPaymentMethodIds: Array<string>;
}): {
  form: UseFormReturn<CheckoutFormValues>;
  formEmail: string;
  formShippingPhone: string;
  formPaymentMethodId: string;
  formShipToDifferentAddress: boolean;
} => {
  const {
    orgKey,
    draft,
    setDraft,
    allowDifferentShipping,
    isFreeOrder,
    enabledPaymentMethodIds,
  } = args;

  const schema = createCheckoutFormSchema({
    allowDifferentShipping,
    requiresPaymentMethod: !isFreeOrder && enabledPaymentMethodIds.length > 0,
    allowedPaymentMethodIds: enabledPaymentMethodIds,
  });

  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      email: draft.email,
      paymentMethodId: draft.paymentMethodId,
      shipToDifferentAddress:
        allowDifferentShipping && draft.shipToDifferentAddress === true,
      shipping: draft.shipping,
      delivery: draft.delivery,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
    // Keep values stable even when we render skeleton UIs (unmounted fields),
    // otherwise Zod sees `undefined` and produces noisy "invalid_type" issues.
    shouldUnregister: false,
  });
  const { control, reset, formState, watch } = form;

  const formEmail = useWatch({ control, name: "email" }) ?? draft.email;
  const formShippingPhone =
    useWatch({ control, name: "shipping.phone" }) ?? draft.shipping.phone;
  const formPaymentMethodId =
    useWatch({ control, name: "paymentMethodId" }) ?? draft.paymentMethodId;
  const formShipToDifferentAddress =
    useWatch({ control, name: "shipToDifferentAddress" }) ??
    (allowDifferentShipping && draft.shipToDifferentAddress === true);

  const lastSyncedRef = useRef<{ json: string }>({
    json: JSON.stringify(draft),
  });
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!formState.isDirty) {
      reset({
        email: draft.email,
        paymentMethodId: draft.paymentMethodId,
        shipToDifferentAddress:
          allowDifferentShipping && draft.shipToDifferentAddress === true,
        shipping: draft.shipping,
        delivery: draft.delivery,
      });
      lastSyncedRef.current = { json: JSON.stringify(draft) };
    }
  }, [allowDifferentShipping, draft, formState.isDirty, reset]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(() => {
        const next: CheckoutDraft = {
          ...draft,
          email: typeof values.email === "string" ? values.email : "",
          paymentMethodId:
            typeof values.paymentMethodId === "string"
              ? values.paymentMethodId
              : "",
          shipToDifferentAddress:
            allowDifferentShipping && values.shipToDifferentAddress === true,
          shipping: (values.shipping ??
            draft.shipping) as CheckoutShippingDraft,
          delivery: (values.delivery ??
            draft.delivery) as CheckoutShippingDraft,
        };

        const nextJson = JSON.stringify(next);
        if (lastSyncedRef.current.json === nextJson) {
          return;
        }
        lastSyncedRef.current = { json: nextJson };
        setDraft(orgKey, next);
      }, 200);
    });

    return () => {
      subscription.unsubscribe();
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [allowDifferentShipping, draft, orgKey, setDraft, watch]);

  return {
    form,
    formEmail,
    formShippingPhone,
    formPaymentMethodId,
    formShipToDifferentAddress,
  };
};
