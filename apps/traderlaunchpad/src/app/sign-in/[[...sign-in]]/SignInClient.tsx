"use client";

import type { SignInResource } from "@clerk/types";
import * as React from "react";
import Link from "next/link";
import { SignIn, useAuth, useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@acme/ui/input-otp";
import { PhoneInput } from "@acme/ui/input-phone";
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

type RedirectStrategy = Parameters<SignInResource["authenticateWithRedirect"]>[0]["strategy"];

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
    if (!value || (typeof value !== "object" && typeof value !== "function")) return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }

    const obj = value as Record<string, unknown>;

    if (typeof obj.strategy === "string" && obj.strategy.startsWith("oauth_")) {
      out.push(obj.strategy);
    }

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
    if (providerRaw && /oauth|social|google|discord|monday/i.test(providerRaw)) {
      const cleaned = providerRaw
        .toLowerCase()
        .replace(/\.com\b/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      const normalized =
        cleaned === "mondaycom" || cleaned === "monday_com" ? "monday" : cleaned;
      if (normalized) out.push(`oauth_${normalized}`);
    }

    for (const [, v] of Object.entries(obj)) visit(v, depth + 1);
  };

  visit(root, 0);
  return uniq(out).filter((s) => s.startsWith("oauth_"));
};

const extractOauthProviders = (root: unknown): OAuthProvider[] => {
  const seen = new Set<unknown>();
  const byStrategy = new Map<string, OAuthProvider>();

  const visit = (value: unknown, depth: number) => {
    if (depth > 6) return;
    if (!value || (typeof value !== "object" && typeof value !== "function")) return;
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
      const normalizedStrategy = strategy.replace(/^oauth_mondaycom$/, "oauth_monday");
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

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
type EmailValues = z.infer<typeof emailSchema>;

const phoneStartSchema = z.object({
  phoneNumber: z.string().min(1, "Enter a phone number"),
});
type PhoneStartValues = z.infer<typeof phoneStartSchema>;

const phoneCodeSchema = z.object({
  code: z.string().min(4, "Enter the code"),
});
type PhoneCodeValues = z.infer<typeof phoneCodeSchema>;

type AuthStep = "choose" | "email" | "email_sent" | "phone" | "phone_code";

export default function SignInClient(props: {
  returnTo: string | null;
  ui?: "custom" | "clerk";
  prefillMethod?: "phone" | "email" | null;
  prefillPhone?: string | null;
  prefillEmail?: string | null;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [oauthProviders, setOauthProviders] = React.useState<OAuthProvider[]>([]);
  const [isPhoneOtpEnabled, setIsPhoneOtpEnabled] = React.useState(false);
  const [authStep, setAuthStep] = React.useState<AuthStep>("choose");
  const [phoneNumberValue, setPhoneNumberValue] = React.useState<string>("");
  const [phoneInputText, setPhoneInputText] = React.useState<string>("");

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const phoneStartForm = useForm<PhoneStartValues>({
    resolver: zodResolver(phoneStartSchema),
    defaultValues: { phoneNumber: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const phoneCodeForm = useForm<PhoneCodeValues>({
    resolver: zodResolver(phoneCodeSchema),
    defaultValues: { code: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const afterSignInUrl = React.useMemo(() => {
    const raw = props.returnTo?.trim();
    return raw && raw.length > 0 ? raw : "/admin/dashboard";
  }, [props.returnTo]);

  const startPhoneOtp = React.useCallback(
    async (values: PhoneStartValues) => {
      if (!isLoaded) return;
      setFormError(null);
      setIsSubmitting(true);
      try {
        const raw = values.phoneNumber.trim() || phoneInputText.trim();
        const digitsOnly = raw.replace(/[^0-9]/g, "");
        const normalized = (() => {
          if (!raw) return "";
          if (raw.startsWith("+")) return raw.replace(/[()\-\s]/g, "");
          if (digitsOnly.length === 10) return `+1${digitsOnly}`;
          if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) return `+${digitsOnly}`;
          if (digitsOnly.length >= 11) return `+${digitsOnly}`;
          return raw;
        })();

        if (!normalized) {
          setFormError("Enter a valid phone number.");
          setIsSubmitting(false);
          return;
        }

        await (signIn as unknown as { create: (args: { identifier: string }) => Promise<unknown> })
          .create({ identifier: normalized });

        const firstFactors: unknown[] = Array.isArray(
          (signIn as unknown as { supportedFirstFactors?: unknown }).supportedFirstFactors,
        )
          ? ((signIn as unknown as { supportedFirstFactors?: unknown })
              .supportedFirstFactors as unknown[])
          : [];

        const phoneCodeFactor = firstFactors.find((f) => {
          if (!f || typeof f !== "object") return false;
          const obj = f as { strategy?: unknown; phoneNumberId?: unknown };
          return (
            (obj.strategy === "phone_code" || obj.strategy === "phoneCode") &&
            typeof obj.phoneNumberId === "string" &&
            obj.phoneNumberId.trim().length > 0
          );
        });

        const phoneNumberId =
          phoneCodeFactor &&
          typeof (phoneCodeFactor as { phoneNumberId?: unknown }).phoneNumberId === "string"
            ? String((phoneCodeFactor as { phoneNumberId?: unknown }).phoneNumberId)
            : "";

        if (!phoneNumberId.trim()) {
          setFormError("Phone sign-in isn't available for this account. Please use email.");
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

        setPhoneNumberValue(raw || normalized);
        setAuthStep("phone_code");
        setIsSubmitting(false);
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : "Unable to start phone sign-in.");
        setIsSubmitting(false);
      }
    },
    [isLoaded, phoneInputText, signIn],
  );

  const startEmailMagicLink = React.useCallback(async () => {
    if (!isLoaded) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const email = emailForm.getValues("email").trim().toLowerCase();
      if (!email) {
        setFormError("Enter a valid email.");
        setIsSubmitting(false);
        return;
      }

      await (signIn as unknown as { create: (args: { identifier: string }) => Promise<unknown> })
        .create({ identifier: email });

      const firstFactors: unknown[] = Array.isArray(
        (signIn as unknown as { supportedFirstFactors?: unknown }).supportedFirstFactors,
      )
        ? ((signIn as unknown as { supportedFirstFactors?: unknown })
            .supportedFirstFactors as unknown[])
        : [];

      const emailLinkFactor = firstFactors.find((f) => {
        if (!f || typeof f !== "object") return false;
        const obj = f as { strategy?: unknown; emailAddressId?: unknown };
        return (
          (obj.strategy === "email_link" || obj.strategy === "emailLink") &&
          typeof obj.emailAddressId === "string" &&
          obj.emailAddressId.trim().length > 0
        );
      });

      const emailAddressId =
        emailLinkFactor &&
        typeof (emailLinkFactor as { emailAddressId?: unknown }).emailAddressId === "string"
          ? String((emailLinkFactor as { emailAddressId?: unknown }).emailAddressId)
          : "";

      if (!emailAddressId.trim()) {
        setFormError("Email magic link isn't available. Please use another sign-in method.");
        setIsSubmitting(false);
        return;
      }

      await (
        signIn as unknown as {
          prepareFirstFactor: (args: {
            strategy: "email_link";
            emailAddressId: string;
          }) => Promise<unknown>;
        }
      ).prepareFirstFactor({
        strategy: "email_link",
        emailAddressId: emailAddressId.trim(),
      });

      setAuthStep("email_sent");
      setIsSubmitting(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unable to send link.");
      setIsSubmitting(false);
    }
  }, [emailForm, isLoaded, signIn]);

  // Prefill phone/email from query params.
  React.useEffect(() => {
    if (!isLoaded) return;
    if (props.ui === "clerk") return;

    const method = props.prefillMethod ?? null;
    const phone = typeof props.prefillPhone === "string" ? props.prefillPhone.trim() : "";
    const email = typeof props.prefillEmail === "string" ? props.prefillEmail.trim() : "";

    if (method === "phone" && isPhoneOtpEnabled) {
      setAuthStep("phone");
      setFormError(null);

      if (phone) {
        phoneStartForm.setValue("phoneNumber", phone, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setTimeout(() => {
          void startPhoneOtp({ phoneNumber: phone });
        }, 0);
      }
      return;
    }

    if (method === "email") {
      if (email) {
        emailForm.setValue("email", email, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      setAuthStep("email");
    }
  }, [
    emailForm,
    isLoaded,
    isPhoneOtpEnabled,
    phoneStartForm,
    startPhoneOtp,
    props.prefillEmail,
    props.prefillMethod,
    props.prefillPhone,
    props.ui,
  ]);

  // If already signed in, just go where we were headed.
  React.useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isSignedIn) return;
    window.location.assign(afterSignInUrl);
  }, [afterSignInUrl, isAuthLoaded, isSignedIn]);

  React.useEffect(() => {
    if (!isLoaded) return;

    const w = window as unknown as { Clerk?: unknown };
    const env = (() => {
      const clerk = w.Clerk;
      if (!clerk || typeof clerk !== "object") return null;
      const c = clerk as {
        __unstable__environment?: unknown;
        __internal_clerkClient?: { environment?: unknown };
        client?: { __unstable__environment?: unknown };
      };
      return c.__unstable__environment ?? c.__internal_clerkClient?.environment ?? c.client?.__unstable__environment ?? null;
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
  }, [isLoaded]);

  const handleOauth = async (strategy: RedirectStrategy) => {
    if (!isLoaded) return;
    setFormError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: afterSignInUrl,
      });
    } catch {
      setFormError("Unable to start sign-in. Please try again.");
    }
  };

  const submitPhoneCode = React.useCallback(
    async (values: PhoneCodeValues) => {
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
          }
        ).attemptFirstFactor({
          strategy: "phone_code",
          code,
        });

        const createdSessionId =
          (result as { createdSessionId?: unknown }).createdSessionId ??
          (signIn as unknown as { createdSessionId?: unknown }).createdSessionId ??
          null;

        if (typeof createdSessionId === "string" && createdSessionId.trim()) {
          await setActive({ session: createdSessionId });
          window.location.assign(afterSignInUrl);
          return;
        }

        setFormError("Could not sign in with that code.");
        setIsSubmitting(false);
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : "Invalid code.");
        setIsSubmitting(false);
      }
    },
    [afterSignInUrl, isLoaded, setActive, signIn],
  );

  const phoneCodeValue = phoneCodeForm.watch("code");
  React.useEffect(() => {
    if (authStep !== "phone_code") return;
    const code = typeof phoneCodeValue === "string" ? phoneCodeValue.trim() : "";
    if (code.length !== 6) return;
    if (isSubmitting) return;
    void submitPhoneCode({ code });
  }, [authStep, isSubmitting, phoneCodeValue, submitPhoneCode]);

  const emailCurrent = emailForm.watch("email");
  const isEmailReady = typeof emailCurrent === "string" && emailCurrent.trim().length > 0;

  const phoneNumberCurrent = phoneStartForm.watch("phoneNumber");
  const isPhoneNumberReady =
    (typeof phoneNumberCurrent === "string" && phoneNumberCurrent.trim().length > 0) ||
    phoneInputText.trim().length > 0;

  const goBackToChoose = () => {
    setFormError(null);
    setIsSubmitting(false);
    setAuthStep("choose");
    phoneStartForm.reset();
    phoneCodeForm.reset();
    setPhoneInputText("");
    setPhoneNumberValue("");
  };

  const stepMotion = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.18 },
  } as const;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Sign in to TraderLaunchpad</CardTitle>
          <CardDescription>Choose a sign-in method to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.ui === "clerk" ? (
            <SignIn afterSignInUrl={afterSignInUrl} afterSignUpUrl={afterSignInUrl} />
          ) : !isLoaded ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {authStep !== "choose" ? (
                <div className="flex items-center justify-center">
                  <Button type="button" variant="ghost" onClick={goBackToChoose}>
                    ← Choose a different login method
                  </Button>
                </div>
              ) : null}

              <AnimatePresence mode="popLayout" initial={false}>
                {authStep === "choose" ? (
                  <motion.div key="choose" {...stepMotion} className="space-y-4">
                    {oauthProviders.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {oauthProviders.map((p) => (
                          <Button
                            key={p.strategy}
                            type="button"
                            variant="outline"
                            onClick={() => void handleOauth(p.strategy)}
                          >
                            {p.label}
                          </Button>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-3 py-1">
                      <div className="bg-border h-px flex-1" />
                      <div className="text-muted-foreground text-xs">or</div>
                      <div className="bg-border h-px flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormError(null);
                          setAuthStep("email");
                        }}
                      >
                        Email
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!isPhoneOtpEnabled}
                        onClick={() => {
                          setFormError(null);
                          setAuthStep("phone");
                          phoneCodeForm.reset();
                        }}
                      >
                        Phone
                      </Button>
                    </div>

                    {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
                  </motion.div>
                ) : null}

                {authStep === "email" ? (
                  <motion.div key="email" {...stepMotion} className="space-y-4">
                    <Form {...emailForm}>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void startEmailMagicLink();
                        }}
                        className="space-y-4"
                      >
                        <FormField
                          control={emailForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input autoComplete="email" inputMode="email" placeholder="you@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {formError ? <div className="text-sm text-red-600">{formError}</div> : null}

                        <Button
                          type="submit"
                          className={cn("w-full", isSubmitting ? "opacity-80" : "")}
                          disabled={isSubmitting || !isEmailReady}
                        >
                          {isSubmitting ? "Sending link…" : "Send magic link"}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                ) : null}

                {authStep === "email_sent" ? (
                  <motion.div key="email_sent" {...stepMotion} className="space-y-4">
                    <div className="text-sm">
                      Check your email for a sign-in link. You can close this tab after you click it.
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => void startEmailMagicLink()}
                    >
                      Resend link
                    </Button>
                    {formError ? <div className="text-sm text-red-600">{formError}</div> : null}
                  </motion.div>
                ) : null}

                {authStep === "phone" ? (
                  <motion.div key="phone" {...stepMotion} className="space-y-4">
                    <Form {...phoneStartForm}>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void startPhoneOtp({
                            phoneNumber:
                              phoneInputText.trim() || phoneStartForm.getValues("phoneNumber").trim(),
                          });
                        }}
                        className="space-y-4"
                      >
                        <FormField
                          control={phoneStartForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone number</FormLabel>
                              <div
                                onChangeCapture={(event) => {
                                  if (!(event.target instanceof HTMLInputElement)) return;
                                  const next = event.target.value;
                                  setPhoneInputText(next);
                                  if (!field.value) field.onChange(next);
                                }}
                              >
                                <FormControl>
                                  <PhoneInput
                                    autoComplete="tel"
                                    placeholder="+1 555 555 5555"
                                    defaultCountry="US"
                                    name={field.name}
                                    value={field.value}
                                    onChange={(value) => field.onChange(value)}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {formError ? <div className="text-sm text-red-600">{formError}</div> : null}

                        <Button
                          type="submit"
                          className={cn("w-full", isSubmitting ? "opacity-80" : "")}
                          disabled={isSubmitting || !isPhoneNumberReady}
                        >
                          {isSubmitting ? "Sending code…" : "Send code"}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                ) : null}

                {authStep === "phone_code" ? (
                  <motion.div key="phone_code" {...stepMotion} className="space-y-4">
                    <div className="text-muted-foreground flex items-center justify-center text-sm">
                      Enter the code sent to{" "}
                      <span className="ml-1 font-medium">{phoneNumberValue}</span>.
                    </div>

                    <Form {...phoneCodeForm}>
                      <form onSubmit={phoneCodeForm.handleSubmit(submitPhoneCode)} className="space-y-4">
                        <FormField
                          control={phoneCodeForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem className="flex w-full flex-col items-center justify-center">
                              <FormLabel>Code</FormLabel>
                              <FormControl>
                                <InputOTP
                                  maxLength={6}
                                  value={field.value}
                                  onChange={field.onChange}
                                  containerClassName="justify-center"
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                                    <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                                    <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                                    <InputOTPSeparator />
                                    <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                                    <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                                    <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                                  </InputOTPGroup>
                                </InputOTP>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {formError ? <div className="text-sm text-red-600">{formError}</div> : null}

                        <Button
                          type="submit"
                          className={cn("w-full", isSubmitting ? "opacity-80" : "")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Verifying…" : "Verify"}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="text-muted-foreground text-center text-xs">
                Need a different sign-in method?{" "}
                <Link className="underline" href={{ pathname: "/sign-in", query: { ui: "clerk" } }}>
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

