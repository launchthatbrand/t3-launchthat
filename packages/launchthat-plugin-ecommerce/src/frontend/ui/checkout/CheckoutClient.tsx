"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useAction, useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Controller } from "react-hook-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { CountryDropdown } from "@acme/ui/country-dropdown";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NoiseBackground } from "@acme/ui/noise-background";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui/toast";

import type { CheckoutFormValues } from "./form/useCheckoutFormSync";
import type { CartItem, ReceiptLineItem } from "./types";
import { getPaymentMethods } from "../../../payments/registry";
import {
  EMPTY_CHECKOUT_DRAFT,
  useCheckoutDraftStore,
} from "../../state/useCheckoutDraftStore";
import { CheckoutDesignDefault } from "../designs/CheckoutDesignDefault";
import { CheckoutDesignMinimal } from "../designs/CheckoutDesignMinimal";
import { CheckoutDesignSidebar } from "../designs/CheckoutDesignSidebar";
import { AddressAutocompleteInput } from "./components/AddressAutocompleteInput";
import { CheckoutPhoneField } from "./components/CheckoutPhoneField";
import { CheckoutShell } from "./components/CheckoutShell";
import { OrderSummary } from "./components/OrderSummary";
import { ThankYouReceipt } from "./components/ThankYouReceipt";
import { useCheckoutFormSync } from "./form/useCheckoutFormSync";
import { safeJsonParse } from "./utils/json";
import { getMetaValue } from "./utils/meta";
import { formatMoney } from "./utils/money";
import { asNumber } from "./utils/number";

const apiAny = api as any;

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";
const DEFAULT_FUNNEL_SLUG = "__default_funnel__";

const isLocalCheckoutHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host.endsWith(".localhost");
};

