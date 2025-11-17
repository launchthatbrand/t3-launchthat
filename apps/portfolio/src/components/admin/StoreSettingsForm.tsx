"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  toast,
} from "@acme/ui";

import { useAdminLayout } from "./AdminLayout";

// Store settings schema
const storeSettingsSchema = z.object({
  // General Settings
  storeName: z.string().optional(),
  storeDescription: z.string().optional(),
  storeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  storeEmail: z.string().email("Must be a valid email").optional(),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  storeCity: z.string().optional(),
  storeState: z.string().optional(),
  storeZip: z.string().optional(),
  storeCountry: z.string().optional(),
  storeCurrency: z.string().default("USD"),
  storeTimezone: z.string().default("America/New_York"),

  // Payment Settings
  paymentProcessorEnabled: z.boolean().default(false),
  paymentProcessor: z.enum(["stripe", "paypal", "authorize_net"]).optional(),
  paymentTestMode: z.boolean().default(true),
  paymentPublicKey: z.string().optional(),
  paymentSecretKey: z.string().optional(),
  paymentWebhookSecret: z.string().optional(),
  paymentAcceptCreditCards: z.boolean().default(true),
  paymentAcceptPaypal: z.boolean().default(false),
  paymentAcceptApplePay: z.boolean().default(false),
  paymentAcceptGooglePay: z.boolean().default(false),

  // Shipping Settings
  shippingEnabled: z.boolean().default(true),
  shippingFreeThreshold: z.number().optional(),
  shippingDefaultRate: z.number().optional(),
  shippingCalculationMethod: z
    .enum(["flat", "weight", "price", "zone"])
    .default("flat"),
  shippingOriginAddress: z.string().optional(),
  shippingOriginCity: z.string().optional(),
  shippingOriginState: z.string().optional(),
  shippingOriginZip: z.string().optional(),
  shippingOriginCountry: z.string().optional(),
  shippingInternationalEnabled: z.boolean().default(false),

  // Tax Settings
  taxEnabled: z.boolean().default(false),
  taxCalculationMethod: z.enum(["simple", "address", "api"]).default("simple"),
  taxDefaultRate: z.number().optional(),
  taxIncludedInPrices: z.boolean().default(false),
  taxApiProvider: z.enum(["taxjar", "avalara"]).optional(),
  taxApiKey: z.string().optional(),
  taxExemptionEnabled: z.boolean().default(false),

  // Notification Settings
  notificationsOrderReceived: z.boolean().default(true),
  notificationsOrderShipped: z.boolean().default(true),
  notificationsOrderDelivered: z.boolean().default(true),
  notificationsOrderCancelled: z.boolean().default(true),
  notificationsLowStock: z.boolean().default(true),
  notificationsLowStockThreshold: z.number().default(5),
  notificationsCustomerMessages: z.boolean().default(true),
  notificationsEmailFrom: z
    .string()
    .email("Must be a valid email")
    .optional()
    .or(z.literal("")),
  notificationsEmailReplyTo: z
    .string()
    .email("Must be a valid email")
    .optional()
    .or(z.literal("")),
  notificationsSmtpEnabled: z.boolean().default(false),
  notificationsSmtpHost: z.string().optional(),
  notificationsSmtpPort: z.number().optional(),
  notificationsSmtpUsername: z.string().optional(),
  notificationsSmtpPassword: z.string().optional(),
});

type StoreSettingsData = z.infer<typeof storeSettingsSchema>;

