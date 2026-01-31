"use client";

import * as React from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { api } from "@convex-config/_generated/api";
import { EmailSettingsPanel, type EmailPluginFrontendApi } from "launchthat-plugin-email/frontend";

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

interface TenantSessionUser {
  organizationId?: string | null;
}

interface TenantMeResponse {
  user: TenantSessionUser | null;
}

export const EmailSettingsClient = () => {
  return <EmailSettingsClientTenant />;
};

const EmailSettingsClientTenant = () => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const ensureUser = useMutation(api.coreTenant.mutations.createOrGetUser as any);
  const [me, setMe] = React.useState<TenantMeResponse | null>(null);
  const [isMeLoading, setIsMeLoading] = React.useState(true);
  const inFlightRef = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    void ensureUser({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  React.useEffect(() => {
    if (authLoading) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
          cache: "no-store",
        });
        if (!res.ok) {
          setMe({ user: null });
          setIsMeLoading(false);
          return;
        }
        const json: unknown = await res.json();
        if (json && typeof json === "object" && "user" in json) {
          setMe(json as TenantMeResponse);
        } else {
          setMe({ user: null });
        }
        setIsMeLoading(false);
      } catch {
        setMe({ user: null });
        setIsMeLoading(false);
      } finally {
        inFlightRef.current = false;
      }
    };
    void fetchMe();
  }, [authLoading]);

  const orgId = React.useMemo(() => {
    const org = me?.user?.organizationId;
    return typeof org === "string" ? org : null;
  }, [me]);

  const emailApi: EmailPluginFrontendApi = React.useMemo(
    () => ({
      queries: {
        getEmailSettings: api.email.queries.getEmailSettings,
        getEmailDomain: api.email.queries.getEmailDomain,
      },
      mutations: {
        upsertEmailSettings: api.email.mutations.upsertEmailSettings,
        setEmailDomain: api.email.mutations.setEmailDomain,
        enqueueTestEmail: api.email.mutations.enqueueTestEmail,
      },
      actions: {
        syncEmailDomain: api.email.actions.syncEmailDomain,
      },
    }),
    [],
  );

  if (authLoading || isMeLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (!orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No active organization found for your user.
        </CardContent>
      </Card>
    );
  }

  return <EmailSettingsPanel api={emailApi} orgId={orgId} />;
};

