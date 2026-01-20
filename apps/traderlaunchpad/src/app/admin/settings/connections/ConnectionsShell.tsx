"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { cn } from "~/lib/utils";
import { Badge } from "@acme/ui/badge";

type Props = { children: React.ReactNode };

export function ConnectionsShell(props: Props) {
  const pathname = usePathname();
  const data = useQuery(api.traderlaunchpad.queries.getMyTradeLockerConnection);

  const connection = (data as any)?.connection as any | undefined;
  const accounts: Array<any> = Array.isArray((data as any)?.accounts)
    ? (data as any).accounts
    : [];

  const providerStatus: string =
    typeof connection?.status === "string" ? connection.status : "disconnected";
  const isConnected = providerStatus === "connected";

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
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
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white/80">Accounts</div>
            <div className="text-xs text-white/50">
              {accounts.length} total
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {accounts.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/60">
                No accounts yet.
              </div>
            ) : (
              accounts.map((row) => {
                const id = String(row?._id ?? "");
                const href = `/admin/settings/connections/${id}`;
                const isActive = pathname === href;

                const isSelected =
                  Number(row?.accNum ?? 0) === Number(connection?.selectedAccNum ?? 0);

                return (
                  <Link
                    key={id}
                    href={href}
                    className={cn(
                      "block rounded-lg border border-white/10 bg-black/30 p-3 transition hover:bg-black/40",
                      isActive && "border-white/20 bg-black/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/85">
                          {typeof row?.name === "string" && row.name.trim()
                            ? row.name
                            : `Account ${String(row?.accNum ?? "—")}`}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
                          <span className="font-mono">
                            accNum {String(row?.accNum ?? "—")}
                          </span>
                          {isSelected ? (
                            <Badge className="bg-blue-600/10 text-blue-200 hover:bg-blue-600/20">
                              Active
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4 opacity-70">
          <div className="text-sm font-semibold text-white/80">MetaTrader 5</div>
          <div className="mt-1 text-xs text-white/55">Coming soon.</div>
        </div>
      </aside>

      <section className="min-w-0">{props.children}</section>
    </div>
  );
}