export function StoreSettingsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the active tab from the layout context
  const { activeTab } = useAdminLayout();

  // Convex queries and mutations
  const storeOptions = useQuery(api.core.options.getStoreOptions, {});
  const setBatchMutation = useMutation(api.core.options.setBatch);

  // Form setup
  const form = useForm<StoreSettingsData>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
      storeCurrency: "USD",
      storeTimezone: "America/New_York",
      paymentProcessorEnabled: false,
      paymentTestMode: true,
      paymentAcceptCreditCards: true,
      paymentAcceptPaypal: false,
      paymentAcceptApplePay: false,
      paymentAcceptGooglePay: false,
      shippingEnabled: true,
      shippingCalculationMethod: "flat",
      shippingInternationalEnabled: false,
      taxEnabled: false,
      taxCalculationMethod: "simple",
      taxIncludedInPrices: false,
      taxExemptionEnabled: false,
      notificationsOrderReceived: true,
      notificationsOrderShipped: true,
      notificationsOrderDelivered: true,
      notificationsOrderCancelled: true,
      notificationsLowStock: true,
      notificationsLowStockThreshold: 5,
      notificationsCustomerMessages: true,
      notificationsSmtpEnabled: false,
    },
  });

  // Load existing settings when data is available
  useEffect(() => {
    if (storeOptions) {
      // Convert the key-value store options back to form data
      const formData: Partial<StoreSettingsData> = {};

      Object.entries(storeOptions).forEach(([key, value]) => {
        if (key in form.getValues()) {
          (formData as any)[key] = value;
        }
      });

      form.reset(formData);
    }
  }, [storeOptions, form]);

  // Handle form submission
  const handleSubmit = async (data: StoreSettingsData) => {
    setIsSubmitting(true);
    try {
      // Convert form data to options array, filtering out empty/undefined values
      const options = Object.entries(data)
        .filter(([_, metaValue]) => {
          // Filter out undefined, null, or empty string values
          return (
            metaValue !== undefined && metaValue !== null && metaValue !== ""
          );
        })
        .map(([metaKey, metaValue]) => ({
          metaKey,
          metaValue,
        }));

      await setBatchMutation({
        options,
        type: "store",
        // orgId can be added here when multi-org support is implemented
      });

      toast.success("Store settings updated successfully!");
    } catch (error) {
      console.error("Failed to update store settings:", error);
      toast.error("Failed to update store settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Store" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://mystore.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@mystore.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">
                          CAD - Canadian Dollar
                        </SelectItem>
                        <SelectItem value="AUD">
                          AUD - Australian Dollar
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeTimezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storeDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your store..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="storeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP/Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="paymentProcessorEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Payment Processing
                    </FormLabel>
                    <FormDescription>
                      Allow customers to make payments through your store
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

            {form.watch("paymentProcessorEnabled") && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="paymentProcessor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Processor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select processor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="authorize_net">
                              Authorize.Net
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTestMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Test Mode</FormLabel>
                          <FormDescription>
                            Use test API keys for testing
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
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="paymentPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Key</FormLabel>
                        <FormControl>
                          <Input placeholder="pk_test_..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentSecretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="sk_test_..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentWebhookSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook Secret</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="whsec_..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Accepted Payment Methods
                  </Label>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentAcceptCreditCards"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Credit Cards</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentAcceptPaypal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>PayPal</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentAcceptApplePay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Apple Pay</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentAcceptGooglePay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Google Pay</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "shipping":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="shippingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Shipping</FormLabel>
                    <FormDescription>
                      Allow customers to specify shipping addresses
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

            {form.watch("shippingEnabled") && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="shippingFreeThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Shipping Threshold</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum order amount for free shipping
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingDefaultRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Shipping Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="9.99"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingCalculationMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calculation Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="flat">Flat Rate</SelectItem>
                            <SelectItem value="weight">Weight Based</SelectItem>
                            <SelectItem value="price">Price Based</SelectItem>
                            <SelectItem value="zone">Zone Based</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingInternationalEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            International Shipping
                          </FormLabel>
                          <FormDescription>
                            Allow shipping to international addresses
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
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Origin Address
                  </Label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="shippingOriginAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Warehouse St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingOriginCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingOriginState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingOriginZip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingOriginCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "tax":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="taxEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Tax Calculation
                    </FormLabel>
                    <FormDescription>
                      Calculate taxes for orders
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

            {form.watch("taxEnabled") && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="taxCalculationMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calculation Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Simple Rate</SelectItem>
                            <SelectItem value="address">
                              Address Based
                            </SelectItem>
                            <SelectItem value="api">API Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxDefaultRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="8.25"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxIncludedInPrices"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Tax Included in Prices
                          </FormLabel>
                          <FormDescription>
                            Product prices include tax
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
                    name="taxExemptionEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Tax Exemptions
                          </FormLabel>
                          <FormDescription>
                            Allow tax-exempt customers
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
                </div>

                {form.watch("taxCalculationMethod") === "api" && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="taxApiProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Provider</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="taxjar">TaxJar</SelectItem>
                              <SelectItem value="avalara">Avalara</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="API key..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Order Notifications
              </Label>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notificationsOrderReceived"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Order Received</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsOrderShipped"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Order Shipped</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsOrderDelivered"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Order Delivered</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsOrderCancelled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Order Cancelled</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">
                Inventory Notifications
              </Label>
              <FormField
                control={form.control}
                name="notificationsLowStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Low Stock Alerts</FormLabel>
                  </FormItem>
                )}
              />

              {form.watch("notificationsLowStock") && (
                <FormField
                  control={form.control}
                  name="notificationsLowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Send alert when inventory falls below this number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notificationsCustomerMessages"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Customer Messages</FormLabel>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label className="text-base font-medium">Email Settings</Label>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="notificationsEmailFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input placeholder="noreply@mystore.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsEmailReplyTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply-To Email</FormLabel>
                      <FormControl>
                        <Input placeholder="support@mystore.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notificationsSmtpEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Custom SMTP</FormLabel>
                    <FormDescription>
                      Use your own SMTP server for email delivery
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

            {form.watch("notificationsSmtpEnabled") && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="notificationsSmtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsSmtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="587"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsSmtpUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationsSmtpPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Select a tab to view settings
            </p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Settings</CardTitle>
        <CardDescription>
          Configure your store settings, payment processing, shipping, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {renderTabContent()}

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
