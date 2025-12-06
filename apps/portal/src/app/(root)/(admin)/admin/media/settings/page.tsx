/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import { MediaSettingsForm } from "./_components/MediaSettingsForm";
import { Separator } from "@acme/ui/separator";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { useTenant } from "~/context/TenantContext";

export default function MediaSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = useTenant();
  const tenantId = tenant?._id ?? null;
  const organizationId = getTenantOrganizationId(tenant);
  const ownerKey = tenantId;
  const pluginOptionsOrgId = organizationId ?? tenantId ?? null;

  const vimeoOption = useQuery(
    api.core.options.get,
    pluginOptionsOrgId
      ? {
          orgId: pluginOptionsOrgId,
          type: "site",
          metaKey: "plugin_vimeo_enabled",
        }
      : "skip",
  );
  const isVimeoEnabled = Boolean(vimeoOption?.metaValue);

  const searchParamsString = searchParams.toString();
  const activeTab = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const requested = params.get("tab") ?? "media";
    if (requested === "vimeo" && !isVimeoEnabled) {
      return "media";
    }
    return requested;
  }, [searchParamsString, isVimeoEnabled]);

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [exchangeMessage, setExchangeMessage] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const rawConnections = useQuery(
    api.integrations.connections.queries.list,
    ownerKey
      ? {
          nodeType: "vimeo",
          ownerId: ownerKey,
        }
      : "skip",
  ) as Doc<"connections">[] | undefined;
  const connections: Doc<"connections">[] = Array.isArray(rawConnections)
    ? rawConnections
    : [];
  const activeConnection = connections[0];
  const isConnected = Boolean(activeConnection);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const upsertConnection = useAction(
    api.integrations.connections.actions.upsertForOwner,
  );
  const removeConnection = useMutation(
    api.integrations.connections.mutations.remove,
  );
  const triggerVimeoSync = useMutation(api.vimeo.mutations.triggerSync);

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "vimeo" && !isVimeoEnabled) {
        return;
      }
      const params = new URLSearchParams(searchParamsString);
      if (value === "media") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      router.replace(
        params.toString()
          ? `/admin/media/settings?${params.toString()}`
          : "/admin/media/settings",
      );
    },
    [router, searchParamsString, isVimeoEnabled],
  );

  const clearAuthParams = useCallback(() => {
    const params = new URLSearchParams(searchParamsString);
    const before = params.toString();
    params.delete("code");
    params.delete("error");
    params.delete("error_description");
    const after = params.toString();
    if (after === before) {
      return;
    }
    router.replace(
      after ? `/admin/media/settings?${after}` : "/admin/media/settings",
    );
  }, [router, searchParamsString]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    if (!isVimeoEnabled && params.get("tab") === "vimeo") {
      params.delete("tab");
      router.replace(
        params.toString()
          ? `/admin/media/settings?${params.toString()}`
          : "/admin/media/settings",
      );
    }
  }, [isVimeoEnabled, router, searchParamsString]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (!code && !error) {
      return;
    }

    if (error) {
      setExchangeError(errorDescription ?? error);
      setExchangeMessage(null);
      clearAuthParams();
      return;
    }

    if (!code) {
      return;
    }

    const exchangeCode = async () => {
      setIsExchanging(true);
      setExchangeError(null);
      setExchangeMessage(null);
      try {
        const response = await fetch("/api/integrations/vimeo/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) {
          let errorPayload: unknown;
          try {
            errorPayload = await response.json();
          } catch {
            errorPayload = null;
          }
          const normalizedError =
            typeof errorPayload === "object" &&
            errorPayload !== null &&
            "error" in errorPayload &&
            typeof (errorPayload as { error?: string }).error === "string"
              ? (errorPayload as { error?: string }).error
              : "Vimeo authorization exchange failed";
          throw new Error(normalizedError);
        }
        const payloadRaw: unknown = await response.json();
        const payload =
          typeof payloadRaw === "object" && payloadRaw !== null
            ? (payloadRaw as { access_token?: string })
            : {};

        if (!ownerKey) {
          setExchangeMessage(
            "Authorization complete, but no tenant was detected to store the connection.",
          );
          return;
        }

        const accessToken = payload.access_token;
        if (!accessToken) {
          throw new Error("Vimeo response missing access token.");
        }

        const connectionId = await Promise.resolve(
          upsertConnection({
            nodeType: "vimeo",
            name: `${tenant?.name ?? "Portal"} Vimeo`,
            ownerId: ownerKey,
            credentials: accessToken as string,
            status: "connected",
          }),
        );

        try {
          await Promise.resolve(triggerVimeoSync({ connectionId }));
        } catch (syncError) {
          console.error("Failed to queue Vimeo sync", syncError);
        }

        setExchangeMessage("Vimeo connection saved successfully.");
      } catch (err) {
        setExchangeError(
          err instanceof Error ? err.message : "Unexpected Vimeo error",
        );
      } finally {
        setIsExchanging(false);
        clearAuthParams();
      }
    };

    void exchangeCode();
  }, [
    clearAuthParams,
    ownerKey,
    searchParamsString,
    tenant?.name,
    triggerVimeoSync,
    upsertConnection,
  ]);

  const convexBaseUrl = env.NEXT_PUBLIC_CONVEX_URL;

  const handleStartVimeoOAuth = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!convexBaseUrl) {
      setExchangeError("Missing NEXT_PUBLIC_CONVEX_URL environment variable.");
      return;
    }
    setIsAuthorizing(true);
    setExchangeError(null);
    setExchangeMessage(null);
    const origin = encodeURIComponent(window.location.origin);
    window.location.href = `${convexBaseUrl}/api/integrations/vimeo/start?origin=${origin}`;
  }, [convexBaseUrl]);

  const handleDisconnect = useCallback(async () => {
    if (!activeConnection) return;
    try {
      setIsDisconnecting(true);
      await Promise.resolve(removeConnection({ id: activeConnection._id }));
      setExchangeMessage("Vimeo connection removed.");
      setExchangeError(null);
    } catch (error) {
      setExchangeError(
        error instanceof Error ? error.message : "Failed to disconnect Vimeo.",
      );
    } finally {
      setIsDisconnecting(false);
    }
  }, [activeConnection, removeConnection]);

  return (
    <AdminLayout
      title="Media Settings"
      description="Configure how uploads, external providers, and thumbnails behave."
      pathname="/admin/media/settings"
    >
      <AdminLayoutContent>
        <AdminLayoutMain>
          <AdminLayoutHeader />
          <div className="container py-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="media">Media</TabsTrigger>
                {isVimeoEnabled ? (
                  <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value="media" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload defaults</CardTitle>
                    <CardDescription>
                      Extend this form with real backend settings once the API
                      is available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MediaSettingsForm />
                  </CardContent>
                </Card>
              </TabsContent>

              {isVimeoEnabled ? (
                <TabsContent value="vimeo" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vimeo integration</CardTitle>
                      <CardDescription>
                        Manage how the Vimeo connector behaves inside the media
                        archive.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-base font-medium">Mock connector</p>
                        <p className="text-muted-foreground text-sm">
                          The Vimeo plugin currently renders mocked data in a
                          dedicated archive tab. Configure a real API key once
                          the integration is ready.
                        </p>
                      </div>
                      <Separator />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            Authorize Vimeo accounts
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Starts the OAuth flow that uses your portal-wide
                            Vimeo app (configured via
                            <code className="bg-muted ml-1 rounded px-1 text-xs">
                              NEXT_PUBLIC_VIMEO_CLIENT_ID
                            </code>{" "}
                            /
                            <code className="bg-muted ml-1 rounded px-1 text-xs">
                              VIMEO_CLIENT_SECRET
                            </code>
                            ) so organizations can connect their own channels.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleStartVimeoOAuth}
                            disabled={isAuthorizing || isExchanging}
                          >
                            {isAuthorizing
                              ? "Redirecting..."
                              : isConnected
                                ? "Reauthorize"
                                : "Start OAuth flow"}
                          </Button>
                          {isConnected ? (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={handleDisconnect}
                              disabled={isDisconnecting}
                            >
                              {isDisconnecting
                                ? "Disconnecting..."
                                : "Disconnect"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {isConnected ? (
                        <p className="text-muted-foreground text-sm">
                          Connected to Vimeo for{" "}
                          <span className="font-medium">
                            {tenant?.name ?? "this tenant"}
                          </span>
                          .
                        </p>
                      ) : null}
                      {exchangeMessage && (
                        <p className="text-sm text-emerald-600">
                          {exchangeMessage}
                        </p>
                      )}
                      {exchangeError && (
                        <p className="text-destructive text-sm">
                          {exchangeError}
                        </p>
                      )}
                      <Separator />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Open Vimeo media tab</p>
                          <p className="text-muted-foreground text-sm">
                            Jump directly to the media archive with the Vimeo
                            tab selected.
                          </p>
                        </div>
                        <Button asChild>
                          <Link href="/admin/edit?post_type=attachments&tab=vimeo">
                            Go to media archive
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ) : null}
            </Tabs>
          </div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
