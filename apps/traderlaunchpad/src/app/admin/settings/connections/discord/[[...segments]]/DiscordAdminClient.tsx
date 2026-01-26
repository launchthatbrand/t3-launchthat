"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { DiscordAdminRouter } from "launchthat-plugin-discord/frontend/discord";

import { useTenant } from "~/context/TenantContext";

export function AdminSettingsOrgDiscordAdminClient() {
  const tenant = useTenant();
  const organizationId = tenant?._id ?? "";
  const pathname = usePathname();
  const basePath = pathname.startsWith("/admin/connections/discord")
    ? "/admin/connections/discord"
    : "/admin/settings/connections/discord";
  const router = useRouter();
  const searchParams = useSearchParams();
  const completeBotInstall = useAction(api.discord.actions.completeBotInstall);
  const handledInstallRef = React.useRef<string | null>(null);

  const params = useParams<{ segments?: string | string[] }>();
  const rawSegments = params.segments;
  const segments = Array.isArray(rawSegments)
    ? rawSegments
    : rawSegments
      ? [rawSegments]
      : [];

  React.useEffect(() => {
    const guildId = searchParams.get("guild_id");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    if (error) {
      // Keep it simple for now—just clear the URL.
      router.replace(`${basePath}/connections`);
      return;
    }
    if (!guildId || !state) return;

    const key = `${state}::${guildId}`;
    if (handledInstallRef.current === key) return;
    handledInstallRef.current = key;

    void (async () => {
      try {
        await completeBotInstall({ state, guildId });
      } finally {
        router.replace(`${basePath}/connections`);
      }
    })();
  }, [basePath, completeBotInstall, router, searchParams]);

  const templateContexts = React.useMemo(
    () => [
      {
        kind: "tradeidea",
        label: "Trade idea",
        description: "Summaries for trade ideas shared to Discord.",
        defaultTemplate: [
          "**{{symbol}}** — **{{direction}}** — **{{status}}**",
          "Qty: `{{netQty}}`{{avgEntryPrice}}",
          "{{realizedPnl}}",
          "{{fees}}",
          "{{openedAt}}",
          "{{closedAt}}",
        ]
          .filter(Boolean)
          .join("\n"),
        fields: [
          { key: "symbol", label: "Symbol" },
          { key: "direction", label: "Direction" },
          { key: "status", label: "Status" },
          { key: "netQty", label: "Net quantity" },
          { key: "avgEntryPrice", label: "Avg entry price" },
          { key: "realizedPnl", label: "Realized PnL" },
          { key: "fees", label: "Fees" },
          { key: "openedAt", label: "Opened at" },
          { key: "closedAt", label: "Closed at" },
        ],
      },
    ],
    [],
  );

  const ui = React.useMemo(
    () => ({
      cardClassName:
        "border border-border/60 bg-card/70 backdrop-blur border-l-4 border-l-emerald-500/50",
      cardHeaderClassName: "pb-2",
      badgeClassName: "border border-border/40",
      badgePositiveClassName:
        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
      badgeNegativeClassName: "bg-red-500/10 text-red-500 border border-red-500/30",
      outlineButtonClassName: "border-border/60",
    }),
    [],
  );

  if (!organizationId) return null;

  return (
    <DiscordAdminRouter
      segments={segments}
      organizationId={organizationId}
      basePath={basePath}
      LinkComponent={Link}
      templateContexts={templateContexts}
      defaultTemplateKind="tradeidea"
      ui={ui}
      api={{
        queries: api.discord.queries,
        mutations: api.discord.mutations,
        actions: api.discord.actions,
        media: {
          organizationMedia: {
            listRef: api.coreTenant.organizations.listOrganizationMedia,
            generateUploadUrlRef: api.coreTenant.organizations.generateOrganizationMediaUploadUrl,
            createRef: api.coreTenant.organizations.createOrganizationMedia,
          },
        },
      }}
    />
  );
}

