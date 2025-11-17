"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/convex";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@acme/ui";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  collectEmail: z.boolean().default(true),
  collectName: z.boolean().default(true),
  collectPhone: z.boolean().default(false),
  collectShippingAddress: z.boolean().default(false),
  collectBillingAddress: z.boolean().default(false),
  allowCoupons: z.boolean().default(true),
});

export type FunnelFormValues = z.infer<typeof schema>;

export function FunnelForm({
  id,
  initial,
  onSuccess,
}: {
  id?: Id<"funnels">;
  initial?: Partial<FunnelFormValues>;
  onSuccess?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const createFunnel = useConvexMutation(
    api.ecommerce.funnels.mutations.createFunnel as any,
  );
  const updateFunnel = useConvexMutation(
    api.ecommerce.funnels.mutations.updateCustomCheckout as any,
  );

  const form = useForm<FunnelFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      status: (initial?.status as any) ?? "draft",
      collectEmail: initial?.collectEmail ?? true,
      collectName: initial?.collectName ?? true,
      collectPhone: initial?.collectPhone ?? false,
      collectShippingAddress: initial?.collectShippingAddress ?? false,
      collectBillingAddress: initial?.collectBillingAddress ?? false,
      allowCoupons: initial?.allowCoupons ?? true,
    },
  });

  const handleSubmit = async (values: FunnelFormValues) => {
    setSubmitting(true);
    try {
      if (id) {
        await updateFunnel({
          id,
          title: values.title,
          description: values.description,
          collectEmail: values.collectEmail,
          collectName: values.collectName,
          collectPhone: values.collectPhone,
          collectShippingAddress: values.collectShippingAddress,
          collectBillingAddress: values.collectBillingAddress,
          allowCoupons: values.allowCoupons,
          status: values.status,
        });
        toast.success("Funnel updated");
      } else {
        await createFunnel({
          title: values.title,
          slug: values.slug,
          description: values.description,
          collectEmail: values.collectEmail,
          collectName: values.collectName,
          collectPhone: values.collectPhone,
          collectShippingAddress: values.collectShippingAddress,
          collectBillingAddress: values.collectBillingAddress,
          allowCoupons: values.allowCoupons,
          status: values.status,
        });
        toast.success("Funnel created");
        form.reset({
          title: "",
          slug: "",
          description: "",
          status: "draft",
          collectEmail: true,
          collectName: true,
          collectPhone: false,
          collectShippingAddress: false,
          collectBillingAddress: false,
          allowCoupons: true,
        });
      }
      onSuccess?.();
    } catch (e) {
      console.error(e);
      toast.error(id ? "Failed to update funnel" : "Failed to create funnel", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Premium Bundle" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!id && (
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., premium-bundle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs like /checkout/premium-bundle. Use only lowercase
              letters, numbers, and hyphens.
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what this funnel is for"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* <div className="grid gap-2">
          <Label>Products</Label>
          <Select
            onValueChange={(value) => {
              const productId = value as Id<"products">;
              const current = form.getValues("productIds");
              if (!current.includes(productId)) {
                form.setValue("productIds", [...current, productId]);
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
            {form.watch("productIds").map((productId) => {
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
                      const next = form
                        .getValues("productIds")
                        .filter((id) => id !== productId);
                      form.setValue("productIds", next);
                    }}
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        </div> */}

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium">Field Configuration</h3>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="collectEmail"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Collect Email</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collectName"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Collect Name</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collectPhone"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Collect Phone Number</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collectShippingAddress"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Collect Shipping Address</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collectBillingAddress"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Collect Billing Address</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowCoupons"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Allow Coupon Codes</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? id
                ? "Saving..."
                : "Creating..."
              : id
                ? "Save"
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
