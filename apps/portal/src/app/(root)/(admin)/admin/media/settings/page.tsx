/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
import { env } from "~/env";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { MediaSettingsForm } from "./_components/MediaSettingsForm";

type VimeoSyncStatusResult =
  | {
      status: "idle" | "running" | "error" | "done";
      nextPage: number;
      perPage: number;
      syncedCount: number;
      pagesFetched: number;
      workflowId?: string;
      lastError?: string;
      startedAt?: number;
      finishedAt?: number;
      updatedAt: number;
    }
  | null
  | undefined;

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
  const exchangedCodeRef = useRef<string | null>(null);
  const inflightCodeRef = useRef<string | null>(null);

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

  const upsertConnection = useAction(
    api.integrations.connections.actions.upsertForOwner,
  );
  const removeConnection = useMutation(
    api.integrations.connections.mutations.remove,
  );
  const startVimeoSync = useMutation(api.vimeo.mutations.startVimeoSync);

  const vimeoSyncStatus = useQuery(
    api.vimeo.syncState.getVimeoSyncStatus,
    organizationId
      ? ({ organizationId } as { organizationId: Id<"organizations"> })
      : "skip",
  ) as VimeoSyncStatusResult;

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

    // Vimeo auth codes are single-use and React StrictMode can run effects twice in dev.
    // Guard against double exchange.
    if (inflightCodeRef.current === code || exchangedCodeRef.current === code) {
      return;
    }
    inflightCodeRef.current = code;

    // Clear params immediately so we don't re-run this effect on rerender/navigation.
    clearAuthParams();

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
          const payloadObj =
            typeof errorPayload === "object" && errorPayload !== null
              ? (errorPayload as Record<string, unknown>)
              : null;
          const topError =
            payloadObj && typeof payloadObj.error === "string"
              ? payloadObj.error
              : "Vimeo authorization exchange failed";
          const details =
            payloadObj &&
            typeof payloadObj.details === "object" &&
            payloadObj.details
              ? (payloadObj.details as Record<string, unknown>)
              : null;
          const detailsMessage =
            details &&
            (typeof details.error_description === "string"
              ? details.error_description
              : typeof details.developer_message === "string"
                ? details.developer_message
                : typeof details.error === "string"
                  ? details.error
                  : null);

          throw new Error(
            detailsMessage ? `${topError}: ${detailsMessage}` : topError,
          );
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

        const _connectionId = await Promise.resolve(
          upsertConnection({
            nodeType: "vimeo",
            name: `${tenant?.name ?? "Portal"} Vimeo`,
            ownerId: ownerKey,
            credentials: accessToken as string,
            status: "connected",
          }),
        );

        if (organizationId) {
          try {
            await Promise.resolve(
              startVimeoSync({
                organizationId: organizationId as Id<"organizations">,
              }),
            );
          } catch (syncError) {
            console.error("Failed to start Vimeo sync", syncError);
          }
        }

        setExchangeMessage("Vimeo connection saved successfully.");
        exchangedCodeRef.current = code;
      } catch (err) {
        setExchangeError(
          err instanceof Error ? err.message : "Unexpected Vimeo error",
        );
      } finally {
        setIsExchanging(false);
        if (inflightCodeRef.current === code) {
          inflightCodeRef.current = null;
        }
      }
    };

    void exchangeCode();
  }, [
    clearAuthParams,
    ownerKey,
    searchParamsString,
    tenant?.name,
    upsertConnection,
    startVimeoSync,
    organizationId,
  ]);

  const convexBaseUrl = env.NEXT_PUBLIC_CONVEX_HTTP_URL;

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

  const [isStartingSync, setIsStartingSync] = useState(false);
  const handleStartSync = useCallback(
    async (restart: boolean) => {
      if (!organizationId) {
        setExchangeError(
          "No organization detected. Switch to an organization to sync Vimeo videos.",
        );
        return;
      }
      setIsStartingSync(true);
      setExchangeError(null);
      try {
        await Promise.resolve(
          startVimeoSync({
            organizationId: organizationId as Id<"organizations">,
            restart,
          }),
        );
        setExchangeMessage(
          restart ? "Vimeo sync restarted." : "Vimeo sync started.",
        );
      } catch (error) {
        setExchangeError(
          error instanceof Error
            ? error.message
            : "Failed to start Vimeo sync.",
        );
      } finally {
        setIsStartingSync(false);
      }
    },
    [organizationId, startVimeoSync],
  );

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
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">Vimeo sync</p>
                            <p className="text-muted-foreground text-sm">
                              Sync Vimeo video metadata into Convex for fast
                              search/browse. Runs in the background and reports
                              progress.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void handleStartSync(false)}
                              disabled={
                                !isConnected ||
                                isStartingSync ||
                                vimeoSyncStatus?.status === "running"
                              }
                            >
                              {vimeoSyncStatus?.status === "running"
                                ? "Syncing…"
                                : "Start sync"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => void handleStartSync(true)}
                              disabled={!isConnected || isStartingSync}
                            >
                              Resync from start
                            </Button>
                          </div>
                        </div>

                        {!isConnected ? (
                          <p className="text-muted-foreground text-sm">
                            Connect Vimeo first to enable syncing.
                          </p>
                        ) : organizationId ? null : (
                          <p className="text-muted-foreground text-sm">
                            Switch to an organization to view sync status.
                          </p>
                        )}

                        {isConnected && organizationId ? (
                          <div className="rounded-lg border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  Status:{" "}
                                  <span className="font-mono">
                                    {vimeoSyncStatus?.status ?? "idle"}
                                  </span>
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {vimeoSyncStatus?.status === "running"
                                    ? `Fetching page ${vimeoSyncStatus.nextPage} (page size ${vimeoSyncStatus.perPage})`
                                    : vimeoSyncStatus?.status === "done"
                                      ? "Sync completed."
                                      : vimeoSyncStatus?.status === "error"
                                        ? "Sync failed."
                                        : "Not currently syncing."}
                                </p>
                              </div>
                              <div className="text-muted-foreground text-xs">
                                <div>
                                  Pages:{" "}
                                  <span className="font-mono">
                                    {vimeoSyncStatus?.pagesFetched ?? 0}
                                  </span>
                                </div>
                                <div>
                                  Videos:{" "}
                                  <span className="font-mono">
                                    {vimeoSyncStatus?.syncedCount ?? 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              <Progress
                                value={
                                  vimeoSyncStatus?.status === "running"
                                    ? 50
                                    : vimeoSyncStatus?.status === "done"
                                      ? 100
                                      : 0
                                }
                              />
                              <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-xs">
                                <span>
                                  Started:{" "}
                                  <span className="font-mono">
                                    {typeof vimeoSyncStatus?.startedAt ===
                                    "number"
                                      ? new Date(
                                          vimeoSyncStatus.startedAt,
                                        ).toLocaleString()
                                      : "—"}
                                  </span>
                                </span>
                                <span>
                                  Finished:{" "}
                                  <span className="font-mono">
                                    {typeof vimeoSyncStatus?.finishedAt ===
                                    "number"
                                      ? new Date(
                                          vimeoSyncStatus.finishedAt,
                                        ).toLocaleString()
                                      : "—"}
                                  </span>
                                </span>
                              </div>
                              {vimeoSyncStatus?.status === "error" &&
                              vimeoSyncStatus.lastError ? (
                                <p className="text-destructive text-xs">
                                  {vimeoSyncStatus.lastError}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
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
