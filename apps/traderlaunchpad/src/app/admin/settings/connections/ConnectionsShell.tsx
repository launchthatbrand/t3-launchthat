"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";

import { AddBrokerConnectionDialog } from "./AddBrokerConnectionDialog";
import { Badge } from "@acme/ui/badge";
import Link from "next/link";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { cn } from "~/lib/utils";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

interface Props {
  children: React.ReactNode;
}

export function ConnectionsShell(props: Props) {
  const pathname = usePathname();
  const dataRaw: unknown = useQuery(api.traderlaunchpad.queries.getMyTradeLockerConnection);

  const connection: UnknownRecord | null =
    isRecord(dataRaw) && isRecord(dataRaw.connection) ? dataRaw.connection : null;
  const accounts: UnknownRecord[] =
    isRecord(dataRaw) && Array.isArray(dataRaw.accounts)
      ? dataRaw.accounts.filter(isRecord)
      : [];

  const providerStatus: string =
    typeof connection?.status === "string"
      ? connection.status
      : "disconnected";
  const isConnected = providerStatus === "connected";
  const selectedAccNum = toNumber(connection?.selectedAccNum);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/80">Connections</div>
          <AddBrokerConnectionDialog triggerClassName="h-8 px-3 text-xs" />
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-white/90">
                  TradeLocker
                </div>
                {isConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-white/5 text-white/60">
                    Disconnected
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-white/55">
                Broker accounts for syncing journal + price data.
              </div>
            </div>
            <div className="shrink-0 text-xs text-white/50">
              {accounts.length} acct{accounts.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {accounts.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/60">
                No accounts yet. Click <span className="font-semibold text-white/80">Add connection</span> to connect one.
              </div>
            ) : (
              accounts.map((row) => {
                const id =
                  typeof row._id === "string" && row._id ? row._id : "";
                if (!id) return null;
                const href = `/admin/settings/connections/${id}`;
                const isActive = pathname === href;

                const isSelected =
                  toNumber(row.accNum) !== null &&
                  selectedAccNum !== null &&
                  toNumber(row.accNum) === selectedAccNum;

                return (
                  <Link
                    key={id}
                    href={href}
                    className={cn(
                      "block rounded-lg border border-white/10 bg-black/30 p-3 transition hover:bg-black/40",
                      isActive && "border-white/20 bg-black/50",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white/85">
                        {typeof row.name === "string" && row.name.trim()
                          ? row.name
                          : `Account ${toNumber(row.accNum) ?? "—"}`}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                        <span className="font-mono">
                          accNum {toNumber(row.accNum) ?? "—"}
                        </span>
                        {isSelected ? (
                          <Badge className="bg-blue-600/10 text-blue-200 hover:bg-blue-600/20">
                            Active
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 opacity-60">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white/80">MetaTrader 4</div>
                <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  Coming soon
                </div>
              </div>
              <div className="mt-2 text-xs text-white/55">No connections yet.</div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            Coming soon
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 opacity-60">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white/80">MetaTrader 5</div>
                <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  Coming soon
                </div>
              </div>
              <div className="mt-2 text-xs text-white/55">No connections yet.</div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            Coming soon
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 opacity-60">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white/80">Binance</div>
                <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  Coming soon
                </div>
              </div>
              <div className="mt-2 text-xs text-white/55">No connections yet.</div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            Coming soon
          </TooltipContent>
        </Tooltip>
      </aside>

      <section className="min-w-0">{props.children}</section>
    </div>
  );
}