type PaymentMethod = ReturnType<typeof getPaymentMethods>[number];

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
  clerk,
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
  clerk?: {
    isLoaded: boolean;
    isSignedIn?: boolean;
    // Post-checkout access verification (implemented by the portal wrapper).
    startEmailLinkSignIn?: (args: {
      emailAddress: string;
      redirectUrl: string;
    }) => Promise<void>;
    startPhoneOtpSignIn?: (args: {
      phoneNumber: string;
      emailAddress?: string;
    }) => Promise<void>;
    attemptPhoneOtpSignIn?: (args: {
      code: string;
      emailAddress?: string;
    }) => Promise<void>;
  };
}) {
  const orgKey = organizationId ?? "portal-root";
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [hasAppliedAccountPrefill, setHasAppliedAccountPrefill] =
    useState(false);
  const draft = useCheckoutDraftStore(
    (s) => s.draftsByOrg[orgKey] ?? EMPTY_CHECKOUT_DRAFT,
  );
  const setDraft = useCheckoutDraftStore((s) => s.setDraft);
  const setEmail = useCheckoutDraftStore((s) => s.setEmail);
  const setShippingDraft = useCheckoutDraftStore((s) => s.setShipping);
  const setDeliveryDraft = useCheckoutDraftStore((s) => s.setDelivery);
  const resetDraft = useCheckoutDraftStore((s) => s.resetDraft);

  const email = draft.email;
  const [paymentData, setPaymentData] = useState<unknown | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const shipping = draft.shipping;
  const delivery = draft.delivery;

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

  const [accountError, setAccountError] = useState<string | null>(null);
  const [isPreparingAccount, setIsPreparingAccount] = useState(false);
  const [prepareAccountError, setPrepareAccountError] = useState<string | null>(
    null,
  );
  const [hasPreparedAccount, setHasPreparedAccount] = useState(false);

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
    if (
      !nextShipping.phone.trim() &&
      typeof me.phoneNumber === "string" &&
      me.phoneNumber.trim()
    ) {
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
  }, [
    email,
    hasAppliedAccountPrefill,
    me,
    orgKey,
    setEmail,
    setShippingDraft,
    shipping,
    testMode,
  ]);

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

  const isCartQueryActive = Boolean(guestSessionId);
  const isCartLoading = isCartQueryActive && cart === undefined;
  const hasResolvedCart = !isCartQueryActive || cart !== undefined;

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

  const claimOrderAfterAuth = useMutation(
    apiAny.plugins.commerce.checkout.mutations.claimOrderAfterAuth,
  ) as (args: {
    organizationId: string;
    orderId: string;
    checkoutToken?: string;
    force?: boolean;
  }) => Promise<{
    ok?: boolean;
    claimed?: boolean;
  }>;

  const [isClaimingOrder, setIsClaimingOrder] = useState(false);
  const [claimOrderError, setClaimOrderError] = useState<string | null>(null);
  const [hasClaimedOrder, setHasClaimedOrder] = useState(false);
  const [hasRedirectedAfterAuth, setHasRedirectedAfterAuth] = useState(false);
  const [hasAttemptedLinkEmail, setHasAttemptedLinkEmail] = useState(false);
  const [claimMismatch, setClaimMismatch] = useState<{
    orderEmail: string;
    accountEmail: string;
  } | null>(null);
  const [isForceClaiming, setIsForceClaiming] = useState(false);
  const [forceClaimError, setForceClaimError] = useState<string | null>(null);
  const resolvedOrderMetaEntries = useMemo(() => {
    return Array.isArray((resolvedOrder as any)?.meta)
      ? ((resolvedOrder as any).meta as Array<{ key: string; value: unknown }>)
      : [];
  }, [resolvedOrder]);
  const orderRequiresAccessVerification = useMemo(() => {
    const raw = getMetaValue(
      resolvedOrderMetaEntries,
      "order.requiresAccessVerification",
    );
    return raw === true || raw === "true" || raw === 1 || raw === "1";
  }, [resolvedOrderMetaEntries]);

  const checkoutTokenFromUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const raw = new URLSearchParams(window.location.search).get("t");
    return typeof raw === "string" ? raw.trim() : "";
  }, []);

  // For account-required purchases, we upsert the Clerk user + create a pending core user
  // immediately after purchase, so the confirmation step is sign-in only.
  useEffect(() => {
    if (!orderRequiresAccessVerification) return;
    if (me !== null) return; // already signed in or still loading
    if (hasPreparedAccount) return;
    if (resolvedOrder === undefined) return; // still loading
    if (typeof orderId !== "string" || !orderId.trim()) return;
    if (typeof organizationId !== "string" || !organizationId.trim()) return;
    if (!checkoutTokenFromUrl) {
      setPrepareAccountError("Missing checkout token. Please refresh.");
      return;
    }

    setIsPreparingAccount(true);
    setPrepareAccountError(null);
    void fetch("/api/clerk/users/upsert-for-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        orderId: orderId.trim(),
        checkoutToken: checkoutTokenFromUrl,
      }),
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => null)) as any;
        if (!res.ok) {
          const message =
            json && typeof json.error === "string"
              ? json.error
              : "Could not prepare your account.";
          throw new Error(message);
        }
        setHasPreparedAccount(true);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "";
        setPrepareAccountError(
          message.trim() ? message : "Could not prepare your account.",
        );
      })
      .finally(() => setIsPreparingAccount(false));
  }, [
    checkoutTokenFromUrl,
    hasPreparedAccount,
    me,
    orderId,
    orderRequiresAccessVerification,
    organizationId,
    resolvedOrder,
  ]);

  useEffect(() => {
    if (!clerk?.isSignedIn) return;
    if (!clerk.isLoaded) return;
    if (hasClaimedOrder) return;
    if (!orderRequiresAccessVerification) return;
    if (claimMismatch) return;
    if (typeof orderId !== "string" || !orderId.trim()) return;
    if (typeof organizationId !== "string" || !organizationId.trim()) return;

    setIsClaimingOrder(true);
    setClaimOrderError(null);
    void claimOrderAfterAuth({
      organizationId,
      orderId: orderId.trim(),
    })
      .then((res) => {
        if (res?.ok) {
          setHasClaimedOrder(true);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "";
        if (message.includes("verification does not match this order")) {
          const buyerEmailFromMeta = getMetaValue(
            resolvedOrderMetaEntries,
            "order.customerEmail",
          );
          const orderEmail =
            (typeof buyerEmailFromMeta === "string" ? buyerEmailFromMeta : "").trim() ||
            (typeof (resolvedOrder as any)?.email === "string"
              ? String((resolvedOrder as any).email).trim()
              : "");
          const accountEmail =
            me && typeof (me as any)?.email === "string"
              ? String((me as any).email).trim()
              : "";
          setClaimMismatch({ orderEmail, accountEmail });
          setClaimOrderError(null);
          return;
        }
        setClaimOrderError(message || "Could not link your order. Please try again.");
      })
      .finally(() => setIsClaimingOrder(false));
  }, [
    claimOrderAfterAuth,
    claimMismatch,
    clerk?.isLoaded,
    clerk?.isSignedIn,
    hasClaimedOrder,
    me,
    orderId,
    orderRequiresAccessVerification,
    organizationId,
    resolvedOrder,
    resolvedOrderMetaEntries,
  ]);

  // After post-purchase auth completes (or if the order is already verified), automatically continue.
  useEffect(() => {
    if (hasRedirectedAfterAuth) return;
    if (effectiveStepKind !== "thankYou") return;
    if (!clerk?.isLoaded) return;
    if (!clerk.isSignedIn) return;
    if (orderRequiresAccessVerification && !hasClaimedOrder) return;
    if (typeof orderId !== "string" || !orderId.trim()) return;
    if (typeof organizationId !== "string" || !organizationId.trim()) return;

    const shouldTryLinkEmail =
      orderRequiresAccessVerification &&
      Boolean(checkoutTokenFromUrl) &&
      !hasAttemptedLinkEmail;

    if (!shouldTryLinkEmail) {
      setHasRedirectedAfterAuth(true);
      window.location.assign("/");
      return;
    }

    setHasAttemptedLinkEmail(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    void fetch("/api/clerk/users/link-email-for-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        orderId: orderId.trim(),
        checkoutToken: checkoutTokenFromUrl,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeout);
        const json = (await res.json().catch(() => null)) as any;
        if (!res.ok) {
          const code = json && typeof json.code === "string" ? json.code : "";
          if (code && code !== "email_owned_by_other_user") {
            // Non-blocking: user is already signed in and order is claimed.
            toast.error(
              "Signed in, but we couldn’t link your email automatically.",
            );
          }
          return;
        }
        // If linked, silently proceed; the user shouldn't have to care.
      })
      .catch(() => {
        clearTimeout(timeout);
      })
      .finally(() => {
        clearTimeout(timeout);
        setHasRedirectedAfterAuth(true);
        window.location.assign("/");
      });
  }, [
    checkoutTokenFromUrl,
    clerk?.isLoaded,
    clerk?.isSignedIn,
    effectiveStepKind,
    hasClaimedOrder,
    hasAttemptedLinkEmail,
    hasRedirectedAfterAuth,
    orderId,
    orderRequiresAccessVerification,
    organizationId,
  ]);

  const placeOrder = useAction(
    apiAny.plugins.commerce.checkout.actions.placeOrder,
  ) as (args: any) => Promise<any>;

  const items = useMemo(
    () => (Array.isArray(cart?.items) ? (cart?.items ?? []) : []),
    [cart],
  );

  const requiresAccountForCart = useMemo(() => {
    return items.some((item) => Boolean(item.product?.requiresAccount));
  }, [items]);

  // Only prompt signup when we *know* the user is logged out (me === null).
  const needsAccount = requiresAccountForCart && me === null;

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const unit = typeof item.unitPrice === "number" ? item.unitPrice : 0;
      return sum + unit * (item.quantity ?? 0);
    }, 0);
  }, [items]);
  const total = Math.max(
    0,
    subtotal - (Number.isFinite(discountAmount) ? discountAmount : 0),
  );
  const isFreeOrder = total <= 0;

  const validateDiscountCode = useMutation(
    apiAny.plugins.commerce.discounts.mutations.validateDiscountCode,
  ) as (args: any) => Promise<any>;

  const handleApplyDiscount = (code: string) => {
    const trimmed = typeof code === "string" ? code.trim() : "";
    if (!trimmed) return;

    void validateDiscountCode({
      organizationId,
      code: trimmed,
      subtotal,
    })
      .then((res) => {
        if (!res || res.ok !== true) {
          const reason =
            typeof res?.reason === "string" ? res.reason : "Invalid coupon.";
          setAppliedCouponCode(null);
          setDiscountAmount(0);
          toast.error(reason);
          return;
        }

        const applied =
          typeof res.appliedCode === "string" ? res.appliedCode : trimmed;
        const amount =
          typeof res.discountAmount === "number" ? res.discountAmount : 0;

        setAppliedCouponCode(applied);
        setDiscountAmount(amount);
        toast.success("Coupon applied.");
      })
      .catch(() => {
        toast.error("Failed to apply coupon.");
      });
  };

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
  // Prefer custom domain resolution; fall back to "<slug>.<rootDomain>" subdomain resolution.
  const hostname = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.hostname ?? "";
  }, []);
  const subdomainSlug = useMemo(() => {
    if (!hostname) return "";
    const host = hostname.toLowerCase().replace(/^www\./, "");

    // Localhost: <slug>.localhost
    if (host.endsWith(".localhost")) {
      return host.split(".")[0] ?? "";
    }

    // Production/staging: <slug>.<rootDomain>
    const rootDomainRaw =
      typeof process !== "undefined"
        ? (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "")
        : "";
    const rootDomain = rootDomainRaw
      .toLowerCase()
      .replace(/^www\./, "")
      .trim();
    if (!rootDomain) return "";

    if (
      host !== rootDomain &&
      host !== `www.${rootDomain}` &&
      host.endsWith(`.${rootDomain}`)
    ) {
      const slug = host.slice(0, -(rootDomain.length + 1));
      return slug || "";
    }

    return "";
  }, [hostname]);

  const shouldTryCustomDomain = useMemo(() => {
    if (!hostname) return false;
    const host = hostname.toLowerCase().replace(/^www\./, "");
    const rootDomainRaw =
      typeof process !== "undefined"
        ? (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "")
        : "";
    const rootDomain = rootDomainRaw
      .toLowerCase()
      .replace(/^www\./, "")
      .trim();

    // If this is a first-party subdomain of our root domain, don't treat it as a custom domain.
    if (rootDomain && host !== rootDomain && host.endsWith(`.${rootDomain}`)) {
      return false;
    }

    return true;
  }, [hostname]);

  const orgByCustomDomain = useQuery(
    apiAny.core.organizations.queries.getByCustomDomain,
    shouldTryCustomDomain && hostname ? { hostname } : "skip",
  ) as { name?: string; logo?: string | undefined | null } | null | undefined;
  const resolvedOrgByCustomDomain = shouldTryCustomDomain
    ? orgByCustomDomain
    : null;
  const orgBySlug = useQuery(
    apiAny.core.organizations.queries.getBySlug,
    !resolvedOrgByCustomDomain && subdomainSlug
      ? { slug: subdomainSlug }
      : "skip",
  ) as { name?: string; logo?: string | undefined | null } | null | undefined;

  const orgBrand = useMemo(() => {
    const candidate = (resolvedOrgByCustomDomain ?? orgBySlug) as
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
        (shouldTryCustomDomain &&
          Boolean(hostname) &&
          orgByCustomDomain === undefined) ||
        (!resolvedOrgByCustomDomain &&
          Boolean(subdomainSlug) &&
          orgBySlug === undefined),
    };
  }, [
    hostname,
    orgByCustomDomain,
    orgBySlug,
    resolvedOrgByCustomDomain,
    shouldTryCustomDomain,
    subdomainSlug,
  ]);

  const hasNonVirtualProducts = useMemo(() => {
    if (!hasResolvedCart) return false;
    if (items.length === 0) return false;
    return items.some((item) => item.product?.isVirtual !== true);
  }, [hasResolvedCart, items]);

  const {
    form,
    formEmail,
    formShippingPhone,
    formPaymentMethodId,
    formShipToDifferentAddress,
  } = useCheckoutFormSync({
    orgKey,
    draft,
    setDraft,
    allowDifferentShipping: hasNonVirtualProducts,
    isFreeOrder,
    enabledPaymentMethodIds: enabledPaymentMethods.map((m) => m.id),
  });
  const { control, getValues, setValue, formState } = form;
  const paymentMethodId = formPaymentMethodId;

  const applyGeoapifySuggestion = (
    prefix: "shipping" | "delivery",
    s: {
      address1: string;
      address2: string;
      city: string;
      state: string;
      postcode: string;
      countryCode: string;
    },
  ) => {
    const current = getValues()[prefix];
    const currentAddress2 =
      current && typeof current.address2 === "string" ? current.address2 : "";
    const suggestedAddress2 = typeof s.address2 === "string" ? s.address2 : "";
    const suggestedLooksLikeUnit =
      /(\bapt\b|\bapartment\b|\bsuite\b|\bste\b|\bunit\b|\bfloor\b|\bflr\b|#)/i.test(
        suggestedAddress2,
      );

    setValue(`${prefix}.address1`, s.address1 ?? "", { shouldDirty: true });
    // Geoapify `address_line2` is often "City, State ZIP, Country".
    // Never overwrite Address 2 (apt/suite) with locality. Only fill it if it
    // actually looks like a unit AND the user hasn't already entered one.
    if (!currentAddress2.trim() && suggestedLooksLikeUnit) {
      setValue(`${prefix}.address2`, suggestedAddress2, { shouldDirty: true });
    }
    setValue(`${prefix}.city`, s.city ?? "", { shouldDirty: true });
    setValue(`${prefix}.state`, s.state ?? "", { shouldDirty: true });
    setValue(`${prefix}.postcode`, s.postcode ?? "", { shouldDirty: true });
    if (s.countryCode) {
      setValue(`${prefix}.country`, s.countryCode, { shouldDirty: true });
    }
  };

  useEffect(() => {
    if (!hasNonVirtualProducts && formShipToDifferentAddress) {
      setValue("shipToDifferentAddress", false, { shouldDirty: true });
    }
  }, [formShipToDifferentAddress, hasNonVirtualProducts, setValue]);

  const effectivePaymentMethodId =
    paymentMethodId || enabledPaymentMethods[0]?.id || "";

  const selectedPaymentMethod = useMemo((): PaymentMethod | null => {
    if (!effectivePaymentMethodId) return null;
    return (
      enabledPaymentMethods.find((m) => m.id === effectivePaymentMethodId) ??
      null
    );
  }, [effectivePaymentMethodId, enabledPaymentMethods]);

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
    // For free orders, force a non-gateway payment method and clear any gateway token.
    if (!isFreeOrder) return;
    if (paymentMethodId !== "free") {
      setValue("paymentMethodId", "free", { shouldDirty: true });
    }
    setPaymentData(null);
  }, [isFreeOrder, paymentMethodId, setValue]);

  useEffect(() => {
    if (enabledPaymentMethods.length === 0) return;
    if (isFreeOrder) return;
    const firstId = enabledPaymentMethods[0]!.id;
    const isValid = enabledPaymentMethods.some((m) => m.id === paymentMethodId);
    if (!paymentMethodId || !isValid) {
      setValue("paymentMethodId", firstId, { shouldDirty: true });
    }
  }, [enabledPaymentMethods, isFreeOrder, paymentMethodId, setValue]);

  useEffect(() => {
    if (!testMode) return;
    if (paymentMethodId) return;
    if (enabledPaymentMethods.length === 0) return;

    const preferred = enabledPaymentMethods.find(
      (m) => m.id === "authorizenet",
    );
    if (preferred) {
      setValue("paymentMethodId", preferred.id, { shouldDirty: true });
    }
  }, [enabledPaymentMethods, paymentMethodId, setValue, testMode]);

  const mustSelectPaymentMethod = enabledPaymentMethods.length > 0;
  const showPaymentMethodSelector = enabledPaymentMethods.length > 1;
  const requiresPaymentData = Boolean(
    selectedPaymentMethod?.renderCheckoutForm,
  );
  // Avoid forcing resolver validation on initial page load (which can surface as
  // noisy runtime ZodErrors in dev). We'll validate on submit/touch instead..
  const canValidateNow = formState.isSubmitted || formState.submitCount > 0;
  const canSubmit =
    items.length > 0 &&
    (!canValidateNow || formState.isValid) &&
    !isPending &&
    !isPlacingOrder &&
    (!mustSelectPaymentMethod ||
      paymentMethodId.trim().length > 0 ||
      isFreeOrder) &&
    (!requiresPaymentData || paymentData !== null || isFreeOrder);

  const [mobileSummaryValue, setMobileSummaryValue] = useState<string>();
  const mobileSummaryOpen = mobileSummaryValue === "summary";

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

  const startPlaceOrder = (values: CheckoutFormValues) => {
    if (!guestSessionId) return;
    const billingForOrder = values.shipping;
    const deliveryForOrder = values.delivery;
    const shippingForOrder =
      formShipToDifferentAddress && hasNonVirtualProducts
        ? deliveryForOrder
        : billingForOrder;
    const emailForOrder = values.email;

    setIsPlacingOrder(true);
    startTransition(() => {
      const billingName =
        `${billingForOrder.firstName} ${billingForOrder.lastName}`.trim();
      const shippingName =
        `${shippingForOrder.firstName} ${shippingForOrder.lastName}`.trim();
      const effectiveUserId =
        me && typeof me._id === "string" ? me._id : undefined;

      void placeOrder({
        organizationId,
        guestSessionId,
        userId: effectiveUserId,
        funnelStepId:
          typeof resolvedStep?.stepId === "string"
            ? resolvedStep.stepId
            : undefined,
        idempotencyKey: createIdempotencyKey(),
        email: emailForOrder.trim(),
        billing: {
          name: billingName || null,
          email: emailForOrder.trim(),
          phone: billingForOrder.phone.trim() || null,
          address1: billingForOrder.address1.trim() || null,
          address2: billingForOrder.address2.trim() || null,
          city: billingForOrder.city.trim() || null,
          state: billingForOrder.state.trim() || null,
          postcode: billingForOrder.postcode.trim() || null,
          country: billingForOrder.country.trim() || null,
        },
        shipping: {
          name: shippingName || billingName || null,
          phone: billingForOrder.phone.trim() || null,
          address1: shippingForOrder.address1.trim() || null,
          address2: shippingForOrder.address2.trim() || null,
          city: shippingForOrder.city.trim() || null,
          state: shippingForOrder.state.trim() || null,
          postcode: shippingForOrder.postcode.trim() || null,
          country: shippingForOrder.country.trim() || null,
        },
        paymentMethodId,
        paymentData,
        couponCode: appliedCouponCode ?? undefined,
      })
        .then((result: any) => {
          toast.success(isFreeOrder ? "Order placed." : "Payment successful.");
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
            const token =
              result && typeof result.checkoutToken === "string"
                ? result.checkoutToken
                : "";
            const tokenParam = token ? `&t=${encodeURIComponent(token)}` : "";
            window.location.assign(
              `/checkout/order-confirmed?orderId=${encodeURIComponent(createdOrderId)}${tokenParam}`,
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

  const handlePlaceOrder = form.handleSubmit((values) => {
    startPlaceOrder(values);
  });

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
    const requiresAccessVerificationRaw = getMetaValue(
      metaEntries,
      "order.requiresAccessVerification",
    );
    const requiresAccessVerification =
      requiresAccessVerificationRaw === true ||
      requiresAccessVerificationRaw === "true" ||
      requiresAccessVerificationRaw === 1 ||
      requiresAccessVerificationRaw === "1";

    const buyerEmailFromMeta = getMetaValue(metaEntries, "order.customerEmail");
    const buyerPhoneFromMeta = getMetaValue(metaEntries, "order.customerPhone");
    const buyerEmail =
      (typeof buyerEmailFromMeta === "string"
        ? buyerEmailFromMeta
        : ""
      ).trim() || (resolvedEmail || "").trim();
    const buyerPhone = (
      typeof buyerPhoneFromMeta === "string" ? buyerPhoneFromMeta : ""
    ).trim();

    const forceClaimWithConfirmation = async () => {
      if (!orderRequiresAccessVerification) return;
      if (!checkoutTokenFromUrl) {
        setForceClaimError("Missing checkout token. Please refresh the page.");
        return;
      }
      if (typeof orderId !== "string" || !orderId.trim()) return;
      if (typeof organizationId !== "string" || !organizationId.trim()) return;

      setForceClaimError(null);
      setIsForceClaiming(true);
      try {
        const res = await claimOrderAfterAuth({
          organizationId,
          orderId: orderId.trim(),
          checkoutToken: checkoutTokenFromUrl,
          force: true,
        });
        if (res?.ok) {
          setHasClaimedOrder(true);
          setClaimMismatch(null);
        }
      } catch (err: unknown) {
        setForceClaimError(
          err instanceof Error
            ? err.message
            : "Could not attach purchase to this account.",
        );
      } finally {
        setIsForceClaiming(false);
      }
    };

    const attemptClaimAfterAuth = async () => {
      if (!orderRequiresAccessVerification) return;
      if (typeof orderId !== "string" || !orderId.trim()) return;
      if (typeof organizationId !== "string" || !organizationId.trim()) return;
      if (claimMismatch) return;

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 3; i += 1) {
        try {
          const res = await claimOrderAfterAuth({
            organizationId,
            orderId: orderId.trim(),
          });
          if (res?.ok) {
            setHasClaimedOrder(true);
            return;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "";
          if (message.includes("verification does not match this order")) {
            const accountEmail =
              me && typeof (me as any)?.email === "string"
                ? String((me as any).email).trim()
                : "";
            setClaimMismatch({
              orderEmail: buyerEmail,
              accountEmail,
            });
            return;
          }
          // retry
        }
        await sleep(500);
      }
    };

    const postVerifyRedirect = () => {
      if (
        checkoutTokenFromUrl &&
        typeof orderId === "string" &&
        orderId.trim() &&
        typeof organizationId === "string" &&
        organizationId.trim()
      ) {
        void fetch("/api/clerk/users/link-email-for-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            orderId: orderId.trim(),
            checkoutToken: checkoutTokenFromUrl,
          }),
        }).catch(() => null);
      }
      window.location.assign("/");
    };

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
          <div className="mt-6 space-y-6">
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
              gateway={
                typeof gatewayFromMeta === "string" ? gatewayFromMeta : ""
              }
              transactionId={
                typeof transactionIdFromMeta === "string"
                  ? transactionIdFromMeta
                  : ""
              }
              items={receiptItems}
              total={resolvedTotal}
              showActions={!requiresAccessVerification && me !== null}
            />

            {requiresAccessVerification && me === null ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Log in to access
                  </CardTitle>
                  <CardDescription>
                    Use any configured provider (Google/Discord/Phone OTP, etc).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPreparingAccount ? (
                    <div className="text-muted-foreground text-sm">
                      Preparing your account…
                    </div>
                  ) : null}
                  {prepareAccountError ? (
                    <div className="text-destructive text-sm">
                      {prepareAccountError}
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    className="w-full"
                    disabled={isPreparingAccount || Boolean(prepareAccountError)}
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      const redirectUrl =
                        window.location.pathname +
                        window.location.search +
                        window.location.hash;
                      window.location.assign(
                        `/auth/sign-in?redirect_url=${encodeURIComponent(
                          redirectUrl,
                        )}`,
                      );
                    }}
                  >
                    Log in to access
                  </Button>
                  {isClaimingOrder ? (
                    <div className="text-muted-foreground text-sm">
                      Linking your order…
                    </div>
                  ) : null}
                  {claimOrderError ? (
                    <div className="text-destructive text-sm">
                      {claimOrderError}
                    </div>
                  ) : null}
                  {hasClaimedOrder ? (
                    <div className="text-muted-foreground text-sm">
                      Access unlocked. You can continue browsing.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {requiresAccessVerification && me !== null && !hasClaimedOrder ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attach purchase</CardTitle>
                  <CardDescription>
                    {claimMismatch
                      ? "You signed in with a different email than checkout."
                      : "Finalizing access…"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {claimMismatch ? (
                    <>
                      <div className="text-sm">
                        Checkout email:{" "}
                        <span className="font-medium">
                          {claimMismatch.orderEmail || "—"}
                        </span>
                        <br />
                        Signed-in email:{" "}
                        <span className="font-medium">
                          {claimMismatch.accountEmail || "—"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={isForceClaiming}
                          onClick={() => void forceClaimWithConfirmation()}
                        >
                          {isForceClaiming
                            ? "Attaching…"
                            : "Attach to this account"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isForceClaiming}
                          onClick={() => {
                            if (typeof window === "undefined") return;
                            const redirectUrl =
                              window.location.pathname +
                              window.location.search +
                              window.location.hash;
                            window.location.assign(
                              `/auth/sign-in?redirect_url=${encodeURIComponent(
                                redirectUrl,
                              )}`,
                            );
                          }}
                        >
                          Use a different account
                        </Button>
                      </div>

                      {forceClaimError ? (
                        <div className="text-destructive text-sm">
                          {forceClaimError}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      If this doesn’t complete automatically, refresh the page.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
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
          <Accordion
            type="single"
            collapsible
            value={mobileSummaryValue}
            onValueChange={setMobileSummaryValue}
          >
            <AccordionItem value="summary" className="border-b-0">
              <AccordionTrigger className="py-0 hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="text-sm font-medium">
                    {mobileSummaryOpen
                      ? "Hide order summary"
                      : "Show order summary"}
                  </div>
                  <AnimatePresence initial={false} mode="popLayout">
                    {!mobileSummaryOpen ? (
                      <motion.div
                        key="mobile-summary-subtotal"
                        className="text-sm font-semibold"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.18 }}
                      >
                        {formatMoney(subtotal)}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-0">
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  appliedCouponCode={appliedCouponCode ?? undefined}
                  discountAmount={discountAmount}
                  onApplyDiscount={handleApplyDiscount}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      <div className="h-6" />
    </div>
  );

  const mobileSummaryResolved = isCartLoading ? (
    <div className="lg:hidden">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="pt-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="h-6" />
    </div>
  ) : (
    mobileSummary
  );

  const rightSummary = isCartLoading ? (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Order details</CardTitle>
        <CardDescription>Review your items and totals.</CardDescription>
      </CardHeader>
      <CardContent>
        <OrderSummary
          items={items}
          subtotal={subtotal}
          appliedCouponCode={appliedCouponCode ?? undefined}
          discountAmount={discountAmount}
          onApplyDiscount={handleApplyDiscount}
        />
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

      <Form {...form}>
        <Layout
          mobileSummary={mobileSummaryResolved}
          left={
            isCartLoading ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-60" />
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-72" />
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-52" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact information</CardTitle>
                    <CardDescription>
                      We’ll use this to send your receipt and updates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={control}
                      name="shipping.firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jane"
                              autoComplete="given-name"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shipping.lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              autoComplete="family-name"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Controller
                        control={control}
                        name="shipping.phone"
                        render={({ field }) => (
                          <CheckoutPhoneField
                            id="contact-phone"
                            value={
                              typeof field.value === "string" ? field.value : ""
                            }
                            onValueChange={field.onChange}
                            disabled={isPlacingOrder}
                          />
                        )}
                      />
                      {formState.errors.shipping?.phone?.message ? (
                        <div className="text-destructive text-sm">
                          {String(formState.errors.shipping.phone.message)}
                        </div>
                      ) : null}
                    </div>

                    {needsAccount ? (
                      <div className="text-muted-foreground text-sm md:col-span-2">
                        This product requires an account to access. After
                        checkout, you’ll verify via email link or SMS code (no
                        password required).
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing / shipping address</CardTitle>
                    <CardDescription>
                      Enter your billing address. Add a separate shipping
                      address if you’re shipping a physical product.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {hasNonVirtualProducts ? (
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">
                              Ship to a different address
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Turn this on only if your shipping address is
                              different from billing.
                            </div>
                          </div>
                          <Switch
                            checked={formShipToDifferentAddress}
                            onCheckedChange={(next) => {
                              setValue("shipToDifferentAddress", next, {
                                shouldDirty: true,
                              });
                              if (!next) return;
                              const values = getValues();
                              const d = values.delivery;
                              const looksEmpty =
                                !d.address1.trim() &&
                                !d.city.trim() &&
                                !d.postcode.trim() &&
                                !d.country.trim();
                              if (looksEmpty) {
                                setValue("delivery", values.shipping, {
                                  shouldDirty: true,
                                });
                              }
                            }}
                            disabled={isPlacingOrder}
                            aria-label="Ship to a different address"
                          />
                        </div>
                      </div>
                    ) : null}

                    <FormField
                      control={control}
                      name="shipping.address1"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <AddressAutocompleteInput
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                              disabled={isPlacingOrder}
                              placeholder="123 Main St"
                              countryCode={String(
                                getValues().shipping.country ?? "",
                              )}
                              onValueChange={(next) => field.onChange(next)}
                              onSelectSuggestion={(s) =>
                                applyGeoapifySuggestion("shipping", s)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shipping.address2"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>
                            Apartment, suite, etc. (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apt 4B"
                              autoComplete="address-line2"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shipping.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="New York"
                              autoComplete="address-level2"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shipping.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="NY"
                              autoComplete="address-level1"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shipping.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country/region</FormLabel>
                          <FormControl>
                            <CountryDropdown
                              disabled={isPlacingOrder}
                              defaultValue={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                              placeholder="Select a country"
                              onChange={(country) =>
                                field.onChange(country.alpha2)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="shipping.postcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10001"
                              autoComplete="postal-code"
                              disabled={isPlacingOrder}
                              {...field}
                              value={
                                typeof field.value === "string"
                                  ? field.value
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {formShipToDifferentAddress ? (
                      <div className="md:col-span-2">
                        <Separator className="my-2" />
                        <div className="text-sm font-medium">
                          Shipping address
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          We’ll ship physical items to this address.
                        </div>
                        <div className="h-4" />
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <FormField
                              control={control}
                              name="delivery.address1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <AddressAutocompleteInput
                                      value={
                                        typeof field.value === "string"
                                          ? field.value
                                          : ""
                                      }
                                      disabled={isPlacingOrder}
                                      placeholder="123 Main St"
                                      countryCode={String(
                                        getValues().delivery.country ?? "",
                                      )}
                                      onValueChange={(next) =>
                                        field.onChange(next)
                                      }
                                      onSelectSuggestion={(s) =>
                                        applyGeoapifySuggestion("delivery", s)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <FormField
                              control={control}
                              name="delivery.address2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Apartment, suite, etc. (optional)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Apt 4B"
                                      autoComplete="address-line2"
                                      disabled={isPlacingOrder}
                                      {...field}
                                      value={
                                        typeof field.value === "string"
                                          ? field.value
                                          : ""
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormField
                              control={control}
                              name="delivery.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="New York"
                                      autoComplete="address-level2"
                                      disabled={isPlacingOrder}
                                      {...field}
                                      value={
                                        typeof field.value === "string"
                                          ? field.value
                                          : ""
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormField
                              control={control}
                              name="delivery.state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State/Province</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="NY"
                                      autoComplete="address-level1"
                                      disabled={isPlacingOrder}
                                      {...field}
                                      value={
                                        typeof field.value === "string"
                                          ? field.value
                                          : ""
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormField
                              control={control}
                              name="delivery.postcode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal code</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="10001"
                                      autoComplete="postal-code"
                                      disabled={isPlacingOrder}
                                      {...field}
                                      value={
                                        typeof field.value === "string"
                                          ? field.value
                                          : ""
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormField
                              control={control}
                              name="delivery.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country/region</FormLabel>
                                  <FormControl>
                                    <CountryDropdown
                                      disabled={isPlacingOrder}
                                      defaultValue={
                                        typeof field.value === "string"
                                          ? field.value
                                          : ""
                                      }
                                      placeholder="Select a country"
                                      onChange={(country) =>
                                        field.onChange(country.alpha2)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {isFreeOrder ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment</CardTitle>
                      <CardDescription>
                        No payment is required for this order.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-muted-foreground text-sm">
                        Your total is {formatMoney(total)}.
                      </div>

                      <NoiseBackground
                        containerClassName="w-full rounded-full p-1"
                        gradientColors={[
                          "rgb(255, 100, 150)",
                          "rgb(100, 150, 255)",
                          "rgb(255, 200, 100)",
                        ]}
                        noiseIntensity={0.18}
                        speed={0.08}
                        animating={canSubmit && !isPlacingOrder}
                      >
                        <Button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={!canSubmit}
                          variant="default"
                          size="lg"
                          className="border-border/60 bg-background/70 text-foreground hover:bg-background h-12 w-full shrink-0 rounded-full border text-base font-semibold transition"
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            <>Place order</>
                          )}
                        </Button>
                      </NoiseBackground>
                      <div className="text-muted-foreground text-xs">
                        By placing your order, you agree to our terms and
                        privacy policy.
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment</CardTitle>
                      <CardDescription>
                        {showPaymentMethodSelector
                          ? "Select how you’d like to pay."
                          : "Enter your payment details to complete checkout."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pluginActiveMap &&
                      paymentEnabledMap &&
                      configMap &&
                      enabledPaymentMethods.length === 0 ? (
                        <div className="space-y-2">
                          <div className="text-muted-foreground text-sm">
                            No payment methods are enabled. An admin can enable
                            one in Ecommerce → Settings → Payment processors.
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
                      ) : showPaymentMethodSelector ? (
                        <RadioGroup
                          value={effectivePaymentMethodId}
                          onValueChange={(value) =>
                            setValue("paymentMethodId", value, {
                              shouldDirty: true,
                            })
                          }
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
                      ) : null}
                      {formState.errors.paymentMethodId?.message ? (
                        <div className="text-destructive text-sm">
                          {String(formState.errors.paymentMethodId.message)}
                        </div>
                      ) : null}

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

                      <NoiseBackground
                        containerClassName="w-full rounded-full p-1"
                        gradientColors={[
                          "rgb(255, 100, 150)",
                          "rgb(100, 150, 255)",
                          "rgb(255, 200, 100)",
                        ]}
                        noiseIntensity={0.18}
                        speed={0.08}
                        animating={canSubmit && !isPlacingOrder}
                      >
                        <Button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={!canSubmit}
                          variant="default"
                          size="lg"
                          className="border-border/60 bg-background/70 text-foreground hover:bg-background h-12 w-full shrink-0 rounded-full border text-base font-semibold transition"
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing…
                            </>
                          ) : (
                            <>Pay {formatMoney(total)}</>
                          )}
                        </Button>
                      </NoiseBackground>
                      <div className="text-muted-foreground text-xs">
                        By placing your order, you agree to our terms and
                        privacy policy.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          }
          rightSummary={rightSummary}
        />
      </Form>
    </CheckoutShell>
  );
}
