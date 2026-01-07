"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unnecessary-condition
*/

import React, { useMemo, useRef } from "react";
import { useAuth, useClerk, useSignIn, useSignUp } from "@clerk/nextjs";

import { CheckoutClient } from "launchthat-plugin-ecommerce";
import { useHostContext } from "~/context/HostContext";
import { useTenant } from "~/context/TenantContext";

type Props = Omit<React.ComponentProps<typeof CheckoutClient>, "clerk">;

export function CheckoutClientWithClerk(props: Props) {
  // IMPORTANT:
  // Tenant/custom domains intentionally do NOT mount <ClerkProvider />, so we must
  // never call Clerk hooks on those hosts (it will crash).
  //
  // We split into two components to satisfy the Rules of Hooks.
  // `CheckoutClientWithClerk` is just a host-aware wrapper.
  const { isAuthHost } = useHostContext();

  return isAuthHost ? (
    <CheckoutClientAuthHost {...props} />
  ) : (
    <CheckoutClientTenantHost {...props} />
  );
}

function CheckoutClientTenantHost(props: Props) {
  const { authHost } = useHostContext();
  const tenant = useTenant();

  const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
  const TOKEN_UPDATED_EVENT = "convex-token-updated";

  const tenantSlug =
    typeof (tenant as { slug?: unknown } | null)?.slug === "string"
      ? (tenant as { slug: string }).slug
      : "";

  const [isSignedIn, setIsSignedIn] = React.useState(() => {
    try {
      return Boolean(localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const read = () => {
      try {
        setIsSignedIn(Boolean(localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY)));
      } catch {
        setIsSignedIn(false);
      }
    };

    const onUpdated = () => read();
    window.addEventListener(TOKEN_UPDATED_EVENT, onUpdated as EventListener);
    window.addEventListener("storage", onUpdated);
    return () => {
      window.removeEventListener(TOKEN_UPDATED_EVENT, onUpdated as EventListener);
      window.removeEventListener("storage", onUpdated);
    };
  }, []);

  const redirectToAuthSignIn = React.useCallback((opts?: {
    method?: "phone" | "email";
    phoneNumber?: string;
    emailAddress?: string;
  }) => {
    const returnTo = window.location.href;
    const params = new URLSearchParams();
    params.set("return_to", returnTo);
    if (tenantSlug) params.set("tenant", tenantSlug);
    if (opts?.method) params.set("method", opts.method);
    if (opts?.phoneNumber) params.set("phone", opts.phoneNumber);
    if (opts?.emailAddress) params.set("email", opts.emailAddress);
    window.location.assign(
      `${window.location.protocol}//${authHost}/sign-in?${params.toString()}`,
    );
  }, [authHost, tenantSlug]);

  const clerkAdapter = React.useMemo(() => {
    return {
      isLoaded: true,
      isSignedIn,
      startEmailLinkSignIn: async () => {
        // Redirect to auth host to complete email sign-in (magic link / OAuth / etc).
        // Returning a never-resolving promise avoids tenant UI flipping panels before navigation.
        redirectToAuthSignIn({ method: "email" });
        await new Promise<never>(() => {
          // intentionally never resolves (navigation should unload the page)
          void 0;
        });
      },
      startPhoneOtpSignIn: async (args: {
        phoneNumber: string;
        emailAddress?: string;
      }) => {
        redirectToAuthSignIn({
          method: "phone",
          phoneNumber: args.phoneNumber,
          emailAddress: args.emailAddress,
        });
        await new Promise<never>(() => {
          // intentionally never resolves (navigation should unload the page)
          void 0;
        });
      },
      attemptPhoneOtpSignIn: async (args: {
        code: string;
        emailAddress?: string;
      }) => {
        // If tenant UI reaches verify step, still bounce to auth host (no inline OTP on tenant).
        redirectToAuthSignIn({ method: "phone", emailAddress: args.emailAddress });
        await new Promise<never>(() => {
          // intentionally never resolves (navigation should unload the page)
          void 0;
        });
      },
    };
  }, [isSignedIn, redirectToAuthSignIn]);

  return <CheckoutClient {...props} clerk={clerkAdapter} />;
}

function CheckoutClientAuthHost(props: Props) {
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const pendingPhoneFlow = useRef<"signIn" | "signUp" | null>(null);

  const clerkAdapter = useMemo(() => {
    const joinTenantOrgAndSetActive = async (sessionId?: string) => {
      try {
        const res = await fetch("/api/clerk/organizations/join-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const json: any = await res.json().catch(() => null);
        const clerkOrganizationId =
          res.ok && json && typeof json.clerkOrganizationId === "string"
            ? json.clerkOrganizationId
            : null;
        if (clerkOrganizationId) {
          await (clerk.setActive as any)({
            ...(sessionId ? { session: sessionId } : {}),
            organization: clerkOrganizationId,
          });
        }
      } catch (err) {
        console.warn("[checkout] failed to join tenant clerk org", err);
      }
    };

    return {
      isLoaded: isSignInLoaded && isSignUpLoaded,
      isSignedIn: Boolean(isSignedIn),
      startEmailLinkSignIn: async (args: {
        emailAddress: string;
        redirectUrl: string;
      }): Promise<void> => {
        if (!isSignInLoaded || !isSignUpLoaded) {
          throw new Error("Authentication is still loading. Please try again.");
        }
        if (!signIn || !signUp) {
          throw new Error("Authentication is not available. Please refresh.");
        }

        // Sign-in only. The account is created after purchase (before login).
        await (signIn as any).create({ identifier: args.emailAddress });
        await (signIn as any).prepareFirstFactor({
          strategy: "email_link",
          redirectUrl: args.redirectUrl,
        });
      },
      startPhoneOtpSignIn: async (args: {
        phoneNumber: string;
        emailAddress?: string;
      }): Promise<void> => {
        if (!isSignInLoaded || !isSignUpLoaded) {
          throw new Error("Authentication is still loading. Please try again.");
        }
        if (!signIn || !signUp) {
          throw new Error("Authentication is not available. Please refresh.");
        }

        pendingPhoneFlow.current = null;

        // Sign-in only. The account is created after purchase (before login).
        await (signIn as any).create({ identifier: args.phoneNumber });
        const firstFactors: unknown[] = Array.isArray(
          (signIn as any).supportedFirstFactors,
        )
          ? ((signIn as any).supportedFirstFactors as unknown[])
          : [];
        const phoneCodeFactor = firstFactors.find(
          (f) =>
            f &&
            typeof f === "object" &&
            (f.strategy === "phone_code" || f.strategy === "phoneCode") &&
            typeof (f as { phoneNumberId?: unknown }).phoneNumberId === "string" &&
            String((f as { phoneNumberId?: unknown }).phoneNumberId).trim(),
        );
        const phoneNumberId =
          phoneCodeFactor && typeof phoneCodeFactor.phoneNumberId === "string"
            ? String(phoneCodeFactor.phoneNumberId).trim()
            : "";
        if (!phoneNumberId) {
          throw new Error(
            "Could not start phone verification. Please use email instead.",
          );
        }

        await (signIn as any).prepareFirstFactor({
          strategy: "phone_code",
          phoneNumberId,
        });
        pendingPhoneFlow.current = "signIn";
      },
      attemptPhoneOtpSignIn: async (args: {
        code: string;
        emailAddress?: string;
      }): Promise<void> => {
        if (!isSignInLoaded || !isSignUpLoaded) {
          throw new Error("Authentication is still loading. Please try again.");
        }
        if (!signIn || !signUp) {
          throw new Error("Authentication is not available. Please refresh.");
        }

        const code = args.code.trim();
        if (!code) {
          throw new Error("Missing code.");
        }
        const emailAddress =
          typeof args.emailAddress === "string" ? args.emailAddress.trim() : "";

        const kind = pendingPhoneFlow.current;
        if (kind === "signIn") {
          try {
            const result = await (signIn as any).attemptFirstFactor({
              strategy: "phone_code",
              code,
            });
            const createdSessionId =
              (result as { createdSessionId?: unknown })?.createdSessionId ??
              (signIn as { createdSessionId?: unknown }).createdSessionId ??
              null;
            const status =
              typeof (result as { status?: unknown })?.status === "string"
                ? String((result as { status?: unknown }).status)
                : "";
            if (
              typeof createdSessionId === "string" &&
              createdSessionId.trim()
            ) {
              await (clerk.setActive as any)({ session: createdSessionId });
              await joinTenantOrgAndSetActive(createdSessionId);
              return;
            }
            throw new Error(
              status
                ? `Could not create a session (status: ${status}).`
                : "Could not create a session.",
            );
          } catch (err: unknown) {
            console.error("[checkout] phone OTP sign-in failed", err);
            throw err instanceof Error ? err : new Error("Invalid code.");
          }
        }

        if (kind === "signUp") {
          try {
            const result = await (signUp as any).attemptPhoneNumberVerification({
              code,
            });
            const createdSessionId =
              (result as { createdSessionId?: unknown })?.createdSessionId ??
              (signUp as { createdSessionId?: unknown }).createdSessionId ??
              null;
            const status =
              typeof (result as { status?: unknown })?.status === "string"
                ? String((result as { status?: unknown }).status)
                : "";
            if (
              typeof createdSessionId === "string" &&
              createdSessionId.trim()
            ) {
              await (clerk.setActive as any)({ session: createdSessionId });
              await joinTenantOrgAndSetActive(createdSessionId);
              return;
            }

            // Your Clerk config can land here when phone is verified but email-link
            // verification is still required before a session can be created.
            if (status === "missing_requirements" && emailAddress) {
              if (typeof window !== "undefined") {
                await (signUp as any).prepareEmailAddressVerification({
                  strategy: "email_link",
                  redirectUrl: window.location.href,
                });
              }
              throw new Error(
                "Phone verified. Check your email for a sign-in link to finish.",
              );
            }

            throw new Error(
              status
                ? `Could not create a session (status: ${status}).`
                : "Could not create a session.",
            );
          } catch (err: unknown) {
            console.error("[checkout] phone OTP sign-up failed", err);
            throw err instanceof Error ? err : new Error("Invalid code.");
          }
        }

        throw new Error("Please request a code first.");
      },
    };
  }, [clerk.setActive, isSignInLoaded, isSignUpLoaded, isSignedIn, signIn, signUp]);

  return <CheckoutClient {...props} clerk={clerkAdapter} />;
}


