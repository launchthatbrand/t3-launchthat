"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import { getPaymentMethods } from "../../payments/registry";
import { CheckoutDesignDefault } from "./designs/CheckoutDesignDefault";
import { CheckoutDesignMinimal } from "./designs/CheckoutDesignMinimal";
import { CheckoutDesignSidebar } from "./designs/CheckoutDesignSidebar";
import {
  EMPTY_CHECKOUT_DRAFT,
  useCheckoutDraftStore,
} from "../state/useCheckoutDraftStore";

const apiAny = api as any;

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";

type CartItem = {
  _id: string;
  productPostId: string;
  quantity: number;
  unitPrice?: number | null;
  product?: { _id: string; title?: string; slug?: string } | null;
};

type PaymentMethod = ReturnType<typeof getPaymentMethods>[number];

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMoney = (amount: number): string => `$${amount.toFixed(2)}`;

const OrderSummary = ({
  items,
  subtotal,
  onApplyDiscount,
}: {
  items: Array<CartItem>;
  subtotal: number;
  onApplyDiscount?: (code: string) => void;
}) => {
  const [discountCode, setDiscountCode] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            Your cart is empty.
          </div>
        ) : (
          items.map((item) => {
            const unit =
              typeof item.unitPrice === "number" ? item.unitPrice : 0;
            const qty = asNumber(item.quantity);
            const line = unit * qty;
            return (
              <div
                key={item._id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.product?.title ?? "Product"}
                  </div>
                  <div className="text-muted-foreground text-xs">Qty {qty}</div>
                </div>
                <div className="text-sm font-semibold">{formatMoney(line)}</div>
              </div>
            );
          })
        )}
      </div>

      <Separator />

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="discount-code" className="text-xs">
            Discount code
          </Label>
          <Input
            id="discount-code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.currentTarget.value)}
            placeholder="Discount code"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onApplyDiscount?.(discountCode.trim())}
          disabled={discountCode.trim().length === 0}
        >
          Apply
        </Button>
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">Calculated at next step</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Estimated taxes</span>
          <span className="text-muted-foreground">—</span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Total</div>
        <div className="text-lg font-semibold">{formatMoney(subtotal)}</div>
      </div>
    </div>
  );
};

