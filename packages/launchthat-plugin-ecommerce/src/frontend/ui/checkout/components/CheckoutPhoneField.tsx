"use client";

import { PhoneInput } from "@acme/ui/input-phone";

export const CheckoutPhoneField = ({
  id,
  value,
  onValueChange,
  disabled,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
}) => {
  return (
    <PhoneInput
      id={id}
      value={value}
      onChange={(next) => onValueChange(typeof next === "string" ? next : "")}
      placeholder="(555) 555-5555"
      autoComplete="tel"
      defaultCountry="US"
      disabled={disabled}
    />
  );
};


