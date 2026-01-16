"use client";

import React from "react";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, ExternalLink, Shield, XCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

const parseScopes = (raw: string | null) => {
  const s = (raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[ +]/g)
    .map((t) => t.trim())
    .filter(Boolean);
};

export default function OAuthAuthorizeMockPage() {
  const { userId, isLoaded } = useAuth();
  const params = useSearchParams();

  React.useEffect(() => {
    if (isLoaded && !userId) redirect("/sign-in");
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) return null;

  const clientId = params.get("client_id") ?? "unknown_client";
  const redirectUri = params.get("redirect_uri") ?? "/admin/integrations/portal/callback";
  const state = params.get("state") ?? "mockstate";
  const scope = params.get("scope");
  const scopes = parseScopes(scope);

  const allowHref = `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}code=mock_auth_code&state=${encodeURIComponent(
    state,
  )}`;
  const denyHref = `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}error=access_denied&state=${encodeURIComponent(
    state,
  )}`;

  return (
    <div className="animate-in fade-in mx-auto max-w-3xl space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">OAuth authorize</div>
          <h1 className="text-3xl font-bold tracking-tight">Approve access?</h1>
          <div className="text-muted-foreground text-sm">
            This is a mocked consent screen for the Portal integration.
          </div>
        </div>
        <Badge variant="outline">mock</Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-500" />
            Portal wants to access your TraderLaunchpad account
          </CardTitle>
          <CardDescription>
            You’ll be redirected back to Portal after approving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground text-xs">Client</div>
              <div className="mt-1 text-sm font-semibold">Portal ({clientId})</div>
              <div className="text-muted-foreground mt-1 text-xs">
                Verified app (mock)
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground text-xs">Redirect URI</div>
              <div className="mt-1 break-all text-sm font-semibold">
                {redirectUri}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Requested scopes</div>
            <div className="flex flex-wrap gap-2">
              {(scopes.length ? scopes : ["trades:read"]).map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="bg-muted text-muted-foreground hover:bg-muted"
                >
                  {s}
                </Badge>
              ))}
            </div>
            <div className="text-muted-foreground text-xs">
              Scopes define what Portal can do. In production, these are enforced server-side.
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/integrations/portal">
                <ExternalLink className="mr-2 h-4 w-4" />
                Back to Portal Integration
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                asChild
              >
                <Link href={denyHref}>
                  <XCircle className="h-4 w-4" />
                  Deny
                </Link>
              </Button>
              <Button className="gap-2 border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
                <Link href={allowHref}>
                  <CheckCircle2 className="h-4 w-4" />
                  Allow
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            Backend later: PKCE, code exchange, refresh tokens, revocation, audit trails.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

