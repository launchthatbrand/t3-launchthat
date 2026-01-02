"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

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
import { Skeleton } from "@acme/ui/skeleton";
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
    featuredImageUrl?: string;
  } | null;
};

type PaymentMethod = ReturnType<typeof getPaymentMethods>[number];

const CheckoutBrandHeader = ({
  logoUrl,
  name,
  isLoading,
}: {
  logoUrl?: string;
  name?: string;
  isLoading: boolean;
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <a href="/" className="flex items-center gap-3">
        {isLoading ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : logoUrl ? (
          // Use <img> to avoid requiring Next/Image in a shared package.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name ? `${name} logo` : "Organization logo"}
            className="h-10 w-10 rounded-full object-contain"
          />
        ) : (
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
            {name?.trim()?.[0]?.toUpperCase() ?? "P"}
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              name?.trim() || "Checkout"
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Lock className="h-3 w-3" />
            Secure checkout
          </div>
        </div>
      </a>
    </div>
  );
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMoney = (amount: number): string => `$${amount.toFixed(2)}`;

const safeJsonParse = (raw: unknown): unknown => {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getMetaValue = (
  meta: Array<{ key: string; value: unknown }>,
  key: string,
): unknown => meta.find((m) => m.key === key)?.value;

type ReceiptLineItem = {
  title: string;
  quantity: number;
  unitPrice: number;
};

const CheckoutShell = ({
  orgBrand,
  maxWidth = "max-w-6xl",
  children,
}: {
  orgBrand: { name?: string; logoUrl?: string; isLoading: boolean };
  maxWidth?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-muted/30 min-h-screen">
      <div className={`mx-auto w-full ${maxWidth} px-4 py-8`}>
        <CheckoutBrandHeader
          isLoading={orgBrand.isLoading}
          logoUrl={orgBrand.logoUrl}
          name={orgBrand.name}
        />
        <div className="mt-6">{children}</div>
        <div className="text-muted-foreground mt-10 border-t pt-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>Payments are processed securely.</div>
            <div>
              <a href="/" className="hover:text-foreground underline">
                Return to site
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
            const imageUrl =
              typeof item.product?.featuredImageUrl === "string"
                ? item.product.featuredImageUrl
                : "";
            return (
              <div
                key={item._id}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={item.product?.title ?? "Product"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {item.product?.title ?? "Product"}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                      <span>Qty {qty}</span>
                      <span>·</span>
                      <span>{formatMoney(unit)} each</span>
                    </div>
                  </div>
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

const ThankYouReceipt = ({
  isLoading,
  orderId,
  email,
  status,
  paymentMethodId,
  gateway,
  transactionId,
  items,
  total,
}: {
  isLoading: boolean;
  orderId: string;
  email: string;
  status: string;
  paymentMethodId: string;
  gateway: string;
  transactionId: string;
  items: Array<ReceiptLineItem>;
  total: number;
}) => {
  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              {isLoading ? (
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Receipt</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading your order…"
                  : "Keep this page for your records."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Order</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <code className="truncate">{orderId}</code>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Email</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-44" />
                ) : (
                  <span className="truncate">{email}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="capitalize">{status || "paid"}</span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Payment</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-28" />
                ) : (
                  <span className="truncate">
                    {paymentMethodId || gateway || "card"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Transaction</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <code className="truncate">{transactionId || "—"}</code>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Total</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <span className="text-base font-semibold">
                    {formatMoney(total)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="text-sm font-semibold">Items</div>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-4/6" />
              </div>
            ) : (
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-muted-foreground text-sm">—</div>
                ) : (
                  items.map((i, idx) => (
                    <div
                      key={`${i.title}-${idx}`}
                      className="flex items-start justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{i.title}</div>
                        <div className="text-muted-foreground text-xs">
                          Qty {i.quantity} · {formatMoney(i.unitPrice)} each
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatMoney(i.unitPrice * i.quantity)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => window.location.assign("/")}
          disabled={isLoading}
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.assign("/checkout")}
          disabled={isLoading}
        >
          Back to checkout
        </Button>
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
  const [hasAppliedAccountPrefill, setHasAppliedAccountPrefill] = useState(false);
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

  const me = useQuery(apiAny.core.users.queries.getMe, {}) as
    | {
        _id: string;
        email: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        addresses?: Array<{
          fullName: string;
          addressLine1: string;
          addressLine2?: string;
          city: string;
          stateOrProvince: string;
          postalCode: string;
          country: string;
          phoneNumber?: string;
        }>;
      }
    | null
    | undefined;

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
    if (hasAppliedAccountPrefill) return;
    if (testMode) return;
    if (!me) {
      if (me === null) {
        setHasAppliedAccountPrefill(true);
      }
      return;
    }

    const nameFromUser = (me.name ?? "").trim();
    const firstNameFromUser = (me.firstName ?? "").trim();
    const lastNameFromUser = (me.lastName ?? "").trim();
    const fullNameFromUser =
      `${firstNameFromUser} ${lastNameFromUser}`.trim() || nameFromUser;
    const inferredFirstName =
      firstNameFromUser || (fullNameFromUser.split(" ")[0] ?? "").trim();
    const inferredLastName =
      lastNameFromUser ||
      (fullNameFromUser.split(" ").slice(1).join(" ") ?? "").trim();

    const addr = Array.isArray(me.addresses) ? me.addresses[0] : undefined;

    if (!email.trim()) {
      setEmail(orgKey, me.email);
    }

    const nextShipping = { ...shipping };
    if (!nextShipping.firstName.trim() && inferredFirstName) {
      nextShipping.firstName = inferredFirstName;
    }
    if (!nextShipping.lastName.trim() && inferredLastName) {
      nextShipping.lastName = inferredLastName;
    }
    if (!nextShipping.phone.trim() && typeof me.phoneNumber === "string" && me.phoneNumber.trim()) {
      nextShipping.phone = me.phoneNumber.trim();
    }
    if (!nextShipping.phone.trim() && addr?.phoneNumber?.trim()) {
      nextShipping.phone = addr.phoneNumber.trim();
    }
    if (!nextShipping.address1.trim() && addr?.addressLine1?.trim()) {
      nextShipping.address1 = addr.addressLine1.trim();
    }
    if (!nextShipping.address2.trim() && addr?.addressLine2?.trim()) {
      nextShipping.address2 = addr.addressLine2.trim();
    }
    if (!nextShipping.city.trim() && addr?.city?.trim()) {
      nextShipping.city = addr.city.trim();
    }
    if (!nextShipping.state.trim() && addr?.stateOrProvince?.trim()) {
      nextShipping.state = addr.stateOrProvince.trim();
    }
    if (!nextShipping.postcode.trim() && addr?.postalCode?.trim()) {
      nextShipping.postcode = addr.postalCode.trim();
    }
    if (!nextShipping.country.trim() && addr?.country?.trim()) {
      nextShipping.country = addr.country.trim();
    }

    setShippingDraft(orgKey, nextShipping);
    setHasAppliedAccountPrefill(true);
  }, [email, hasAppliedAccountPrefill, me, orgKey, setEmail, setShippingDraft, shipping, testMode]);

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

  // Resolve organization branding without auth (checkout is public).
  // Prefer custom domain resolution; fall back to "<slug>.localhost" in dev.
  const hostname = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.hostname ?? "";
  }, []);
  const subdomainSlug = useMemo(() => {
    if (!hostname) return "";
    const parts = hostname.split(".").filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
      return parts[0] ?? "";
    }
    return "";
  }, [hostname]);

  const orgByCustomDomain = useQuery(
    apiAny.core.organizations.queries.getByCustomDomain,
    hostname ? { hostname } : "skip",
  ) as { name?: string; logo?: string | undefined | null } | null | undefined;
  const orgBySlug = useQuery(
    apiAny.core.organizations.queries.getBySlug,
    !orgByCustomDomain && subdomainSlug ? { slug: subdomainSlug } : "skip",
  ) as { name?: string; logo?: string | undefined | null } | null | undefined;

  const orgBrand = useMemo(() => {
    const candidate = (orgByCustomDomain ?? orgBySlug) as
      | { name?: string; logo?: string | undefined | null }
      | null
      | undefined;
    const org =
      candidate && typeof candidate === "object" ? candidate : undefined;
    return {
      name:
        org && typeof org.name === "string" && org.name.trim().length > 0
          ? org.name
          : undefined,
      logoUrl:
        org && typeof org.logo === "string" && org.logo.trim().length > 0
          ? org.logo
          : undefined,
      isLoading:
        (Boolean(hostname) && orgByCustomDomain === undefined) ||
        (!orgByCustomDomain &&
          Boolean(subdomainSlug) &&
          orgBySlug === undefined),
    };
  }, [hostname, orgByCustomDomain, orgBySlug, subdomainSlug]);

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

  const createIdempotencyKey = (): string => {
    try {
      if (typeof window !== "undefined" && "crypto" in window) {
        // Modern browsers
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const id = (window.crypto as any).randomUUID?.();
        if (typeof id === "string" && id.trim()) return id;
      }
    } catch {
      // ignore
    }
    return `chk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const toUserSafeCheckoutError = (err: unknown): string => {
    const message = err instanceof Error ? err.message : "";
    const normalized = message.trim().toLowerCase();

    if (normalized.includes("cart is empty")) {
      return "Your cart is empty.";
    }
    if (
      normalized.includes("missing") &&
      normalized.includes("payment token")
    ) {
      return "Payment details are incomplete. Please re-enter your card.";
    }
    if (normalized.includes("missing cart identity")) {
      return "Your session expired. Please refresh and try again.";
    }
    if (normalized.includes("invalid order total")) {
      return "Your order total looks invalid. Please refresh and try again.";
    }

    // Default: do not leak server/payment details.
    return "Payment failed. Please try again or use a different payment method.";
  };

  const handlePlaceOrder = () => {
    if (!guestSessionId) return;
    setIsPlacingOrder(true);
    startTransition(() => {
      const fullName = `${shipping.firstName} ${shipping.lastName}`.trim();
      void placeOrder({
        organizationId,
        guestSessionId,
        userId: me && typeof me._id === "string" ? me._id : undefined,
        funnelStepId:
          typeof resolvedStep?.stepId === "string"
            ? resolvedStep.stepId
            : undefined,
        idempotencyKey: createIdempotencyKey(),
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
          console.error("[checkout] placeOrder failed", err);
          toast.error(toUserSafeCheckoutError(err));
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

    const isOrderLoading =
      orderQueryArgs !== "skip" && resolvedOrder === undefined;
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

    const metaEntries = Array.isArray((resolvedOrder as any)?.meta)
      ? ((resolvedOrder as any).meta as Array<{ key: string; value: unknown }>)
      : [];

    const itemsRaw =
      getMetaValue(metaEntries, "order.itemsJson") ??
      getMetaValue(metaEntries, "order:payload");

    const parsed = safeJsonParse(itemsRaw);
    const itemsFromNew: Array<ReceiptLineItem> = Array.isArray(parsed)
      ? (parsed as Array<any>).map((i) => ({
          title: typeof i?.title === "string" ? i.title : "Product",
          quantity: Math.max(1, Math.floor(asNumber(i?.quantity))),
          unitPrice: asNumber(i?.unitPrice),
        }))
      : [];
    const itemsFromLegacy: Array<ReceiptLineItem> =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? Array.isArray((parsed as any).items)
          ? ((parsed as any).items as Array<any>).map((i) => ({
              title: typeof i?.title === "string" ? i.title : "Product",
              quantity: Math.max(1, Math.floor(asNumber(i?.quantity))),
              unitPrice: asNumber(i?.unitPrice),
            }))
          : []
        : [];
    const receiptItems =
      itemsFromNew.length > 0 ? itemsFromNew : itemsFromLegacy;

    const resolvedOrderId = hasOrder
      ? String((resolvedOrder as any)?.orderId ?? orderId ?? "")
      : (orderId ?? "");
    const resolvedEmail = hasOrder
      ? String((resolvedOrder as any)?.email ?? "")
      : "";
    const resolvedTotal =
      hasOrder && typeof (resolvedOrder as any)?.total === "number"
        ? asNumber((resolvedOrder as any)?.total)
        : receiptItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const paymentMethodIdFromMeta = getMetaValue(
      metaEntries,
      "order.paymentMethodId",
    );
    const gatewayFromMeta = getMetaValue(metaEntries, "order.gateway");
    const transactionIdFromMeta = getMetaValue(
      metaEntries,
      "order.gatewayTransactionId",
    );

    return (
      <CheckoutShell orgBrand={orgBrand} maxWidth="max-w-3xl">
        <h1 className="text-2xl font-semibold">{headline}</h1>

        {effectiveStepKind === "thankYou" ? (
          <p className="text-muted-foreground mt-2 text-sm">
            {isOrderLoading
              ? "Loading your order…"
              : hasOrder
                ? "Thanks for your purchase. Your order details are below."
                : "This is a preview of the thank you page. Complete checkout to see real order details."}
          </p>
        ) : null}

        {effectiveStepKind === "thankYou" ? (
          <ThankYouReceipt
            isLoading={isOrderLoading}
            orderId={resolvedOrderId || "(missing)"}
            email={resolvedEmail || "customer@example.com"}
            status={String((resolvedOrder as any)?.status ?? "paid")}
            paymentMethodId={
              typeof paymentMethodIdFromMeta === "string"
                ? paymentMethodIdFromMeta
                : ""
            }
            gateway={typeof gatewayFromMeta === "string" ? gatewayFromMeta : ""}
            transactionId={
              typeof transactionIdFromMeta === "string"
                ? transactionIdFromMeta
                : ""
            }
            items={receiptItems}
            total={resolvedTotal}
          />
        ) : (
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
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
              </CardContent>
            </Card>
          </div>
        )}
      </CheckoutShell>
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
    <CheckoutShell orgBrand={orgBrand} maxWidth="max-w-6xl">
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
    </CheckoutShell>
  );
}