export function CheckoutClient({
  organizationId,
  checkoutId,
  checkoutSlug,
}: {
  organizationId?: string;
  checkoutId?: string;
  checkoutSlug?: string;
}) {
  const orgKey = organizationId ?? "portal-root";
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const draft = useCheckoutDraftStore(
    (s) => s.draftsByOrg[orgKey] ?? EMPTY_CHECKOUT_DRAFT,
  );
  const setEmail = useCheckoutDraftStore((s) => s.setEmail);
  const setPaymentMethodId = useCheckoutDraftStore((s) => s.setPaymentMethodId);
  const setShippingDraft = useCheckoutDraftStore((s) => s.setShipping);
  const resetDraft = useCheckoutDraftStore((s) => s.resetDraft);

  const email = draft.email;
  const paymentMethodId = draft.paymentMethodId;
  const [paymentData, setPaymentData] = useState<unknown | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const shipping = draft.shipping;
  const [hasEnsuredDefaultCheckout, setHasEnsuredDefaultCheckout] =
    useState(false);
  const [hasAppliedPredefinedProducts, setHasAppliedPredefinedProducts] =
    useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("guestCartSessionId");
    if (existing) {
      setGuestSessionId(existing);
      return;
    }
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    window.localStorage.setItem("guestCartSessionId", created);
    setGuestSessionId(created);
  }, []);

  const cart = useQuery(
    apiAny.plugins.commerce.cart.queries.getCart,
    guestSessionId ? { guestSessionId } : "skip",
  ) as { items?: CartItem[] } | undefined;

  const ensureGeneralCheckout = useMutation(
    apiAny.plugins.commerce.checkouts.mutations.ensureGeneralCheckout,
  ) as (args: any) => Promise<any>;

  const replaceCart = useMutation(
    apiAny.plugins.commerce.cart.mutations.replaceCart,
  ) as (args: any) => Promise<any>;

  const effectiveCheckoutSlug =
    typeof checkoutSlug === "string" && checkoutSlug.trim().length > 0
      ? checkoutSlug.trim()
      : DEFAULT_CHECKOUT_SLUG;

  const checkoutConfigBySlug = useQuery(
    apiAny.plugins.commerce.checkouts.queries.getCheckoutConfigBySlug,
    guestSessionId && !checkoutId
      ? {
          slug: effectiveCheckoutSlug,
          organizationId,
        }
      : "skip",
  ) as any;

  const checkoutConfigById = useQuery(
    apiAny.plugins.commerce.checkouts.queries.getCheckoutConfigById,
    guestSessionId && checkoutId
      ? {
          id: checkoutId,
          organizationId,
        }
      : "skip",
  ) as any;

  const checkoutConfig = (checkoutId ? checkoutConfigById : checkoutConfigBySlug) as
    | {
        postId: string;
        slug: string;
        title?: string;
        design?: string;
        predefinedProductPostIds?: string[];
        isDefault?: boolean;
      }
    | null
    | undefined;

  const placeOrder = useAction(
    apiAny.plugins.commerce.checkout.actions.placeOrder,
  ) as (args: any) => Promise<any>;

  const items = useMemo(
    () => (Array.isArray(cart?.items) ? (cart?.items ?? []) : []),
    [cart],
  );

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const unit = typeof item.unitPrice === "number" ? item.unitPrice : 0;
      return sum + unit * (item.quantity ?? 0);
    }, 0);
  }, [items]);

  const paymentMethods = useMemo(() => getPaymentMethods(), []);
  const pluginActiveOptionKeys = useMemo(
    () => paymentMethods.map((m) => m.config.pluginActiveOptionKey),
    [paymentMethods],
  );
  const paymentEnabledOptionKeys = useMemo(
    () => paymentMethods.map((m) => m.config.paymentEnabledOptionKey),
    [paymentMethods],
  );
  const configOptionKeys = useMemo(
    () => paymentMethods.map((m) => m.config.configOptionKey),
    [paymentMethods],
  );

  const pluginActiveMap = useQuery(apiAny.core.options.getMany, {
    metaKeys: pluginActiveOptionKeys,
    type: "site",
    orgId: organizationId,
  }) as Record<string, unknown> | undefined;

  const paymentEnabledMap = useQuery(apiAny.core.options.getMany, {
    metaKeys: paymentEnabledOptionKeys,
    type: "site",
    orgId: organizationId,
  }) as Record<string, unknown> | undefined;

  const configMap = useQuery(apiAny.core.options.getMany, {
    metaKeys: configOptionKeys,
    type: "site",
    orgId: organizationId,
  }) as Record<string, unknown> | undefined;

  const enabledPaymentMethods = useMemo(() => {
    if (!pluginActiveMap || !paymentEnabledMap || !configMap) return [];
    return paymentMethods.filter(
      (m) =>
        pluginActiveMap[m.config.pluginActiveOptionKey] === true &&
        paymentEnabledMap[m.config.paymentEnabledOptionKey] === true &&
        m.isConfigured(configMap[m.config.configOptionKey]),
    );
  }, [configMap, paymentEnabledMap, paymentMethods, pluginActiveMap]);

  const selectedPaymentMethod = useMemo((): PaymentMethod | null => {
    if (!paymentMethodId) return null;
    return enabledPaymentMethods.find((m) => m.id === paymentMethodId) ?? null;
  }, [enabledPaymentMethods, paymentMethodId]);

  useEffect(() => {
    if (hasEnsuredDefaultCheckout) return;
    if (effectiveCheckoutSlug !== DEFAULT_CHECKOUT_SLUG) return;
    if (!guestSessionId) return;

    startTransition(() => {
      void ensureGeneralCheckout({ organizationId })
        .catch(() => null)
        .finally(() => setHasEnsuredDefaultCheckout(true));
    });
  }, [
    effectiveCheckoutSlug,
    ensureGeneralCheckout,
    guestSessionId,
    hasEnsuredDefaultCheckout,
    organizationId,
    startTransition,
  ]);

  useEffect(() => {
    if (hasAppliedPredefinedProducts) return;
    if (!guestSessionId) return;
    if (!checkoutConfig) return;
    if (checkoutConfig.isDefault === true) return;

    const productIds = Array.isArray(checkoutConfig.predefinedProductPostIds)
      ? checkoutConfig.predefinedProductPostIds
      : [];
    if (productIds.length === 0) return;

    startTransition(() => {
      void replaceCart({ guestSessionId, productPostIds: productIds })
        .catch(() => null)
        .finally(() => setHasAppliedPredefinedProducts(true));
    });
  }, [
    checkoutConfig,
    guestSessionId,
    hasAppliedPredefinedProducts,
    replaceCart,
    startTransition,
  ]);

  useEffect(() => {
    setPaymentData(null);
  }, [paymentMethodId]);

  useEffect(() => {
    if (paymentMethodId) return;
    if (enabledPaymentMethods.length === 0) return;
    setPaymentMethodId(orgKey, enabledPaymentMethods[0]!.id);
  }, [enabledPaymentMethods, paymentMethodId]);

  const mustSelectPaymentMethod = enabledPaymentMethods.length > 0;
  const requiresPaymentData = Boolean(selectedPaymentMethod?.renderCheckoutForm);
  const canSubmit =
    items.length > 0 &&
    email.trim().length > 3 &&
    !isPending &&
    !isPlacingOrder &&
    (!mustSelectPaymentMethod || paymentMethodId.trim().length > 0) &&
    (!requiresPaymentData || paymentData !== null);

  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const handlePlaceOrder = () => {
    if (!guestSessionId) return;
    setIsPlacingOrder(true);
    startTransition(() => {
      const fullName = `${shipping.firstName} ${shipping.lastName}`.trim();
      void placeOrder({
        organizationId,
        guestSessionId,
        email: email.trim(),
        billing: {
          name: fullName || null,
          email: email.trim(),
          phone: shipping.phone.trim() || null,
          address1: shipping.address1.trim() || null,
          address2: shipping.address2.trim() || null,
          city: shipping.city.trim() || null,
          state: shipping.state.trim() || null,
          postcode: shipping.postcode.trim() || null,
          country: shipping.country.trim() || null,
        },
        shipping: {
          name: fullName || null,
          phone: shipping.phone.trim() || null,
          address1: shipping.address1.trim() || null,
          address2: shipping.address2.trim() || null,
          city: shipping.city.trim() || null,
          state: shipping.state.trim() || null,
          postcode: shipping.postcode.trim() || null,
          country: shipping.country.trim() || null,
        },
        paymentMethodId,
        paymentData,
      })
        .then((_result: any) => {
          toast.success("Payment successful.");
          resetDraft(orgKey);
          setPaymentData(null);
          setIsPlacingOrder(false);
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Payment failed");
          setIsPlacingOrder(false);
        });
    });
  };

  const checkoutDesign = (() => {
    const raw = checkoutConfig?.design;
    if (raw === "minimal") return "minimal";
    if (raw === "sidebar") return "sidebar";
    return "default";
  })();

  const Layout =
    checkoutDesign === "minimal"
      ? CheckoutDesignMinimal
      : checkoutDesign === "sidebar"
        ? CheckoutDesignSidebar
        : CheckoutDesignDefault;

  const mobileSummary = (
    <div className="lg:hidden">
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3"
            onClick={() => setMobileSummaryOpen((v) => !v)}
          >
            <div className="text-sm font-medium">
              {mobileSummaryOpen ? "Hide order summary" : "Show order summary"}
            </div>
            <div className="text-sm font-semibold">{formatMoney(subtotal)}</div>
          </button>
          {mobileSummaryOpen ? (
            <div className="pt-4">
              <OrderSummary items={items} subtotal={subtotal} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      <div className="h-6" />
    </div>
  );

  const rightSummary = (
    <Card>
      <CardHeader>
        <CardTitle>Order summary</CardTitle>
        <CardDescription>Review your items and totals.</CardDescription>
      </CardHeader>
      <CardContent>
        <OrderSummary items={items} subtotal={subtotal} />
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {isPlacingOrder ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="text-sm font-medium">Processing payment…</div>
            </div>
            <div className="text-muted-foreground mt-2 text-sm">
              Please don’t refresh or close this page.
            </div>
          </div>
        </div>
      ) : null}
      <Layout
        mobileSummary={mobileSummary}
        left={
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-xl font-semibold">
                {typeof checkoutConfig?.title === "string" &&
                checkoutConfig.title.trim()
                  ? checkoutConfig.title
                  : "Checkout"}
              </div>
              <div className="text-muted-foreground text-sm">
                Complete your purchase below.
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
                <CardDescription>
                  We’ll email your receipt and updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(orgKey, e.currentTarget.value)}
                    placeholder="you@example.com"
                    disabled={isPlacingOrder}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery</CardTitle>
                <CardDescription>
                  Where should we send your order?
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ship-country">Country/region</Label>
                  <Input
                    id="ship-country"
                    value={shipping.country}
                    onChange={(e) =>
                      setShippingDraft(orgKey, {
                        country: e.currentTarget.value,
                      })
                    }
                    placeholder="United States"
                    autoComplete="country-name"
                    disabled={isPlacingOrder}
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="ship-first">First name (optional)</Label>
                <Input
                  id="ship-first"
                  value={shipping.firstName}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      firstName: e.currentTarget.value,
                    })
                  }
                  placeholder="Jane"
                  autoComplete="given-name"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-last">Last name</Label>
                <Input
                  id="ship-last"
                  value={shipping.lastName}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      lastName: e.currentTarget.value,
                    })
                  }
                  placeholder="Doe"
                  autoComplete="family-name"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-phone">Phone</Label>
                <Input
                  id="ship-phone"
                  value={shipping.phone}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      phone: e.currentTarget.value,
                    })
                  }
                  placeholder="(555) 555-5555"
                  autoComplete="tel"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-address">Address</Label>
                <Input
                  id="ship-address"
                  value={shipping.address1}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      address1: e.currentTarget.value,
                    })
                  }
                  placeholder="123 Main St"
                  autoComplete="street-address"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ship-address2">Apartment, suite, etc. (optional)</Label>
                <Input
                  id="ship-address2"
                  value={shipping.address2}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      address2: e.currentTarget.value,
                    })
                  }
                  placeholder="Apt 4B"
                  autoComplete="address-line2"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-city">City</Label>
                <Input
                  id="ship-city"
                  value={shipping.city}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      city: e.currentTarget.value,
                    })
                  }
                  placeholder="New York"
                  autoComplete="address-level2"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-state">State/Province</Label>
                <Input
                  id="ship-state"
                  value={shipping.state}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      state: e.currentTarget.value,
                    })
                  }
                  placeholder="NY"
                  autoComplete="address-level1"
                  disabled={isPlacingOrder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-zip">Postal code</Label>
                <Input
                  id="ship-zip"
                  value={shipping.postcode}
                  onChange={(e) =>
                    setShippingDraft(orgKey, {
                      postcode: e.currentTarget.value,
                    })
                  }
                  placeholder="10001"
                  autoComplete="postal-code"
                  disabled={isPlacingOrder}
                />
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Select how you’d like to pay.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pluginActiveMap &&
                paymentEnabledMap &&
                configMap &&
                enabledPaymentMethods.length === 0 ? (
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      No payment methods are enabled. An admin can enable one in
                      Ecommerce → Settings → Payment processors.
                    </div>
                    {process.env.NODE_ENV !== "production" ? (
                      <div className="rounded-md border p-3 text-xs">
                        <div className="font-semibold">Debug</div>
                        <div className="text-muted-foreground">
                          orgId: {organizationId ?? "(undefined)"}
                        </div>
                        <div className="mt-2 space-y-1">
                          {paymentMethods.map((m) => {
                            const pluginActive =
                              pluginActiveMap[m.config.pluginActiveOptionKey] ===
                              true;
                            const enabled =
                              paymentEnabledMap[m.config.paymentEnabledOptionKey] ===
                              true;
                            const configured = m.isConfigured(
                              configMap[m.config.configOptionKey],
                            );
                            return (
                              <div
                                key={m.id}
                                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                              >
                                <div className="font-medium">{m.id}</div>
                                <div className="text-muted-foreground">
                                  active:{String(pluginActive)} enabled:
                                  {String(enabled)} configured:
                                  {String(configured)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <RadioGroup
                    value={paymentMethodId}
                    onValueChange={(value) => setPaymentMethodId(orgKey, value)}
                    className="gap-2"
                  >
                    {enabledPaymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className="border-input hover:bg-muted/40 flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={method.id} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {method.label}
                            </div>
                            {method.description ? (
                              <div className="text-muted-foreground text-xs">
                                {method.description}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                )}

              {selectedPaymentMethod &&
              configMap &&
              typeof selectedPaymentMethod.renderCheckoutForm === "function" ? (
                <div>
                  {
                    selectedPaymentMethod.renderCheckoutForm({
                      organizationId,
                      configValue:
                        configMap[selectedPaymentMethod.config.configOptionKey],
                      onPaymentDataChange: setPaymentData,
                    }) as any
                  }
                </div>
              ) : null}

              <Button
                type="button"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={!canSubmit}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>Pay {formatMoney(subtotal)}</>
                )}
              </Button>
              <div className="text-muted-foreground text-xs">
                By placing your order, you agree to our terms and privacy
                policy.
              </div>
              </CardContent>
            </Card>
          </div>
        }
        rightSummary={rightSummary}
      />
    </div>
  );
}
