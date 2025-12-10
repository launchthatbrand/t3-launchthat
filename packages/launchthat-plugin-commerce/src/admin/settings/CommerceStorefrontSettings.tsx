"use client";

import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@acme/ui";
import { Switch } from "@acme/ui/switch";

const commerceSettingsSchema = z.object({
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  sellingLocations: z.enum(["all", "specific"]).default("all"),
  shippingLocations: z.enum(["all", "selling"]).default("selling"),
  defaultCustomerLocation: z.enum(["base", "geolocate"]).default("geolocate"),
  enableTaxes: z.boolean().default(true),
  enableCoupons: z.boolean().default(true),
  sequentialCoupons: z.boolean().default(false),
  currency: z.string().default("USD"),
  currencyPosition: z
    .enum(["left", "left_space", "right", "right_space"])
    .default("left"),
  thousandSeparator: z.string().default(","),
  decimalSeparator: z.string().default("."),
  decimals: z.number().int().min(0).max(4).default(2),
  placeholderImage: z.string().optional(),
  weightUnit: z.enum(["kg", "g", "lbs", "oz"]).default("kg"),
  dimensionUnit: z.enum(["cm", "mm", "in", "yd"]).default("cm"),
  enableReviews: z.boolean().default(true),
  showVerifiedLabel: z.boolean().default(true),
  verifiedOnly: z.boolean().default(false),
  enableRatings: z.boolean().default(true),
  ratingsRequired: z.boolean().default(false),
});

type CommerceSettingsValues = z.infer<typeof commerceSettingsSchema>;

const DEFAULT_VALUES: CommerceSettingsValues = {
  address1: "",
  address2: "",
  city: "",
  country: "US",
  state: "FL",
  postalCode: "",
  sellingLocations: "all",
  shippingLocations: "selling",
  defaultCustomerLocation: "geolocate",
  enableTaxes: true,
  enableCoupons: true,
  sequentialCoupons: false,
  currency: "USD",
  currencyPosition: "left",
  thousandSeparator: ",",
  decimalSeparator: ".",
  decimals: 2,
  placeholderImage: "",
  weightUnit: "kg",
  dimensionUnit: "cm",
  enableReviews: true,
  showVerifiedLabel: true,
  verifiedOnly: false,
  enableRatings: true,
  ratingsRequired: false,
};

const COUNTRY_OPTIONS = [
  { label: "United States (US)", value: "US" },
  { label: "Canada (CA)", value: "CA" },
];

const STATE_OPTIONS = [
  { label: "Florida", value: "FL" },
  { label: "California", value: "CA" },
  { label: "New York", value: "NY" },
];

const WEIGHT_UNITS = [
  { label: "Kilograms (kg)", value: "kg" },
  { label: "Grams (g)", value: "g" },
  { label: "Pounds (lbs)", value: "lbs" },
  { label: "Ounces (oz)", value: "oz" },
];

const DIMENSION_UNITS = [
  { label: "Centimeters (cm)", value: "cm" },
  { label: "Millimeters (mm)", value: "mm" },
  { label: "Inches (in)", value: "in" },
  { label: "Yards (yd)", value: "yd" },
];

const CURRENCY_POSITIONS = [
  { label: "Left", value: "left" },
  { label: "Left with space", value: "left_space" },
  { label: "Right", value: "right" },
  { label: "Right with space", value: "right_space" },
];

