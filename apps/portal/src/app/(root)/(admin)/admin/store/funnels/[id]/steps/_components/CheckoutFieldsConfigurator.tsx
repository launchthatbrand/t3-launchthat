"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { UseFormReturn } from "react-hook-form";
import { useConvexMutation } from "@/hooks/convex";
import { api } from "@convex-config/_generated/api";
import { toast } from "sonner";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";

import type { FunnelCheckoutFormValues } from "./FunnelCheckoutForm";

export function CheckoutFieldsConfigurator({
  stepId,
  form,
}: {
  stepId: Id<"funnelSteps">;
  form: UseFormReturn<FunnelCheckoutFormValues>;
}) {
  const updateStep = useConvexMutation(
    api.ecommerce.funnels.mutations.updateFunnelStep,
  );

  const saveConfig = async (next: FunnelCheckoutFormValues["config"]) => {
    try {
      await updateStep({ stepId, config: next });
      toast.success("Checkout fields saved");
    } catch (err) {
      toast.error("Failed to save checkout fields", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const updateConfigField = async <
    K extends keyof FunnelCheckoutFormValues["config"],
  >(
    key: K,
    value: NonNullable<FunnelCheckoutFormValues["config"]>[K],
  ) => {
    // Update the react-hook-form state first
    form.setValue(`config.${key}` as const, value as any, {
      shouldDirty: true,
      shouldTouch: true,
    });
    // Build next config snapshot
    const current = form.getValues("config") ?? {};
    const next = {
      ...current,
      [key]: value,
    } as FunnelCheckoutFormValues["config"];
    await saveConfig(next);
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="grid gap-2 md:grid-cols-2">
        <FormField
          control={form.control}
          name="config.checkoutLayout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Checkout Layout</FormLabel>
              <Select
                value={field.value ?? "two_step"}
                onValueChange={async (v) => {
                  field.onChange(v);
                  await updateConfigField(
                    "checkoutLayout",
                    v as "one_step" | "two_step",
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two_step">
                    Two-step (Info → Payment)
                  </SelectItem>
                  <SelectItem value="one_step">
                    One-step (All in one)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Collect Email */}
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="config.collectEmail"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={async (checked) => {
                    field.onChange(checked);
                    await updateConfigField("collectEmail", checked);
                  }}
                />
              </FormControl>
              <FormLabel>Collect Email</FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Collect Name */}
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="config.collectName"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={async (checked) => {
                    field.onChange(checked);
                    await updateConfigField("collectName", checked);
                  }}
                />
              </FormControl>
              <FormLabel>Collect Name</FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Collect Phone */}
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="config.collectPhone"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={async (checked) => {
                    field.onChange(checked);
                    await updateConfigField("collectPhone", checked);
                  }}
                />
              </FormControl>
              <FormLabel>Collect Phone</FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Collect Shipping Address */}
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="config.collectShippingAddress"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={async (checked) => {
                    field.onChange(checked);
                    await updateConfigField("collectShippingAddress", checked);
                  }}
                />
              </FormControl>
              <FormLabel>Collect Shipping Address</FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Collect Billing Address */}
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="config.collectBillingAddress"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={async (checked) => {
                    field.onChange(checked);
                    await updateConfigField("collectBillingAddress", checked);
                  }}
                />
              </FormControl>
              <FormLabel>Collect Billing Address</FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Allow Coupons */}
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="config.allowCoupons"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={async (checked) => {
                    field.onChange(checked);
                    await updateConfigField("allowCoupons", checked);
                  }}
                />
              </FormControl>
              <FormLabel>Allow Coupon Codes</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
