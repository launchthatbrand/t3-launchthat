"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { api } from "@convex-config/_generated/api";
import { useHostContext } from "~/context/HostContext";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const host = useHostContext();
  const code = searchParams.get("code") ?? "";
  const returnTo = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!host.isAuthHost) {
      return `${window.location.origin}/sign-up?code=${encodeURIComponent(code)}`;
    }

    const [hostnameRaw, portRaw] = host.host.split(":");
    const hostname = (hostnameRaw ?? "").trim().toLowerCase();
    const base = hostname.startsWith("auth.") ? hostname.slice(5) : hostname;
    const port = portRaw ? `:${portRaw}` : "";

    const isLocalhost = base === "localhost" || base === "127.0.0.1";
    const proto = window.location.protocol || "http:";

    const tenantHost = isLocalhost ? `${base}${port}` : base;

    return `${proto}//${tenantHost}/sign-up?code=${encodeURIComponent(code)}`;
  }, [code, host.host, host.isAuthHost]);

  const { isAuthenticated, isLoading } = useConvexAuth();
  const redeemPlatformJoinCode = useMutation(
    api.traderlaunchpad.mutations.redeemPlatformJoinCode,
  );

  const [status, setStatus] = React.useState<
    "idle" | "redeeming" | "redeemed" | "invalid" | "error"
  >("idle");

  React.useEffect(() => {
    if (!code) return;
    if (!isAuthenticated) return;
    if (status !== "idle") return;

    setStatus("redeeming");

    void (async () => {
      try {
        const res = (await redeemPlatformJoinCode({ code })) as
          | { ok?: boolean }
          | null
          | undefined;
        const ok = Boolean(res?.ok);
        if (!ok) {
          setStatus("invalid");
          return;
        }
        setStatus("redeemed");
        router.replace("/admin/dashboard");
      } catch {
        setStatus("error");
      }
    })();
  }, [code, isAuthenticated, redeemPlatformJoinCode, router, status]);

  if (!code) {
    return (
      <div className="container py-10">
        <Card className="border-white/10 bg-white/3">
          <CardHeader>
            <CardTitle>Invalid join code</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            This invite link is missing a join code.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <Card className="border-white/10 bg-white/3">
          <CardHeader>
            <CardTitle>Joining…</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            Checking your session…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <Card className="border-white/10 bg-white/3">
          <CardHeader>
            <CardTitle>Sign in to join</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/70">
            <div>You need to sign in before you can use this join code.</div>
            <Button asChild className="border-0 bg-orange-600 text-white hover:bg-orange-700">
              <Link href={`/sign-in?return_to=${encodeURIComponent(returnTo || "/")}`}>
                Continue to sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Card className="border-white/10 bg-white/3">
        <CardHeader>
          <CardTitle>
            {status === "redeeming"
              ? "Joining…"
              : status === "redeemed"
                ? "Joined"
                : status === "invalid"
                  ? "Join code invalid"
                  : status === "error"
                    ? "Something went wrong"
                    : "Ready to join"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/70">
          {status === "redeeming"
            ? "Applying your join code…"
            : status === "redeemed"
              ? "Redirecting…"
              : status === "invalid"
                ? "This join code is invalid or expired."
                : status === "error"
                  ? "Please try again."
                  : "Preparing…"}
        </CardContent>
      </Card>
    </div>
  );
}


