"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { AddressData } from "@/src/store";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useCheckoutStore } from "@/src/store";
import { useMutation } from "convex/react";

import { Checkbox } from "@acme/ui/checkbox";
import { Label } from "@acme/ui/label";

import { AddressForm } from "./AddressForm";

export const BillingStep = () => {
  const {
    billingAddress,
    setBillingAddress,
    shippingAddress,
    isBillingSameAsShipping,
    setIsBillingSameAsShipping,
    setCurrentStep,
    checkoutId,
  } = useCheckoutStore();

  const [isLoading, setIsLoading] = useState(false);
  // Key for re-rendering AddressForm when defaultValues change due to checkbox
  const [formKey, setFormKey] = useState(Date.now());

  // Using a more specific type annotation instead of any
  const updateBillingAddressMutation = useMutation(
    // @ts-expect-error - API type mismatch, will be fixed when API is updated
    api.ecommerce.checkout.updateBillingAddress,
  );

  useEffect(() => {
    // Update form key to force re-render with new default values when checkbox state changes
    setFormKey(Date.now());
  }, [isBillingSameAsShipping, shippingAddress]);

  const handleBillingSubmit = async (data: AddressData) => {
    setIsLoading(true);
    if (!checkoutId) {
      console.error("Checkout ID not found. Cannot save billing address.");
      // Potentially redirect to shipping or show error
      setIsLoading(false);
      return;
    }
    try {
      await updateBillingAddressMutation({
        checkoutId: checkoutId as Id<"checkoutSessions">,
        address: data,
        isSameAsShipping: isBillingSameAsShipping,
      });
      setBillingAddress(data);
      setCurrentStep("payment");
      console.log("Billing address saved");
    } catch (error) {
      console.error("Failed to save billing address:", error);
    }
    setIsLoading(false);
  };

  const defaultFormValues = isBillingSameAsShipping
    ? shippingAddress
    : billingAddress;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Billing Information</h2>
      <div className="mb-4 flex items-center space-x-2">
        <Checkbox
          id="sameAsShipping"
          checked={isBillingSameAsShipping}
          onCheckedChange={(checked) => {
            setIsBillingSameAsShipping(Boolean(checked));
          }}
        />
        <Label htmlFor="sameAsShipping" className="cursor-pointer">
          Billing address is the same as shipping
        </Label>
      </div>

      <AddressForm
        key={formKey} // Force re-render when default values change
        onSubmit={handleBillingSubmit}
        defaultValues={defaultFormValues ?? undefined}
        isLoading={isLoading}
        submitButtonText="Continue to Payment"
      />
    </div>
  );
};
