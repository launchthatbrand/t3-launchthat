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
import {
  EMPTY_CHECKOUT_DRAFT,
  useCheckoutDraftStore,
} from "../state/useCheckoutDraftStore";
import { CheckoutDesignDefault } from "./designs/CheckoutDesignDefault";
import { CheckoutDesignMinimal } from "./designs/CheckoutDesignMinimal";
import { CheckoutDesignSidebar } from "./designs/CheckoutDesignSidebar";

const apiAny = api as any;

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";
const DEFAULT_FUNNEL_SLUG = "__default_funnel__";

const isLocalCheckoutHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host.endsWith(".localhost");
};

type CartItem = {
  _id: string;
  productPostId: string;
  quantity: number;
  unitPrice?: number | null;
  product?: {
    _id: string;
    title?: string;
    slug?: string;
    isVirtual?: boolean;
  } | null;
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
  funnelId,
  funnelSlug,
  stepId,
  stepSlug,
  stepKind,
  orderId,
  // Legacy props (deprecated)
  checkoutId,
  checkoutSlug,
}: {
  organizationId?: string;
  funnelId?: string;
  funnelSlug?: string;
  stepId?: string;
  stepSlug?: string;
  stepKind?: string;
  orderId?: string;
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
  const [hasAppliedTestPrefill, setHasAppliedTestPrefill] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testPrefill, setTestPrefill] = useState<Record<
    string,
    unknown
  > | null>(null);

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

  useEffect(() => {
    if (hasAppliedTestPrefill) return;
    if (typeof window === "undefined") return;
    if (!isLocalCheckoutHost()) return;

    const params = new URLSearchParams(window.location.search);
    const enabled = params.get("test") === "true";
    if (!enabled) {
      setHasAppliedTestPrefill(true);
      return;
    }

    setTestMode(true);
    setTestPrefill({
      // Targeting Authorize.Net sandbox tokenization.
      paymentMethodId: "authorizenet",
      card: {
        name: "Test User",
        number: "4007000000027",
        expiry: "12/30",
        cvc: "900",
      },
    });

    setEmail(orgKey, "test.checkout@example.com");
    setShippingDraft(orgKey, {
      firstName: "Test",
      lastName: "User",
      phone: "555-555-5555",
      address1: "123 Test St",
      address2: "",
      city: "Testville",
      state: "CA",
      postcode: "90210",
      country: "US",
    });

    setHasAppliedTestPrefill(true);
  }, [hasAppliedTestPrefill, orgKey, setEmail, setShippingDraft]);

  const cart = useQuery(
    apiAny.plugins.commerce.cart.queries.getCart,
    guestSessionId ? { guestSessionId } : "skip",
  ) as { items?: CartItem[] } | undefined;

  const ensureDefaultFunnel = useMutation(
    apiAny.plugins.commerce.funnels.mutations.ensureDefaultFunnel,
  ) as (args: any) => Promise<any>;

  const ensureDefaultFunnelSteps = useMutation(
    apiAny.plugins.commerce.funnelSteps.mutations.ensureDefaultFunnelSteps,
  ) as (args: any) => Promise<any>;

  const replaceCart = useMutation(
    apiAny.plugins.commerce.cart.mutations.replaceCart,
  ) as (args: any) => Promise<any>;

  // Legacy checkout config support was removed in favor of funnel steps.
  const checkoutConfig = null as null;

  const resolvedStepById = useQuery(
    apiAny.plugins.commerce.funnelSteps.queries.getFunnelStepById,
    stepId ? { stepId, organizationId } : "skip",
  ) as any;

  const resolvedStepBySlug = useQuery(
    apiAny.plugins.commerce.funnelSteps.queries.getFunnelStepBySlug,
    !stepId && funnelSlug && stepSlug
      ? { funnelSlug, stepSlug, organizationId }
      : "skip",
  ) as any;

  const resolvedDefaultStep = useQuery(
    apiAny.plugins.commerce.funnelSteps.queries.getFunnelStepBySlug,
    !stepId && !funnelSlug && !stepSlug
      ? {
          funnelSlug: DEFAULT_FUNNEL_SLUG,
          stepSlug: "checkout",
          organizationId,
        }
      : "skip",
  ) as any;

  const resolvedStep = (
    stepId
      ? resolvedStepById
      : funnelSlug && stepSlug
        ? resolvedStepBySlug
        : resolvedDefaultStep
  ) as any;
  const effectiveStepKind =
    typeof resolvedStep?.kind === "string"
      ? (resolvedStep.kind as string)
      : stepKind;

  const orderQueryArgs = useMemo(() => {
    const raw = typeof orderId === "string" ? orderId.trim() : "";
    if (!raw) return "skip";
    return {
      orderId: raw,
      organizationId,
    };
  }, [orderId, organizationId]);

  const resolvedOrder = useQuery(
    apiAny.plugins.commerce.orders.queries.getOrder,
    orderQueryArgs,
  ) as
    | {
        orderId?: string;
        status?: string;
        total?: number;
        email?: string;
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

  const ecommerceSettings = useQuery(apiAny.core.options.get, {
    metaKey: "plugin.ecommerce.settings",
    type: "site",
    orgId: organizationId ?? null,
  }) as { metaValue?: unknown } | null | undefined;

  const hideShippingWhenVirtualOnly = useMemo(() => {
    const v =
      ecommerceSettings?.metaValue &&
      typeof ecommerceSettings.metaValue === "object" &&
      !Array.isArray(ecommerceSettings.metaValue)
        ? (ecommerceSettings.metaValue as Record<string, unknown>)
        : {};
    return v.hideShippingWhenVirtualOnly === true;
  }, [ecommerceSettings]);

  const isVirtualOnlyCart = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => item.product?.isVirtual === true);
  }, [items]);

  const shouldHideDeliveryFields =
    hideShippingWhenVirtualOnly && isVirtualOnlyCart;

  const selectedPaymentMethod = useMemo((): PaymentMethod | null => {
    if (!paymentMethodId) return null;
    return enabledPaymentMethods.find((m) => m.id === paymentMethodId) ?? null;
  }, [enabledPaymentMethods, paymentMethodId]);

  useEffect(() => {
    if (hasEnsuredDefaultCheckout) return;
    if (!guestSessionId) return;

    startTransition(() => {
      // Funnel-mode: ensure the default funnel exists (and its baseline steps) so checkout
      // can always redirect to the next step after successful payment.
      if (
        funnelSlug === DEFAULT_FUNNEL_SLUG ||
        (!funnelSlug && !stepSlug && !stepId)
      ) {
        void ensureDefaultFunnel({ organizationId })
          .catch(() => null)
          .then(() => ensureDefaultFunnelSteps({ organizationId }))
          .catch(() => null)
          .finally(() => setHasEnsuredDefaultCheckout(true));
        return;
      }

      setHasEnsuredDefaultCheckout(true);
    });
  }, [
    ensureDefaultFunnelSteps,
    ensureDefaultFunnel,
    guestSessionId,
    hasEnsuredDefaultCheckout,
    funnelSlug,
    organizationId,
    startTransition,
    stepId,
    stepSlug,
  ]);

  useEffect(() => {
    if (hasAppliedPredefinedProducts) return;
    if (!guestSessionId) return;

    // Funnel-mode predefined products (checkout step only)
    if (resolvedStep && resolvedStep.kind === "checkout") {
      const productIds = Array.isArray(
        resolvedStep.checkout?.predefinedProductPostIds,
      )
        ? resolvedStep.checkout.predefinedProductPostIds
        : [];
      if (productIds.length === 0) {
        setHasAppliedPredefinedProducts(true);
        return;
      }

      startTransition(() => {
        void replaceCart({ guestSessionId, productPostIds: productIds })
          .catch(() => null)
          .finally(() => setHasAppliedPredefinedProducts(true));
      });
      return;
    }
  }, [
    guestSessionId,
    hasAppliedPredefinedProducts,
    replaceCart,
    resolvedStep,
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

  useEffect(() => {
    if (!testMode) return;
    if (paymentMethodId) return;
    if (enabledPaymentMethods.length === 0) return;

    const preferred = enabledPaymentMethods.find(
      (m) => m.id === "authorizenet",
    );
    if (preferred) {
      setPaymentMethodId(orgKey, preferred.id);
    }
  }, [
    enabledPaymentMethods,
    orgKey,
    paymentMethodId,
    setPaymentMethodId,
    testMode,
  ]);

  const mustSelectPaymentMethod = enabledPaymentMethods.length > 0;
  const requiresPaymentData = Boolean(
    selectedPaymentMethod?.renderCheckoutForm,
  );
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
        funnelStepId:
          typeof resolvedStep?.stepId === "string"
            ? resolvedStep.stepId
            : undefined,
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
        .then((result: any) => {
          toast.success("Payment successful.");
          resetDraft(orgKey);
          setPaymentData(null);
          setIsPlacingOrder(false);

          if (
            result &&
            typeof result.redirectUrl === "string" &&
            result.redirectUrl
          ) {
            window.location.assign(result.redirectUrl);
            return;
          }

          // If the server couldn't compute a redirect (e.g., missing step context),
          // fall back to a best-effort thank-you page for the default funnel.
          const createdOrderId =
            result && typeof result.orderId === "string" ? result.orderId : "";
          if (createdOrderId) {
            window.location.assign(
              `/checkout/order-confirmed?orderId=${encodeURIComponent(createdOrderId)}`,
            );
          }
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "Payment failed");
          setIsPlacingOrder(false);
        });
    });
  };

  const checkoutDesign = (() => {
    const raw =
      typeof resolvedStep?.checkout?.design === "string"
        ? resolvedStep.checkout.design
        : undefined;
    if (raw === "minimal") return "minimal";
    if (raw === "sidebar") return "sidebar";
    return "default";
  })();

  // Step renderer (non-checkout steps). Use the `stepKind` prop as a fallback so we don't flash
  // checkout UI before the step query resolves (step query doesn't depend on guest cart session).
  if (
    typeof effectiveStepKind === "string" &&
    effectiveStepKind !== "checkout"
  ) {
    const headline =
      effectiveStepKind === "thankYou"
        ? "Order confirmed"
        : effectiveStepKind === "upsell"
          ? "Special offer"
          : "Step";

    const hasOrder = Boolean(
      resolvedOrder && typeof resolvedOrder === "object",
    );

    const funnelSlugLabel =
      typeof resolvedStep?.funnelSlug === "string"
        ? (resolvedStep.funnelSlug as string)
        : (funnelSlug ?? "");
    const stepSlugLabel =
      typeof resolvedStep?.stepSlug === "string"
        ? (resolvedStep.stepSlug as string)
        : (stepSlug ?? "");

    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">{headline}</h1>

        {effectiveStepKind === "thankYou" ? (
          <p className="text-muted-foreground mt-2 text-sm">
            {hasOrder
              ? "Thanks for your purchase. Your order details are below."
              : "This is a preview of the thank you page. Complete checkout to see real order details."}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
              <CardDescription>
                {hasOrder ? "Real order data" : "Placeholder preview"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Funnel</span>
                <code>{String(funnelSlugLabel ?? "")}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Step</span>
                <code>{String(stepSlugLabel ?? "")}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order</span>
                <code>
                  {hasOrder
                    ? String((resolvedOrder as any)?.orderId ?? orderId ?? "")
                    : (orderId ?? "(missing)")}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>
                  {hasOrder
                    ? String((resolvedOrder as any)?.email ?? "")
                    : "customer@example.com"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  {hasOrder
                    ? formatMoney(asNumber((resolvedOrder as any)?.total))
                    : formatMoney(99)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>
                  {hasOrder
                    ? String((resolvedOrder as any)?.status ?? "")
                    : "paid"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.assign("/checkout")}
            >
              Back to checkout
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="bg-background/70 fixed inset-0 z-50 grid place-items-center backdrop-blur-sm">
          <div className="bg-background w-full max-w-sm rounded-lg border p-6 shadow-lg">
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
              <div className="text-xl font-semibold">{"Checkout"}</div>
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

            {shouldHideDeliveryFields ? (
              <Card>
                <CardHeader>
                  <CardTitle>Customer details</CardTitle>
                  <CardDescription>
                    Your cart contains only virtual products, so we don’t need a
                    delivery address.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
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
                    <Label htmlFor="ship-phone">Phone (optional)</Label>
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
                </CardContent>
              </Card>
            ) : (
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
                    <Label htmlFor="ship-address2">
                      Apartment, suite, etc. (optional)
                    </Label>
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
            )}

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
                              pluginActiveMap[
                                m.config.pluginActiveOptionKey
                              ] === true;
                            const enabled =
                              paymentEnabledMap[
                                m.config.paymentEnabledOptionKey
                              ] === true;
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
                typeof selectedPaymentMethod.renderCheckoutForm ===
                  "function" ? (
                  <div>
                    {
                      selectedPaymentMethod.renderCheckoutForm({
                        organizationId,
                        configValue:
                          configMap[
                            selectedPaymentMethod.config.configOptionKey
                          ],
                        onPaymentDataChange: setPaymentData,
                        testMode,
                        testPrefill,
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
