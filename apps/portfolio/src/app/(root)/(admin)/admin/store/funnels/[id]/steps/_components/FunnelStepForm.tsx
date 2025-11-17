"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@acme/ui";

const schema = z.object({
  type: z.enum(["landing", "funnelCheckout", "upsell", "order_confirmation"]),
  position: z.number().min(1).default(1),
  label: z.string().optional(),
  config: z
    .object({
      productIds: z.array(z.custom<Id<"products">>()).optional(),
      collectEmail: z.boolean().optional(),
      collectName: z.boolean().optional(),
      collectPhone: z.boolean().optional(),
      collectShippingAddress: z.boolean().optional(),
      collectBillingAddress: z.boolean().optional(),
      allowCoupons: z.boolean().optional(),
      successUrl: z.string().url().optional(),
      cancelUrl: z.string().url().optional(),
    })
    .optional(),
});

export type FunnelStepFormValues = z.infer<typeof schema>;

export function FunnelStepForm({
  funnelId,
  initial,
  onCancel,
  onSubmit,
}: {
  funnelId: Id<"funnels">;
  initial?: Partial<FunnelStepFormValues> & { _id?: Id<"funnelSteps"> };
  onCancel?: () => void;
  onSubmit: (values: FunnelStepFormValues) => Promise<void>;
}) {
  const form = useForm<FunnelStepFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (initial?.type as any) ?? "landing",
      position: (initial?.position as any) ?? 1,
      label: initial?.label ?? "",
      config: initial?.config ?? {
        productIds: [],
        collectEmail: true,
        collectName: true,
        collectPhone: false,
        collectShippingAddress: false,
        collectBillingAddress: false,
        allowCoupons: true,
      },
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="landing">Landing</SelectItem>
                    <SelectItem value="funnelCheckout">
                      Funnel Checkout
                    </SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                    <SelectItem value="order_confirmation">
                      Order Confirmation
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input placeholder="Optional label" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch("type") === "funnelCheckout" && (
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="config.collectEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Collect Email</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="config.collectName"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Collect Name</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="config.collectPhone"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Collect Phone</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
