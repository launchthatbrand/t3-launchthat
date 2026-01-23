"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
const TOKEN_UPDATED_EVENT = "convex-token-updated";
const TENANT_SESSION_UPDATED_EVENT = "tenant-session-updated";

export default function AuthCallbackPage() {
  const params = useSearchParams();

  const code = (params.get("code") ?? "").trim();
  const token = (params.get("token") ?? "").trim();
  const returnTo = (params.get("return_to") ?? "").trim();

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!code) {
        window.location.assign("/");
        return;
      }

      if (token) {
        try {
          localStorage.setItem(CONVEX_TOKEN_STORAGE_KEY, token);
          window.dispatchEvent(new Event(TOKEN_UPDATED_EVENT));
        } catch {
          // ignore
        }
      }

      try {
        const res = await fetch("/api/auth/exchange", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          window.location.assign("/");
          return;
        }
        // Notify any persistent UI that the tenant session cookie is now set.
        window.dispatchEvent(new Event(TENANT_SESSION_UPDATED_EVENT));
      } catch {
        if (!cancelled) window.location.assign("/");
        return;
      }

      if (cancelled) return;

      // Only allow same-origin redirects; otherwise fall back to "/".
      if (returnTo) {
        try {
          const url = new URL(returnTo);
          if (url.origin === window.location.origin) {
            window.location.assign(url.pathname + url.search + url.hash);
            return;
          }
        } catch {
          // ignore
        }
      }
      window.location.assign("/");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [code, returnTo, token]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground text-sm">Signing you in…</div>
    </div>
  );
}

