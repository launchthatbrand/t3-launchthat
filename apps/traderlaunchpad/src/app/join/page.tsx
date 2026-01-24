"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { api } from "@convex-config/_generated/api";

interface AcceptInviteResult {
  organizationId: string;
}

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("invite") ?? "";

  const { isAuthenticated, isLoading } = useConvexAuth();
  const acceptInvite = useMutation(api.traderlaunchpad.mutations.acceptOrgUserInvite);

  const [status, setStatus] = React.useState<
    "idle" | "accepting" | "accepted" | "invalid" | "error"
  >("idle");

  React.useEffect(() => {
    if (!token) return;
    if (!isAuthenticated) return;
    if (status !== "idle") return;

    let cancelled = false;
    setStatus("accepting");

    void (async () => {
      try {
        const res = (await acceptInvite({ token })) as unknown as AcceptInviteResult;
        const orgId = typeof res?.organizationId === "string" ? res.organizationId : "";
        if (cancelled) return;
        if (!orgId) {
          setStatus("invalid");
          return;
        }
        setStatus("accepted");
        router.replace("/admin/dashboard");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [acceptInvite, isAuthenticated, router, status, token]);

  if (!token) {
    return (
      <div className="container py-10">
        <Card className="border-white/10 bg-white/3">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            This invite link is missing a token.
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
    const returnTo = `/join?invite=${encodeURIComponent(token)}`;
    return (
      <div className="container py-10">
        <Card className="border-white/10 bg-white/3">
          <CardHeader>
            <CardTitle>Sign in to join</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/70">
            <div>You need to sign in before you can accept this invite.</div>
            <Button asChild className="border-0 bg-orange-600 text-white hover:bg-orange-700">
              <Link href={`/sign-in?return_to=${encodeURIComponent(returnTo)}`}>
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
            {status === "accepting"
              ? "Joining…"
              : status === "accepted"
                ? "Joined"
                : status === "invalid"
                  ? "Invite invalid"
                  : status === "error"
                    ? "Something went wrong"
                    : "Ready to join"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/70">
          {status === "accepting"
            ? "Accepting your invite…"
            : status === "accepted"
              ? "Redirecting…"
              : status === "invalid"
                ? "This invite is invalid or expired."
                : status === "error"
                  ? "Please try again."
                  : "Preparing…"}
        </CardContent>
      </Card>
    </div>
  );
}

