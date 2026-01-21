"use client";

import * as React from "react";
import { useSession } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { api } from "@convex-config/_generated/api";
import { EmailSettingsPanel, type EmailPluginFrontendApi } from "launchthat-plugin-email/frontend";

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const EmailSettingsClient = () => {
  const { session } = useSession();
  const clerkId = session?.user?.id ?? null;

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = Boolean(clerkId) && isAuthenticated && !authLoading;

  const ensureUser = useMutation(api.coreTenant.mutations.createOrGetUser as any);
  React.useEffect(() => {
    if (!clerkId) return;
    void ensureUser({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkId]);

  const user = useQuery(
    api.coreTenant.queries.getUserByClerkId,
    shouldQuery && clerkId ? { clerkId } : "skip",
  ) as unknown;

  const orgId = React.useMemo(() => {
    if (!isRecord(user)) return null;
    const org = user.organizationId;
    return typeof org === "string" ? org : null;
  }, [user]);

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

  if (!shouldQuery) {
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

