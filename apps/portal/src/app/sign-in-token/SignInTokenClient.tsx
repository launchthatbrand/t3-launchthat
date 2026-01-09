"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export function SignInTokenClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { setActive } = useClerk();

  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(true);

  const session = params.get("session") ?? "";
  const returnTo = params.get("return_to") ?? "";
  const tenant = params.get("tenant") ?? "";

  const callbackUrl = useMemo(() => {
    const qs = new URLSearchParams();
    if (returnTo) qs.set("return_to", returnTo);
    if (tenant) qs.set("tenant", tenant);
    const s = qs.toString();
    return s.length > 0 ? `/api/auth/callback?${s}` : "/api/auth/callback";
  }, [returnTo, tenant]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!session) {
        setError("Missing session token.");
        setIsWorking(false);
        return;
      }
      try {
        await setActive({ session });
        if (cancelled) return;
        window.location.assign(callbackUrl);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setIsWorking(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [callbackUrl, session, setActive]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Signing you in…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Please wait while we finish setting up your session.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isWorking}
              onClick={() => router.push("/sign-in")}
            >
              Go to sign-in
            </Button>
            <Button
              type="button"
              disabled={isWorking}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


