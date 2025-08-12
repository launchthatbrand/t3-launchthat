"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { formatPrice } from "@convex-config/ecommerce/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSessionId } from "convex-helpers/react/sessions";
import { useConvexAuth } from "convex/react";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";

import { useCart } from "~/hooks/useCart";
import { useConvexUser } from "~/hooks/useConvexUser";

// Define the form schema based on fields needed
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  name: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateOrProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  // Billing fields (rendered/used only if collectBillingAddress is true)
  billingFullName: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingStateOrProvince: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPhone: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export default function CustomCheckoutPage() {
  const params = useParams();
  const { slug } = params as { slug: string };
  const router = useRouter();
  const { isLoading: authLoading } = useConvexAuth();
  const [sessionId] = useSessionId();
  const { convexId: userId } = useConvexUser();
  const [checkoutSession, setCheckoutSession] = useState<{
    sessionId: string;
  } | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("information");
  const [cartInitialized, setCartInitialized] = useState(false);

  // Get custom checkout by slug
  const customCheckout = useConvexQuery(
    api.ecommerce.funnels.queries.getFunnelCheckoutBySlug,
    { slug },
  );

  // Mutations
  const createCheckoutSession = useConvexMutation(
    api.ecommerce.funnels.mutations.createCustomCheckoutSession,
  );
  const addToCart = useConvexMutation(api.ecommerce.cart.mutations.addToCart);
  const clearCart = useConvexMutation(api.ecommerce.cart.mutations.clearCart);
  const updateCheckoutInfo = useConvexMutation(
    api.ecommerce.funnels.mutations.updateCustomCheckoutSessionInfo,
  );
  const completeCheckout = useConvexMutation(
    api.ecommerce.funnels.mutations.completeCustomCheckoutSession,
  );

  // Cart context (reuse same logic as cart page)
  const cartCtx = useCart();
  const isCartLoading = cartCtx.cartItems === undefined;
  const cartItems = (cartCtx.cartItems ?? []) as any[];
  const cartSummary = cartCtx.cartSummary ?? {
    itemCount: 0,
    subtotal: 0,
    estimatedTax: 0,
    estimatedShipping: 0,
    updatedAt: Date.now(),
  };

  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      country: "",
      // Billing defaults
      billingFullName: "",
      billingAddressLine1: "",
      billingAddressLine2: "",
      billingCity: "",
      billingStateOrProvince: "",
      billingPostalCode: "",
      billingCountry: "",
      billingPhone: "",
      agreeToTerms: false,
    },
  });

  useEffect(() => {
    // Check if we already have a session in localStorage
    const savedSession = localStorage.getItem(`checkout_session_${slug}`);
    if (savedSession) {
      try {
        setCheckoutSession(JSON.parse(savedSession));
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem(`checkout_session_${slug}`);
      }
    }
  }, [slug]);

  // Create a checkout session when page loads if we don't have one
  useEffect(() => {
    const initializeCheckout = async () => {
      if (!customCheckout || checkoutSession || isCreatingSession) return;

      try {
        setIsCreatingSession(true);
        const session = await createCheckoutSession({
          checkoutSlug: slug,
        });

        setCheckoutSession(session as unknown as { sessionId: string });
        localStorage.setItem(
          `checkout_session_${slug}`,
          JSON.stringify(session),
        );
        setCurrentStep("information");
      } catch (error) {
        console.error("Failed to create checkout session:", error);
        toast.error("Failed to initialize checkout", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsCreatingSession(false);
      }
    };

    void initializeCheckout();
  }, [
    customCheckout,
    slug,
    checkoutSession,
    isCreatingSession,
    createCheckoutSession,
  ]);

  // Ensure cart contains only the linked products once we have identity and a session
  useEffect(() => {
    const syncCart = async () => {
      if (!customCheckout || !checkoutSession || cartInitialized) return;
      const productIds = (customCheckout as any).productIds ?? [];
      if (productIds.length === 0) return;

      const idArgs = userId
        ? { userId }
        : sessionId
          ? { guestSessionId: sessionId }
          : undefined;
      if (!idArgs) return; // wait until identity is available

      await clearCart(idArgs as any);
      for (const pid of productIds) {
        await addToCart({ ...(idArgs as any), productId: pid, quantity: 1 });
      }
      setCartInitialized(true);
    };

    void syncCart();
  }, [
    customCheckout,
    checkoutSession,
    userId,
    sessionId,
    cartInitialized,
    clearCart,
    addToCart,
  ]);

  const layout: "one_step" | "two_step" =
    (customCheckout as any)?.checkoutLayout ?? "two_step";

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!checkoutSession) return;

    try {
      const shippingAddress = (customCheckout as any)?.collectShippingAddress
        ? {
            fullName: values.name ?? "",
            addressLine1: values.addressLine1 ?? "",
            addressLine2: values.addressLine2,
            city: values.city ?? "",
            stateOrProvince: values.stateOrProvince ?? "",
            postalCode: values.postalCode ?? "",
            country: values.country ?? "",
            phoneNumber: values.phone,
          }
        : undefined;

      const billingAddress = (customCheckout as any)?.collectBillingAddress
        ? {
            fullName: values.billingFullName ?? "",
            addressLine1: values.billingAddressLine1 ?? "",
            addressLine2: values.billingAddressLine2,
            city: values.billingCity ?? "",
            stateOrProvince: values.billingStateOrProvince ?? "",
            postalCode: values.billingPostalCode ?? "",
            country: values.billingCountry ?? "",
            phoneNumber: values.billingPhone,
          }
        : undefined;

      if (layout === "one_step") {
        // Single submission: update info then complete
        await updateCheckoutInfo({
          sessionId: checkoutSession.sessionId,
          email: values.email,
          name: values.name,
          phone: values.phone,
          shippingAddress,
        });

        const result = await completeCheckout({
          sessionId: checkoutSession.sessionId,
          paymentMethod: "credit_card",
          paymentIntentId: "sim_" + Math.random().toString(36).substring(2, 15),
          billingAddress,
        });

        localStorage.removeItem(`checkout_session_${slug}`);
        if ((customCheckout as any)?.successUrl) {
          router.push((customCheckout as any).successUrl);
        } else {
          router.push(`/order-confirmation/${(result as any).orderId}`);
        }
        return;
      }

      // Two-step flow
      if (currentStep === "information") {
        await updateCheckoutInfo({
          sessionId: checkoutSession.sessionId,
          email: values.email,
          name: values.name,
          phone: values.phone,
          shippingAddress,
        });
        setCurrentStep("payment");
      } else if (currentStep === "payment") {
        const result = await completeCheckout({
          sessionId: checkoutSession.sessionId,
          paymentMethod: "credit_card",
          paymentIntentId: "sim_" + Math.random().toString(36).substring(2, 15),
          billingAddress,
        });

        localStorage.removeItem(`checkout_session_${slug}`);
        if ((customCheckout as any)?.successUrl) {
          router.push((customCheckout as any).successUrl);
        } else {
          router.push(`/order-confirmation/${(result as any).orderId}`);
        }
      }
    } catch (error) {
      console.error("Failed to process checkout:", error);
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Handle loading states
  if (authLoading || isCreatingSession) {
    return (
      <div className="container flex h-[80vh] items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p>Initializing checkout...</p>
        </div>
      </div>
    );
  }

  // Handle missing checkout
  if (customCheckout === undefined) {
    return (
      <div className="container flex h-[80vh] items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (customCheckout === null) {
    return (
      <div className="container flex h-[80vh] items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-xl font-bold text-destructive">
            Checkout Not Found
          </p>
          <p>The custom checkout "{slug}" could not be found or is inactive.</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Render the checkout form
  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{(customCheckout as any).title}</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Checkout Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {layout === "two_step"
                  ? currentStep === "information"
                    ? "Customer Information"
                    : "Payment Details"
                  : "Checkout"}
              </CardTitle>
              <CardDescription>
                {layout === "two_step"
                  ? currentStep === "information"
                    ? "Please provide your details"
                    : "Complete your purchase"
                  : "Enter your details and payment to complete your purchase"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Information section */}
                  {(layout === "one_step" || currentStep === "information") && (
                    <>
                      {/* Email (always required) */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your.email@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Name (conditionally required) */}
                      {(customCheckout as any).collectName && (
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John Doe"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Phone (conditionally required) */}
                      {(customCheckout as any).collectPhone && (
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+1 (555) 123-4567"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Shipping Address (conditionally required) */}
                      {(customCheckout as any).collectShippingAddress && (
                        <div className="mt-6">
                          <h3 className="mb-4 text-lg font-medium">
                            Shipping Address
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="addressLine1"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Address Line 1</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="123 Main St"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="addressLine2"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>
                                    Address Line 2 (Optional)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Apt 4B"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
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
                                    <Input
                                      placeholder="New York"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="stateOrProvince"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State / Province</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="NY"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="10001"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="United States"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Billing Address (conditionally required) */}
                  {(customCheckout as any).collectBillingAddress && (
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-4 text-lg font-medium">
                        Billing Address
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="billingAddressLine1"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123 Main St"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billingAddressLine2"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address Line 2 (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Apt 4B"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billingCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="New York"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billingStateOrProvince"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State / Province</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="NY"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billingPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="10001"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billingCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="United States"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment section */}
                  {(layout === "one_step" || currentStep === "payment") && (
                    <div className="space-y-6">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <p className="font-medium">Payment Information</p>
                        </div>
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="card-number">Card Number</Label>
                              <Input
                                id="card-number"
                                placeholder="4242 4242 4242 4242"
                              />
                            </div>
                            <div>
                              <Label htmlFor="card-name">Name on Card</Label>
                              <Input id="card-name" placeholder="John Doe" />
                            </div>
                            <div>
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input id="expiry" placeholder="MM/YY" />
                            </div>
                            <div>
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="123" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This is a demo checkout. No real payments will be
                            processed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms agreement (always shown) */}
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the terms and conditions
                          </FormLabel>
                          <FormDescription>
                            By checking this box, you agree to our {""}
                            <a
                              href="/terms"
                              className="text-primary underline"
                              target="_blank"
                            >
                              Terms of Service
                            </a>{" "}
                            and {""}
                            <a
                              href="/privacy"
                              className="text-primary underline"
                              target="_blank"
                            >
                              Privacy Policy
                            </a>
                            .
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    {layout === "two_step"
                      ? currentStep === "information"
                        ? "Continue to Payment"
                        : "Complete Purchase"
                      : "Complete Purchase"}
                  </Button>

                  {layout === "two_step" && currentStep === "payment" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => setCurrentStep("information")}
                    >
                      Back to Information
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary (reuse cart logic) */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Products */}
                {isCartLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  cartItems.map((item) => (
                    <div key={item._id} className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {item.productSnapshot.name}
                        </p>
                      </div>
                      <p>{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))
                )}

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <div>
                      {isCartLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <span>{formatPrice(cartSummary.subtotal)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <div>
                      {isCartLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : cartSummary.estimatedShipping === 0 ? (
                        "Free"
                      ) : (
                        <span>
                          {formatPrice(cartSummary.estimatedShipping ?? 0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <div>
                      {isCartLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <span>
                          {formatPrice(cartSummary.estimatedTax ?? 0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <div>
                      {isCartLoading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <span>
                          {formatPrice(
                            cartSummary.subtotal +
                              (cartSummary.estimatedShipping ?? 0) +
                              (cartSummary.estimatedTax ?? 0),
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-center text-sm text-muted-foreground">
                Need help?{" "}
                <a href="/contact" className="text-primary underline">
                  Contact support
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
