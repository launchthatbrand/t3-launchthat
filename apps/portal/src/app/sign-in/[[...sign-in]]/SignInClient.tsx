"use client";

import type { SignInResource } from "@clerk/types";
import * as React from "react";
import Link from "next/link";
import { SignIn, useAuth, useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { cn } from "@acme/ui/lib/utils";
import { Skeleton } from "@acme/ui/skeleton";

const toProviderLabel = (strategy: string): string => {
  const raw = strategy.replace(/^oauth_/, "");
  const name = raw
    .split(/[_-]/g)
    .filter(Boolean)
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
    .join(" ");
  return name.length > 0 ? name : "Provider";
};

type RedirectStrategy = Parameters<
  SignInResource["authenticateWithRedirect"]
>[0]["strategy"];

const uniq = <T,>(items: T[]): T[] => Array.from(new Set(items));

interface OAuthProvider {
  strategy: RedirectStrategy;
  label: string;
  iconUrl: string | null;
}

const extractOauthStrategies = (root: unknown): string[] => {
  const out: string[] = [];
  const seen = new Set<unknown>();

  const visit = (value: unknown, depth: number) => {
    if (depth > 5) return;
    if (!value || (typeof value !== "object" && typeof value !== "function"))
      return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }

    const obj = value as Record<string, unknown>;

    // Direct "strategy" field.
    if (typeof obj.strategy === "string" && obj.strategy.startsWith("oauth_")) {
      out.push(obj.strategy);
    }

    // Common provider id/name fields.
    const providerRaw =
      typeof obj.provider === "string"
        ? obj.provider
        : typeof obj.providerId === "string"
          ? obj.providerId
          : typeof obj.name === "string"
            ? obj.name
            : typeof obj.id === "string"
              ? obj.id
              : null;
    if (
      providerRaw &&
      /oauth|social|google|discord|monday/i.test(providerRaw)
    ) {
      const cleaned = providerRaw
        .toLowerCase()
        .replace(/\.com\b/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      const normalized =
        cleaned === "mondaycom" || cleaned === "monday_com"
          ? "monday"
          : cleaned;
      if (normalized) out.push(`oauth_${normalized}`);
    }

    for (const [, v] of Object.entries(obj)) {
      visit(v, depth + 1);
    }
  };

  visit(root, 0);
  return uniq(out).filter((s) => s.startsWith("oauth_"));
};

const extractOauthProviders = (root: unknown): OAuthProvider[] => {
  const seen = new Set<unknown>();
  const byStrategy = new Map<string, OAuthProvider>();

  const visit = (value: unknown, depth: number) => {
    if (depth > 6) return;
    if (!value || (typeof value !== "object" && typeof value !== "function"))
      return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }

    const obj = value as Record<string, unknown>;

    const strategy =
      typeof obj.strategy === "string" && obj.strategy.startsWith("oauth_")
        ? obj.strategy
        : null;
    const iconUrl =
      typeof obj.iconUrl === "string"
        ? obj.iconUrl
        : typeof obj.logoUrl === "string"
          ? obj.logoUrl
          : typeof obj.icon_url === "string"
            ? obj.icon_url
            : typeof obj.logo_url === "string"
              ? obj.logo_url
              : null;
    const labelRaw =
      typeof obj.name === "string"
        ? obj.name
        : typeof obj.label === "string"
          ? obj.label
          : typeof obj.provider === "string"
            ? obj.provider
            : typeof obj.providerName === "string"
              ? obj.providerName
              : null;

    if (strategy) {
      const normalizedStrategy = strategy.replace(
        /^oauth_mondaycom$/,
        "oauth_monday",
      );
      const existing = byStrategy.get(normalizedStrategy);
      const next: OAuthProvider = {
        strategy: normalizedStrategy as RedirectStrategy,
        label:
          typeof labelRaw === "string" && labelRaw.trim()
            ? labelRaw.trim()
            : toProviderLabel(normalizedStrategy),
        iconUrl: iconUrl?.trim() ? iconUrl.trim() : (existing?.iconUrl ?? null),
      };
      byStrategy.set(normalizedStrategy, next);
    }

    for (const [, v] of Object.entries(obj)) visit(v, depth + 1);
  };

  visit(root, 0);
  return Array.from(byStrategy.values());
};

const hasPhoneOtpEnabled = (root: unknown): boolean => {
  const seen = new Set<unknown>();
  let found = false;

  const visit = (value: unknown, depth: number) => {
    if (found) return;
    if (depth > 6) return;
    if (!value || (typeof value !== "object" && typeof value !== "function")) {
      // Some env shapes include the strategy as a raw string.
      if (value === "phone_code" || value === "phoneCode") found = true;
      return;
    }
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }

    const obj = value as Record<string, unknown>;
    if (obj.strategy === "phone_code" || obj.strategy === "phoneCode") {
      found = true;
      return;
    }

    for (const [, v] of Object.entries(obj)) visit(v, depth + 1);
  };

  visit(root, 0);
  return found;
};

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

