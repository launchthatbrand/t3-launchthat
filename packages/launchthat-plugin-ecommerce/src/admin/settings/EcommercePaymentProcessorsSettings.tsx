"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import type { ColumnDefinition } from "@acme/ui/entity-list";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list";
import { Switch } from "@acme/ui/switch";

import { getPaymentMethods } from "../../payments/registry";

const apiAny = api as any;

type Row = {
  id: string;
  label: string;
  description?: string;
  pluginActive: boolean;
  configured: boolean;
  enabled: boolean;
  pluginActiveOptionKey: string;
  paymentEnabledOptionKey: string;
  configOptionKey: string;
  canEditSettings: boolean;
};

const asBoolean = (value: unknown): boolean => value === true;

export const EcommercePaymentProcessorsSettings = (
  props: PluginSettingComponentProps,
) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = props.organizationId ? String(props.organizationId) : undefined;
  const [isPending, startTransition] = useTransition();

  const paymentMethods = useMemo(() => getPaymentMethods(), []);

  const pluginActiveOptionKeys = useMemo(
    () => paymentMethods.map((m) => m.config.pluginActiveOptionKey),
    [paymentMethods],
  );
  const paymentEnabledOptionKeys = useMemo(
    () => paymentMethods.map((m) => m.config.paymentEnabledOptionKey),
    [paymentMethods],
  );
  const configOptionKeys = useMemo(
    () => paymentMethods.map((m) => m.config.configOptionKey),
    [paymentMethods],
  );

  const pluginActiveMap = useQuery(apiAny.core.options.getMany, {
    metaKeys: pluginActiveOptionKeys,
    type: "site",
    orgId,
  }) as Record<string, unknown> | undefined;

  const paymentEnabledMap = useQuery(apiAny.core.options.getMany, {
    metaKeys: paymentEnabledOptionKeys,
    type: "site",
    orgId,
  }) as Record<string, unknown> | undefined;

  const configMap = useQuery(apiAny.core.options.getMany, {
    metaKeys: configOptionKeys,
    type: "site",
    orgId,
  }) as Record<string, unknown> | undefined;

  const setOption = useMutation(apiAny.core.options.set) as (
    args: any,
  ) => Promise<any>;

  const rows = useMemo((): Array<Row> => {
    return paymentMethods.map((m) => {
      const pluginActiveRaw = pluginActiveMap?.[m.config.pluginActiveOptionKey];
      const enabledRaw = paymentEnabledMap?.[m.config.paymentEnabledOptionKey];
      const configRaw = configMap?.[m.config.configOptionKey];
      const pluginActive = asBoolean(pluginActiveRaw);
      const configured = pluginActive ? m.isConfigured(configRaw) : false;
      return {
        id: m.id,
        label: m.label,
        description: m.description,
        pluginActive,
        configured,
        enabled: pluginActive ? asBoolean(enabledRaw) : false,
        pluginActiveOptionKey: m.config.pluginActiveOptionKey,
        paymentEnabledOptionKey: m.config.paymentEnabledOptionKey,
        configOptionKey: m.config.configOptionKey,
        canEditSettings: pluginActive && typeof m.renderSettings === "function",
      };
    });
  }, [configMap, paymentEnabledMap, paymentMethods, pluginActiveMap]);

  const visibleRows = useMemo(() => rows.filter((r) => r.pluginActive), [rows]);

  const activeSettingsId = useMemo(() => {
    const raw = searchParams.get("section")?.toLowerCase().trim() ?? "";
    return raw || null;
  }, [searchParams]);

  const activeMethod = useMemo(() => {
    if (!activeSettingsId) return null;
    return paymentMethods.find((m) => m.id === activeSettingsId) ?? null;
  }, [activeSettingsId, paymentMethods]);

  const handleOpenSettings = (methodId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("plugin", "ecommerce");
    params.set("page", "settings");
    params.set("tab", "payment-processors");
    params.set("section", methodId);
    router.replace(`/admin/edit?${params.toString()}`);
  };

  const handleCloseSettings = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("section");
    router.replace(`/admin/edit?${params.toString()}`);
  };

  const columns = useMemo((): Array<ColumnDefinition<Row>> => {
    return [
      {
        id: "label",
        header: "Payment method",
        accessorKey: "label",
        cell: (context: { row: { original: Row } }) => {
          const data = context.row.original;
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">{data.label}</div>
              {data.description ? (
                <div className="text-muted-foreground text-xs">
                  {data.description}
                </div>
              ) : null}
              {!data.configured ? (
                <div className="text-muted-foreground text-xs">
                  Not configured (add API keys).
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "enabled",
        header: "Enabled",
        accessorKey: "enabled",
        cell: (context: { row: { original: Row } }) => {
          const data = context.row.original;
          return (
            <div className="flex items-center justify-end">
              <Switch
                checked={data.enabled}
                disabled={isPending || !data.pluginActive}
                onCheckedChange={(checked) => {
                  startTransition(() => {
                    void setOption({
                      metaKey: data.paymentEnabledOptionKey,
                      metaValue: checked,
                      type: "site",
                      orgId,
                    });
                  });
                }}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: (context: { row: { original: Row } }) => {
          const data = context.row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!data.canEditSettings}
                onClick={() => handleOpenSettings(data.id)}
              >
                Edit
              </Button>
            </div>
          );
        },
      },
    ];
  }, [handleOpenSettings, isPending, orgId, setOption]);

  return (
    <div className="space-y-4">
      {activeMethod && typeof activeMethod.renderSettings === "function" ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCloseSettings}
              aria-label="Back to payment processors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <CardTitle>{activeMethod.label} settings</CardTitle>
              <CardDescription>
                Configure credentials for this processor.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>{activeMethod.renderSettings(props) as any}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment processors</CardTitle>
            <CardDescription>
              Enable supported payment processors and configure their
              credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <EntityList<Row>
              data={visibleRows}
              columns={columns}
              isLoading={!pluginActiveMap || !paymentEnabledMap || !configMap}
              enableFooter={false}
              enableSearch={false}
              viewModes={["list"]}
              defaultViewMode="list"
              emptyState={
                <div className="text-muted-foreground py-8 text-center">
                  No payment plugins are active. Activate Stripe/Authorize.Net
                  in Plugins.
                </div>
              }
              className="p-4"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
