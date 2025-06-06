"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "@/convex/_generated/react";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@acme/ui/textarea";

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
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export default function CustomCheckoutPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("information");

  // Get custom checkout by slug
  const customCheckout = useConvexQuery(
    api.ecommerce.checkout.customCheckouts.getCustomCheckoutBySlug,
    { slug },
  );

  // Mutations
  const createCheckoutSession = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.createCustomCheckoutSession,
  );
  const updateCheckoutInfo = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.updateCustomCheckoutSessionInfo,
  );
  const completeCheckout = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.completeCustomCheckoutSession,
  );

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

        setCheckoutSession(session);
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

    initializeCheckout();
  }, [
    customCheckout,
    slug,
    checkoutSession,
    isCreatingSession,
    createCheckoutSession,
  ]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!checkoutSession) return;

    try {
      if (currentStep === "information") {
        // Prepare shipping address if needed
        const shippingAddress = customCheckout?.collectShippingAddress
          ? {
              fullName: values.name || "",
              addressLine1: values.addressLine1 || "",
              addressLine2: values.addressLine2,
              city: values.city || "",
              stateOrProvince: values.stateOrProvince || "",
              postalCode: values.postalCode || "",
              country: values.country || "",
              phoneNumber: values.phone,
            }
          : undefined;

        // Update session with customer information
        await updateCheckoutInfo({
          sessionId: checkoutSession.sessionId,
          email: values.email,
          name: values.name,
          phone: values.phone,
          shippingAddress,
        });

        // Move to payment step
        setCurrentStep("payment");
      } else if (currentStep === "payment") {
        // Process payment (this would integrate with a payment processor)
        // For this example, we'll just simulate a successful payment
        const result = await completeCheckout({
          sessionId: checkoutSession.sessionId,
          paymentMethod: "credit_card",
          paymentIntentId: "sim_" + Math.random().toString(36).substring(2, 15),
        });

        // Clear the checkout session from localStorage
        localStorage.removeItem(`checkout_session_${slug}`);

        // Redirect to success page or order confirmation
        if (customCheckout?.successUrl) {
          router.push(customCheckout.successUrl);
        } else {
          router.push(`/order-confirmation/${result.orderId}`);
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
        <h1 className="text-3xl font-bold">{customCheckout.title}</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Checkout Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === "information"
                  ? "Customer Information"
                  : "Payment Details"}
              </CardTitle>
              <CardDescription>
                {currentStep === "information"
                  ? "Please provide your details"
                  : "Complete your purchase"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {currentStep === "information" && (
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
                      {customCheckout.collectName && (
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
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Phone (conditionally required) */}
                      {customCheckout.collectPhone && (
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
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Shipping Address (conditionally required) */}
                      {customCheckout.collectShippingAddress && (
                        <>
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
                                        value={field.value || ""}
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
                                        value={field.value || ""}
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
                                        value={field.value || ""}
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
                                        value={field.value || ""}
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
                                        value={field.value || ""}
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
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {currentStep === "payment" && (
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
                            By checking this box, you agree to our{" "}
                            <a
                              href="/terms"
                              className="text-primary underline"
                              target="_blank"
                            >
                              Terms of Service
                            </a>{" "}
                            and{" "}
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
                    {currentStep === "information"
                      ? "Continue to Payment"
                      : "Complete Purchase"}
                  </Button>

                  {currentStep === "payment" && (
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

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Products */}
                {customCheckout.products?.map((product: any) => (
                  <div key={product._id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.description?.substring(0, 60)}
                        {product.description?.length > 60 ? "..." : ""}
                      </p>
                    </div>
                    <p>${product.price.toFixed(2)}</p>
                  </div>
                ))}

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>
                      $
                      {customCheckout.products
                        ?.reduce(
                          (sum: number, product: any) => sum + product.price,
                          0,
                        )
                        .toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p>Tax</p>
                    <p>$0.00</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Shipping</p>
                    <p>$0.00</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <p>Total</p>
                    <p>
                      $
                      {customCheckout.products
                        ?.reduce(
                          (sum: number, product: any) => sum + product.price,
                          0,
                        )
                        .toFixed(2)}
                    </p>
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