const phoneStartSchema = z.object({
  phoneNumber: z.string().min(6, "Enter a valid phone number"),
});

type PhoneStartValues = z.infer<typeof phoneStartSchema>;

const phoneCodeSchema = z.object({
  code: z.string().min(4, "Enter the code"),
});

type PhoneCodeValues = z.infer<typeof phoneCodeSchema>;

export default function SignInClient(props: {
  returnTo: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  tenantLogo: string | null;
  ui?: "custom" | "clerk";
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [oauthProviders, setOauthProviders] = React.useState<OAuthProvider[]>(
    [],
  );
  const [isPhoneOtpEnabled, setIsPhoneOtpEnabled] = React.useState(false);
  const [authMethod, setAuthMethod] = React.useState<"password" | "phone">(
    "password",
  );
  const [phoneStep, setPhoneStep] = React.useState<"enter" | "code">("enter");
  const [phoneNumberValue, setPhoneNumberValue] = React.useState<string>("");

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const phoneStartForm = useForm<PhoneStartValues>({
    resolver: zodResolver(phoneStartSchema),
    defaultValues: { phoneNumber: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const phoneCodeForm = useForm<PhoneCodeValues>({
    resolver: zodResolver(phoneCodeSchema),
    defaultValues: { code: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const afterSignInUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (props.returnTo) params.set("return_to", props.returnTo);
    if (props.tenantSlug) params.set("tenant", props.tenantSlug);
    return `${window.location.origin}/api/auth/callback?${params.toString()}`;
  }, [props.returnTo, props.tenantSlug]);

  // If the user already has an active Clerk session on the auth host,
  // skip showing the sign-in UI and just mint the tenant session via our callback.
  React.useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isSignedIn) return;
    // Must be a full navigation because /api/auth/callback ultimately redirects
    // cross-origin back to the tenant host. Using router.replace() can trigger a
    // fetch-based navigation and fail with CORS.
    window.location.assign(afterSignInUrl);
  }, [afterSignInUrl, isAuthLoaded, isSignedIn]);

  React.useEffect(() => {
    if (!isLoaded) return;

    // 1) Preferred: read from Clerk's loaded "environment" config (same source as <SignIn />).
    const w = window as unknown as { Clerk?: unknown };
    const env = (() => {
      const clerk = w.Clerk;
      if (!clerk || typeof clerk !== "object") return null;
      const c = clerk as {
        __unstable__environment?: unknown;
        __internal_clerkClient?: { environment?: unknown };
        client?: { __unstable__environment?: unknown };
      };
      const env1 = c.__unstable__environment;
      const env2 = c.__internal_clerkClient?.environment ?? null;
      const env3 = c.client?.__unstable__environment ?? null;
      return env1 ?? env2 ?? env3 ?? null;
    })();
    const envProviders = extractOauthProviders(env);
    if (envProviders.length > 0) {
      setOauthProviders(envProviders);
    } else {
      const envStrategies = extractOauthStrategies(env);
      if (envStrategies.length > 0) {
        setOauthProviders(
          envStrategies.map((s) => ({
            strategy: s as RedirectStrategy,
            label: toProviderLabel(s),
            iconUrl: null,
          })),
        );
      }
    }
    setIsPhoneOtpEnabled(hasPhoneOtpEnabled(env));

    // 2) Fallback: `supportedFirstFactors` (often only populated after a sign-in attempt is created).
    const factorsUnknown = (
      signIn as unknown as { supportedFirstFactors?: unknown }
    ).supportedFirstFactors;
    if (!Array.isArray(factorsUnknown)) return;

    const strategies: RedirectStrategy[] = [];
    for (const f of factorsUnknown) {
      const s =
        f && typeof f === "object" && "strategy" in f
          ? (f as { strategy?: unknown }).strategy
          : null;
      if (typeof s === "string" && s.startsWith("oauth_")) {
        strategies.push(s as RedirectStrategy);
      }
      if (s === "phone_code" || s === "phoneCode") {
        setIsPhoneOtpEnabled(true);
      }
    }
    if (strategies.length > 0 && oauthProviders.length === 0) {
      setOauthProviders(
        uniq(strategies).map((s) => ({
          strategy: s,
          label: toProviderLabel(String(s)),
          iconUrl: null,
        })),
      );
    }
  }, [isLoaded, signIn, oauthProviders.length]);

  const handleOauth = async (strategy: RedirectStrategy) => {
    if (!isLoaded) return;
    setFormError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: afterSignInUrl,
      });
    } catch (err: unknown) {
      const code = (() => {
        if (!err || typeof err !== "object") return null;
        const anyErr = err as { errors?: unknown };
        const errorsUnknown = anyErr.errors;
        if (!Array.isArray(errorsUnknown)) return null;
        const first = errorsUnknown[0] as unknown;
        if (!first || typeof first !== "object") return null;
        const codeUnknown = (first as { code?: unknown }).code;
        return typeof codeUnknown === "string" ? codeUnknown : null;
      })();

      // Clerk returns "session_exists" when a user clicks an OAuth provider
      // while already signed in on this host. In that case, just bounce through
      // our callback to mint the tenant session and redirect back.
      if (code === "session_exists") {
        window.location.assign(afterSignInUrl);
        return;
      }
      setFormError("Unable to start sign-in. Please try again.");
    }
  };

  const continueLabel = props.tenantName
    ? `Continue to ${props.tenantName}`
    : "Continue to LaunchThat";

  const handleSubmit = async (values: SignInValues) => {
    if (!isLoaded) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (result.status !== "complete") {
        setFormError(
          "This account requires a different sign-in method. Please use the standard sign-in flow.",
        );
        setIsSubmitting(false);
        return;
      }

      await setActive({ session: result.createdSessionId });
      window.location.assign(afterSignInUrl);
    } catch (err: unknown) {
      const message = (() => {
        if (!err || typeof err !== "object") return "Unable to sign in.";
        const anyErr = err as {
          errors?: { longMessage?: unknown; message?: unknown }[];
          message?: unknown;
        };
        const first = Array.isArray(anyErr.errors)
          ? anyErr.errors[0]
          : undefined;
        const longMessage =
          first && typeof first.longMessage === "string"
            ? first.longMessage
            : null;
        const shortMessage =
          first && typeof first.message === "string" ? first.message : null;
        const fallback =
          typeof anyErr.message === "string"
            ? anyErr.message
            : "Unable to sign in.";
        return longMessage ?? shortMessage ?? fallback;
      })();
      setFormError(message);
      setIsSubmitting(false);
    }
  };

  const startPhoneOtp = async (values: PhoneStartValues) => {
    if (!isLoaded) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const phoneNumber = values.phoneNumber.trim();
      if (!phoneNumber) {
        setFormError("Enter a valid phone number.");
        setIsSubmitting(false);
        return;
      }

      await (
        signIn as unknown as {
          create: (args: { identifier: string }) => Promise<unknown>;
        }
      ).create({ identifier: phoneNumber });

      const firstFactors: unknown[] = Array.isArray(
        (signIn as unknown as { supportedFirstFactors?: unknown })
          .supportedFirstFactors,
      )
        ? ((signIn as unknown as { supportedFirstFactors?: unknown })
            .supportedFirstFactors as unknown[])
        : [];

      const phoneCodeFactor = firstFactors.find((f) => {
        if (!f || typeof f !== "object") return false;
        const obj = f as { strategy?: unknown; phoneNumberId?: unknown };
        const strategy = obj.strategy;
        const phoneNumberId = obj.phoneNumberId;
        return (
          (strategy === "phone_code" || strategy === "phoneCode") &&
          typeof phoneNumberId === "string" &&
          phoneNumberId.trim().length > 0
        );
      });

      const phoneNumberId =
        phoneCodeFactor &&
        typeof (phoneCodeFactor as { phoneNumberId?: unknown })
          .phoneNumberId === "string"
          ? String(
              (phoneCodeFactor as { phoneNumberId?: unknown }).phoneNumberId,
            )
          : "";

      if (!phoneNumberId.trim()) {
        setFormError(
          "Phone sign-in isn't available for this account. Please use email instead.",
        );
        setIsSubmitting(false);
        return;
      }

      await (
        signIn as unknown as {
          prepareFirstFactor: (args: {
            strategy: "phone_code";
            phoneNumberId: string;
          }) => Promise<unknown>;
        }
      ).prepareFirstFactor({
        strategy: "phone_code",
        phoneNumberId: phoneNumberId.trim(),
      });

      setPhoneNumberValue(phoneNumber);
      setPhoneStep("code");
      setIsSubmitting(false);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Unable to start phone sign-in.",
      );
      setIsSubmitting(false);
    }
  };

  const submitPhoneCode = async (values: PhoneCodeValues) => {
    if (!isLoaded) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const code = values.code.trim();
      if (!code) {
        setFormError("Enter the code.");
        setIsSubmitting(false);
        return;
      }

      const result = await (
        signIn as unknown as {
          attemptFirstFactor: (args: {
            strategy: "phone_code";
            code: string;
          }) => Promise<unknown>;
          createdSessionId?: unknown;
        }
      ).attemptFirstFactor({
        strategy: "phone_code",
        code,
      });

      const createdSessionId =
        (result as { createdSessionId?: unknown }).createdSessionId ??
        (signIn as unknown as { createdSessionId?: unknown })
          .createdSessionId ??
        null;

      if (typeof createdSessionId === "string" && createdSessionId.trim()) {
        await setActive({ session: createdSessionId });
        window.location.assign(afterSignInUrl);
        return;
      }

      const status =
        typeof (result as { status?: unknown }).status === "string"
          ? String((result as { status?: unknown }).status)
          : "";
      setFormError(
        status
          ? `Could not sign in (status: ${status}).`
          : "Could not sign in with that code.",
      );
      setIsSubmitting(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Invalid code.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            {props.tenantLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.tenantLogo}
                alt={
                  props.tenantName ? `${props.tenantName} logo` : "Tenant logo"
                }
                className="h-10 w-10 rounded-md object-cover"
              />
            ) : (
              <div className="bg-muted h-10 w-10 rounded-md" />
            )}
            <div className="min-w-0">
              <CardTitle className="truncate text-xl">
                {continueLabel}
              </CardTitle>
              <CardDescription className="truncate">
                Sign in to continue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.ui === "clerk" ? (
            <SignIn
              afterSignInUrl={afterSignInUrl}
              afterSignUpUrl={afterSignInUrl}
            />
          ) : !isLoaded ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {isPhoneOtpEnabled ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={authMethod === "password" ? "default" : "outline"}
                    onClick={() => {
                      setFormError(null);
                      setAuthMethod("password");
                      setPhoneStep("enter");
                      phoneStartForm.reset();
                      phoneCodeForm.reset();
                    }}
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={authMethod === "phone" ? "default" : "outline"}
                    onClick={() => {
                      setFormError(null);
                      setAuthMethod("phone");
                      setPhoneStep("enter");
                      phoneCodeForm.reset();
                    }}
                  >
                    Phone
                  </Button>
                </div>
              ) : null}

              {oauthProviders.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {oauthProviders.map((p) => (
                      <Button
                        key={p.strategy}
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => void handleOauth(p.strategy)}
                      >
                        {p.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.iconUrl}
                            alt=""
                            aria-hidden="true"
                            className="mr-2 h-4 w-4"
                          />
                        ) : null}
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 py-1">
                    <div className="bg-border h-px flex-1" />
                    <div className="text-muted-foreground text-xs">or</div>
                    <div className="bg-border h-px flex-1" />
                  </div>
                </div>
              ) : null}

              {authMethod === "password" ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="email"
                              inputMode="email"
                              placeholder="you@company.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="current-password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {formError ? (
                      <div className="text-sm text-red-600">{formError}</div>
                    ) : null}

                    <Button
                      type="submit"
                      className={cn("w-full", isSubmitting ? "opacity-80" : "")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </Form>
              ) : phoneStep === "enter" ? (
                <Form {...phoneStartForm}>
                  <form
                    onSubmit={phoneStartForm.handleSubmit(startPhoneOtp)}
                    className="space-y-4"
                  >
                    <FormField
                      control={phoneStartForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="tel"
                              inputMode="tel"
                              placeholder="+1 555 555 5555"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {formError ? (
                      <div className="text-sm text-red-600">{formError}</div>
                    ) : null}

                    <Button
                      type="submit"
                      className={cn("w-full", isSubmitting ? "opacity-80" : "")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending code…" : "Send code"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...phoneCodeForm}>
                  <form
                    onSubmit={phoneCodeForm.handleSubmit(submitPhoneCode)}
                    className="space-y-4"
                  >
                    <div className="text-muted-foreground text-sm">
                      Enter the code sent to{" "}
                      <span className="font-medium">{phoneNumberValue}</span>.
                    </div>

                    <FormField
                      control={phoneCodeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input
                              inputMode="numeric"
                              placeholder="123456"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {formError ? (
                      <div className="text-sm text-red-600">{formError}</div>
                    ) : null}

                    <Button
                      type="submit"
                      className={cn("w-full", isSubmitting ? "opacity-80" : "")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verifying…" : "Verify code"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setFormError(null);
                        setPhoneStep("enter");
                        phoneCodeForm.reset();
                      }}
                    >
                      Back
                    </Button>
                  </form>
                </Form>
              )}

              <div className="text-muted-foreground text-center text-xs">
                Need a different sign-in method?{" "}
                <Link
                  className="underline"
                  href={{
                    pathname: "/sign-in",
                    query: {
                      ui: "clerk",
                      ...(props.returnTo ? { return_to: props.returnTo } : {}),
                      ...(props.tenantSlug ? { tenant: props.tenantSlug } : {}),
                    },
                  }}
                >
                  Use the standard sign-in
                </Link>
                .
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
