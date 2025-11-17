"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { api } from "@convex-config/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Badge,
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
} from "@acme/ui";
import { Label } from "@acme/ui/label";

import { CheckoutFieldsConfigurator } from "./CheckoutFieldsConfigurator";

const schema = z.object({
  label: z.string().optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  position: z.number().min(1).default(1),
  config: z.object({
    productIds: z.array(z.custom<Id<"products">>()).optional(),
    collectEmail: z.boolean().optional(),
    collectName: z.boolean().optional(),
    collectPhone: z.boolean().optional(),
    collectShippingAddress: z.boolean().optional(),
    collectBillingAddress: z.boolean().optional(),
    allowCoupons: z.boolean().optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
    checkoutLayout: z.enum(["one_step", "two_step"]).optional(),
  }),
});

export type FunnelCheckoutFormValues = z.infer<typeof schema>;

export function FunnelCheckoutForm({
  stepId,
  initial,
}: {
  stepId: Id<"funnelSteps">;
  initial: Partial<FunnelCheckoutFormValues> & { position?: number } & {
    slug?: string;
  };
}) {
  const form = useForm<FunnelCheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: initial.label ?? "",
      slug: initial.slug ?? "",
      position: initial.position ?? 1,
      config: {
        productIds: initial.config?.productIds ?? [],
        collectEmail: initial.config?.collectEmail ?? true,
        collectName: initial.config?.collectName ?? true,
        collectPhone: initial.config?.collectPhone ?? false,
        collectShippingAddress: initial.config?.collectShippingAddress ?? false,
        collectBillingAddress: initial.config?.collectBillingAddress ?? false,
        allowCoupons: initial.config?.allowCoupons ?? true,
        successUrl: initial.config?.successUrl,
        cancelUrl: initial.config?.cancelUrl,
        checkoutLayout: initial.config?.checkoutLayout ?? "two_step",
      },
    },
  });

  const products = useConvexQuery(
    api.ecommerce.products.queries.listProducts,
    {},
  ) as { _id: Id<"products">; name: string; price: number }[] | undefined;
  const updateStep = useConvexMutation(
    api.ecommerce.funnels.mutations.updateFunnelStep,
  );

  const handleSubmit = async (values: FunnelCheckoutFormValues) => {
    try {
      await updateStep({
        stepId,
        label: values.label,
        slug: values.slug,
        position: values.position,
        config: values.config,
      });
      toast.success("Step saved");
    } catch {
      toast.error("Failed to save step");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-2 md:grid-cols-2">
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
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Step Slug</FormLabel>
                <FormControl>
                  <Input placeholder="checkout-step" {...field} />
                </FormControl>
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
          <Label>Products</Label>
          <Select
            onValueChange={(value) => {
              const productId = value as Id<"products">;
              const current = form.getValues("config.productIds") ?? [];
              if (!current.includes(productId)) {
                form.setValue("config.productIds", [...current, productId]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select products to include" />
            </SelectTrigger>
            <SelectContent>
              {products?.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.name} (${product.price.toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 flex flex-wrap gap-2">
            {(form.watch("config.productIds") ?? []).map((productId) => {
              const product = products?.find((p) => p._id === productId);
              return (
                <Badge
                  key={productId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {product?.name ?? "Unknown product"}
                  <button
                    type="button"
                    className="ml-1 rounded-full p-1 hover:bg-muted"
                    onClick={() => {
                      const next = (
                        form.getValues("config.productIds") ?? []
                      ).filter((id) => id !== productId);
                      form.setValue("config.productIds", next);
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
        {/* Modular immediate-save checkout field configuration */}
        asd
        <CheckoutFieldsConfigurator stepId={stepId} form={form} />
        asdadasd
        <div className="grid gap-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="config.successUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Success URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/success" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="config.cancelUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cancel URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/cancel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
