"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAction } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { DiscordAdminRouter } from "launchthat-plugin-discord/frontend/discord";
import { useDiscordBotInstallCallback } from "~/components/discord/useDiscordBotInstallCallback";

export function PlatformDiscordAdminClient() {
  const pathname = usePathname();
  const completeBotInstall = useAction(api.platformDiscord.actions.completeBotInstall);

  const params = useParams<{ segments?: string | string[] }>();
  const rawSegments = params.segments;
  const segments = Array.isArray(rawSegments)
    ? rawSegments
    : rawSegments
      ? [rawSegments]
      : [];

  useDiscordBotInstallCallback({
    basePath: "/platform/integrations/discord",
    onComplete: ({ state, guildId }) => completeBotInstall({ state, guildId }),
  });

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
      badgeNegativeClassName:
        "bg-red-500/10 text-red-500 border border-red-500/30",
      outlineButtonClassName: "border-border/60",
    }),
    [],
  );

  return (
    <DiscordAdminRouter
      segments={segments}
      basePath="/platform/integrations/discord"
      LinkComponent={Link}
      templateContexts={templateContexts}
      defaultTemplateKind="tradeidea"
      ui={ui}
      api={{
        queries: api.platformDiscord.queries,
        mutations: api.platformDiscord.mutations,
        actions: api.platformDiscord.actions,
      }}
      className={pathname.includes("/platform/integrations/discord") ? "" : undefined}
    />
  );
}