export const CommerceStorefrontSettings = ({
  pluginName,
}: PluginSettingComponentProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const normalizeTab = (value?: string | null): "general" | "products" =>
    value === "products" ? "products" : "general";

  const [activeTab, setActiveTab] = useState<"general" | "products">(() =>
    normalizeTab(searchParams?.get("tab")),
  );
  const storeOptions = useQuery(api.core.options.getStoreOptions, {});
  const setBatchMutation = useMutation(api.core.options.setBatch);

  const form = useForm<CommerceSettingsValues>({
    resolver: zodResolver(commerceSettingsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!storeOptions) {
      return;
    }
    const entries = Object.entries(storeOptions) as Array<
      [keyof CommerceSettingsValues, unknown]
    >;
    const nextValues: CommerceSettingsValues = { ...DEFAULT_VALUES };

    const mutableNext = nextValues as Record<string, unknown>;

    entries.forEach(([key, value]) => {
      if (!(key in DEFAULT_VALUES)) {
        return;
      }
      const defaultValue = DEFAULT_VALUES[key];
      if (typeof defaultValue === "number" && typeof value === "number") {
        mutableNext[key as string] = value;
      } else if (
        typeof defaultValue === "boolean" &&
        typeof value === "boolean"
      ) {
        mutableNext[key as string] = value;
      } else if (
        typeof defaultValue === "string" &&
        typeof value === "string"
      ) {
        mutableNext[key as string] = value;
      }
    });

    form.reset(nextValues);
  }, [storeOptions, form]);

  const enableCoupons = form.watch("enableCoupons");
  const enableReviews = form.watch("enableReviews");
  const enableRatings = form.watch("enableRatings");

  useEffect(() => {
    const next = normalizeTab(searchParams?.get("tab"));
    if (next !== activeTab) {
      setActiveTab(next);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value: string) => {
    const next = normalizeTab(value);
    setActiveTab(next);
    const params = new URLSearchParams(searchParams?.toString());
    if (next === "general") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const currencyOptions = useMemo(
    () => [
      { label: "US Dollar (USD)", value: "USD" },
      { label: "Euro (EUR)", value: "EUR" },
      { label: "Canadian Dollar (CAD)", value: "CAD" },
    ],
    [],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const options = Object.entries(values).map(([metaKey, metaValue]) => ({
      metaKey,
      metaValue,
    }));
    try {
      await setBatchMutation({
        options,
        type: "store",
      });
      toast.success(`${pluginName} settings saved`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Address</CardTitle>
                <CardDescription>
                  Tax and shipping rates use this address.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address1"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Suite 200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Miami" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNTRY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode / ZIP</FormLabel>
                      <FormControl>
                        <Input placeholder="33101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>General options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sellingLocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling location(s)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">
                            Sell to all countries
                          </SelectItem>
                          <SelectItem value="specific">
                            Sell to specific countries
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingLocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping location(s)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">
                            Ship to all countries you sell to
                          </SelectItem>
                          <SelectItem value="selling">
                            Ship to selling locations
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultCustomerLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default customer location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="base">
                            Shop base address
                          </SelectItem>
                          <SelectItem value="geolocate">Geolocate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableTaxes"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Enable taxes</FormLabel>
                        <FormDescription>
                          Enable tax rates and calculations at checkout.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableCoupons"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Enable coupons</FormLabel>
                        <FormDescription>
                          Allow coupon codes to be applied at checkout.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sequentialCoupons"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>
                          Calculate coupon discounts sequentially
                        </FormLabel>
                        <FormDescription>
                          Apply each coupon to the discounted price from the
                          previous one.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!enableCoupons}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Currency options</CardTitle>
                <CardDescription>
                  Control how currency appears across the storefront.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currencyPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency position</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCY_POSITIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thousandSeparator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thousand separator</FormLabel>
                      <FormControl>
                        <Input maxLength={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="decimalSeparator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decimal separator</FormLabel>
                      <FormControl>
                        <Input maxLength={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="decimals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of decimals</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={4}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Catalog defaults</CardTitle>
                <CardDescription>
                  Configure placeholder media and measurement units.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="placeholderImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder image ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5849" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WEIGHT_UNITS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensionUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensions unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dimension unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIMENSION_UNITS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews & ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="enableReviews"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Enable reviews</FormLabel>
                        <FormDescription>
                          Allow customers to review products.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showVerifiedLabel"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Show "verified owner" label</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!enableReviews}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="verifiedOnly"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>
                          Reviews restricted to verified owners
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!enableReviews}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enableRatings"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Enable star ratings</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!enableReviews}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ratingsRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Star ratings required</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!enableReviews || !enableRatings}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
};
