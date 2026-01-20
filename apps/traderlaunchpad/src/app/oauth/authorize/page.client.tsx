"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";

const parseScopes = (raw: string | null) => {
  const s = (raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[ +]/g)
    .map((t) => t.trim())
    .filter(Boolean);
};

type ScopeRisk = "low" | "medium" | "high";
const scopeCatalog: Record<string, { title: string; description: string; risk: ScopeRisk }> = {
  "trades:read": {
    title: "Read your trades",
    description: "Portal can view your orders, executions, and TradeIdeas analytics inputs.",
    risk: "low",
  },
  "tradeideas:read": {
    title: "Read your TradeIdeas",
    description: "Portal can view your TradeIdeas, review status, and learning queue signals.",
    risk: "low",
  },
  "discord:routing:write": {
    title: "Configure Discord routing",
    description: "Portal can change where trade updates are posted in Discord (channels + rules).",
    risk: "high",
  },
};

const riskBadgeClass = (risk: ScopeRisk) => {
  if (risk === "high") return "bg-red-500/10 text-red-500 hover:bg-red-500/10";
  if (risk === "medium") return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10";
  return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10";
};

const normalizeRedirect = (
  redirectUriRaw: string,
  extra: Record<string, string>,
): { href: string; isSafe: boolean; isExternal: boolean } => {
  const redirectUri = (redirectUriRaw ?? "").trim();
  const isRelative = redirectUri.startsWith("/");
  const isHttp = redirectUri.startsWith("http://") || redirectUri.startsWith("https://");
  const isSafe = isRelative || isHttp;
  const isExternal = isHttp;

  if (!isSafe) {
    return { href: "/admin/integrations/portal", isSafe: false, isExternal: false };
  }

  // Use URL to safely add query params (requires a base for relative URLs).
  const u = isHttp ? new URL(redirectUri) : new URL(redirectUri, "http://local.invalid");
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  const href = isHttp ? u.toString() : `${u.pathname}${u.search}${u.hash}`;
  return { href, isSafe: true, isExternal };
};

export default function OAuthAuthorizeClientPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const params = useSearchParams();
  const [remember, setRemember] = React.useState(true);

  React.useEffect(() => {
    if (isLoaded && !userId) router.replace("/sign-in");
  }, [isLoaded, router, userId]);

  if (!isLoaded || !userId) return null;

  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "mockstate";
  const scope = params.get("scope");
  const scopes = parseScopes(scope);

  const effectiveRedirectUri = redirectUri || "/admin/integrations/portal/callback";
  const allow = normalizeRedirect(effectiveRedirectUri, {
    code: "mock_auth_code",
    state,
    remember: remember ? "1" : "0",
  });
  const deny = normalizeRedirect(effectiveRedirectUri, {
    error: "access_denied",
    state,
  });

  const resolvedScopes = (scopes.length ? scopes : ["trades:read"]).map((s) => ({
    id: s,
    title: scopeCatalog[s]?.title ?? s,
    description: scopeCatalog[s]?.description ?? "Scope details not defined yet.",
    risk: scopeCatalog[s]?.risk ?? ("medium" as const),
  }));

  const highestRisk: ScopeRisk = resolvedScopes.some((s) => s.risk === "high")
    ? "high"
    : resolvedScopes.some((s) => s.risk === "medium")
      ? "medium"
      : "low";

  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;

  return (
    <div className="animate-in fade-in mx-auto max-w-4xl space-y-6 duration-500">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-blue-600/10 via-transparent to-transparent p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_0%,rgba(59,130,246,0.20),transparent_60%)]" />
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">OAuth authorize</div>
          <h1 className="text-3xl font-bold tracking-tight">Approve access</h1>
          <div className="text-muted-foreground text-sm">
            Review what Portal is requesting before you allow it.
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">mock</Badge>
          <Badge className={riskBadgeClass(highestRisk)}>
            {highestRisk === "high" ? "High risk" : highestRisk === "medium" ? "Medium risk" : "Low risk"}
          </Badge>
          {!clientId ? (
            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10">Missing client_id</Badge>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-500" />
            Portal wants access to your TraderLaunchpad data
          </CardTitle>
          <CardDescription>You’ll be redirected back after approving (mock).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground text-xs">Client</div>
              <div className="mt-1 text-sm font-semibold">
                Portal {clientId ? <span className="text-muted-foreground">({clientId})</span> : null}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Verified app (mock) • Requested on {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground text-xs">Signed in as</div>
              <div className="mt-1 text-sm font-semibold">{email ?? "user"}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                User ID: <span className="font-mono">{userId}</span>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground text-xs">Redirect URI</div>
              <div className="mt-1 break-all text-sm font-semibold">{effectiveRedirectUri}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {allow.isExternal ? "External redirect (mock)" : "Internal redirect"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Requested access</div>
              <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                {resolvedScopes.length} scope{resolvedScopes.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {resolvedScopes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-muted-foreground text-sm">{s.description}</div>
                    <div className="text-muted-foreground text-xs font-mono">{s.id}</div>
                  </div>
                  <Badge className={riskBadgeClass(s.risk)}>{s.risk}</Badge>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-4 text-sm">
              <Info className="mt-0.5 h-4 w-4 text-blue-500" />
              <div className="text-muted-foreground">
                This is a mock consent screen. Later, this will be backed by an OAuth server and stored grants.
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <div className="text-sm font-semibold">Remember this decision</div>
              </div>
              <div className="text-muted-foreground text-sm">
                Save this approval for future requests from Portal (mock).
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label>Remember</Label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" asChild>
              <Link href={deny.href}>
                <XCircle className="mr-2 h-4 w-4" />
                Deny
              </Link>
            </Button>
            <div className="flex flex-1 items-center justify-end gap-2">
              {allow.isExternal ? (
                <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  External redirect
                </Badge>
              ) : null}
              <Button className="bg-blue-600 text-white hover:bg-blue-700" asChild>
                <Link href={allow.href}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Allow access
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              <span>Redirects to: {allow.href}</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/integrations/portal">Back to Portal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

